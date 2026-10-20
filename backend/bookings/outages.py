"""Knowing when Snippe can't take payments, and acting on it.

Two sources feed PaymentOutage rows, both run by `manage.py check_snippe_outages`:

- Snippe's notice emails ("Scheduled Maintenance: Airtel Money Collections"), read over
  IMAP from a mailbox you configure. Only mail from Snippe's domain that passed DKIM is
  trusted — anyone can send an email that *says* it's from Snippe, and a forged one could
  otherwise switch payments off.
- Snippe's public status page (Instatus), for Snippe-wide trouble no email announces.

What the site does with them (payment_availability): a single network being down only
warns, because the tourist chooses the network on Snippe's page and can pick another;
an outage that `blocks_payments` (every channel, or Snippe itself) refuses new payments
with a message instead of sending the tourist to a checkout that will fail.
"""

import email
import html
import imaplib
import json
import logging
import re
import urllib.request
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from email import policy
from email.utils import parseaddr, parsedate_to_datetime
from zoneinfo import ZoneInfo

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.utils import timezone

from audit.utils import log_action
from config.mail import send_notification

from .models import PaymentAttempt, PaymentOutage, SnippeNotice

logger = logging.getLogger(__name__)

EAT = ZoneInfo("Africa/Dar_es_Salaam")

CHANNEL_PATTERNS = {
    PaymentOutage.CHANNEL_MPESA: r"\bm-?pesa\b|\bvodacom\b",
    PaymentOutage.CHANNEL_AIRTEL: r"\bairtel\b",
    PaymentOutage.CHANNEL_MIXX: r"\bmixx\b|\btigo\b|\byas\b",
    PaymentOutage.CHANNEL_HALOTEL: r"\bhalo\s*(?:tel|pesa)\b",
}
NETWORK_CHANNELS = frozenset(CHANNEL_PATTERNS)
# Audit-log actions written here.
ACTION_OUTAGE_RECORDED = "payments.outage_recorded"
ACTION_OUTAGE_ENDED = "payments.outage_ended"
ACTION_OUTAGE_DETECTED = "payments.outage_detected"
OUTAGE_WORDS = re.compile(
    r"\b(maintenance|outage|unavailable|downtime|disruption|interruption|degraded|suspended|disabled)\b", re.I
)
RESOLVED_WORDS = re.compile(r"\b(restored|resolved|back online|available again|now available|completed)\b", re.I)
# A notice only about payouts — which this site doesn't use — isn't about collections.
PAYOUT_WORDS = re.compile(r"\b(disbursements?|payouts?|withdrawals?)\b", re.I)
COLLECTION_WORDS = re.compile(r"\b(collections?|checkouts?|deposits?)\b", re.I)
MONTHS = (
    r"(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?"
    r"|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b\.?"
)
# "Saturday, 17 October 2026, at 5:00 PM", "Oct 17, 2026 17:00", "17/10/2026 17:00" (day
# first, as written in Tanzania) and "2026-10-17T17:00" — the weekday, "at" and AM/PM are
# optional; no AM/PM means a 24-hour time.
_TIME = r",?\s*(?:at\s*|T)?(?P<hour>\d{1,2})(?:[:.](?P<minute>\d{2}))?\s*(?P<ampm>[ap]\.?m\.?)?"
DATE_PATTERNS = [
    re.compile(rf"\b(?P<day>\d{{1,2}})(?:st|nd|rd|th)?\s+(?P<month>{MONTHS}),?\s+(?P<year>\d{{4}}){_TIME}", re.I),
    re.compile(rf"\b(?P<month>{MONTHS})\s+(?P<day>\d{{1,2}})(?:st|nd|rd|th)?,?\s+(?P<year>\d{{4}}){_TIME}", re.I),
    re.compile(rf"\b(?P<day>\d{{1,2}})[/.](?P<mnum>\d{{1,2}})[/.](?P<year>\d{{4}}){_TIME}", re.I),
    re.compile(rf"\b(?P<year>\d{{4}})-(?P<mnum>\d{{2}})-(?P<day>\d{{2}}){_TIME}", re.I),
]


# --- reading a notice ----------------------------------------------------------------


@dataclass
class Notice:
    kind: str | None  # "outage", "resolved", "payouts_only", or None when it's none of these
    channels: list = field(default_factory=list)
    starts_at: datetime | None = None
    ends_at: datetime | None = None


def _find_datetime(text):
    """The first date-and-time in `text`, in EAT, and where it ends — or (None, 0)."""
    matches = [m for m in (pattern.search(text) for pattern in DATE_PATTERNS) if m]
    if not matches:
        return None, 0
    match = min(matches, key=lambda m: m.start())
    hour = int(match["hour"])
    ampm = (match["ampm"] or "").replace(".", "").lower()
    if ampm == "pm" and hour != 12:
        hour += 12
    elif ampm == "am" and hour == 12:
        hour = 0
    try:
        groups = match.groupdict()
        month = int(groups["mnum"]) if groups.get("mnum") else datetime.strptime(groups["month"][:3], "%b").month
        found = datetime(int(match["year"]), month, int(match["day"]), hour, int(match["minute"] or 0), tzinfo=EAT)
    except ValueError:
        return None, 0
    return found, match.end()


def _parse_datetime(text):
    return _find_datetime(text)[0]


def _channels_in(text):
    return [channel for channel, pattern in CHANNEL_PATTERNS.items() if re.search(pattern, text, re.I)]


def _notice_kind(subject, body):
    """"outage", "resolved", "payouts_only", or None. The subject decides "it's over"
    ("Maintenance Completed", "Collections Restored"); any outage word anywhere makes it a
    new outage — unless it names payouts and not collections, judged on the subject when
    it mentions either, else on the body."""
    if RESOLVED_WORDS.search(subject):
        kind = "resolved"
    elif OUTAGE_WORDS.search(f"{subject}\n{body}"):
        kind = "outage"
    else:
        return None
    in_subject = PAYOUT_WORDS.search(subject) or COLLECTION_WORDS.search(subject)
    scope = subject if in_subject else body
    if PAYOUT_WORDS.search(scope) and not COLLECTION_WORDS.search(scope):
        return "payouts_only"
    return kind


def _notice_channels(subject, body):
    """From the subject when it names any network (the body tends to list every network,
    e.g. "other channels remain available"), else the body. None named — or every one —
    means all channels."""
    channels = _channels_in(subject) or _channels_in(body)
    if not channels or set(channels) == NETWORK_CHANNELS:
        return [PaymentOutage.CHANNEL_ALL]
    return channels


def _notice_window(body):
    """(starts_at, ends_at) from "Start: <date> - End: <date>"; without those labels, the
    first two dates in the body. Either may be None."""
    start_label = re.search(r"\b(?:start|starts|from)\s*:", body, re.I)
    end_label = re.search(r"\b(?:end|ends|until|to)\s*:", body, re.I)
    if start_label or end_label:
        starts_at = _parse_datetime(body[start_label.end():]) if start_label else None
        ends_at = _parse_datetime(body[end_label.end():]) if end_label else None
    else:
        starts_at, end_of_start = _find_datetime(body)
        ends_at = _parse_datetime(body[end_of_start:]) if starts_at else None
    if starts_at and ends_at and ends_at <= starts_at:
        ends_at = None
    return starts_at, ends_at


def parse_notice(subject, body):
    """Reads one Snippe email: what kind of notice it is, which networks, and when."""
    kind = _notice_kind(subject, body)
    if kind in (None, "payouts_only"):
        return Notice(kind=kind)
    starts_at, ends_at = _notice_window(body)
    return Notice(kind=kind, channels=_notice_channels(subject, body), starts_at=starts_at, ends_at=ends_at)


def _body_text(message):
    part = message.get_body(preferencelist=("plain", "html"))
    if part is None:
        return ""
    content = part.get_content()
    if part.get_content_type() == "text/html":
        content = re.sub(r"(?is)<(script|style).*?</\1>", " ", content)
        content = re.sub(r"(?i)<br\s*/?>|</p>|</div>|</li>|</h\d>", "\n", content)
        content = html.unescape(re.sub(r"<[^>]+>", " ", content))
    return re.sub(r"[ \t\xa0]+", " ", content).strip()


def _is_from_snippe(message):
    """The From domain is Snippe's, and — unless switched off — the receiving mail server
    recorded a DKIM pass signed by that domain (Gmail and most hosts add this header)."""
    sender = parseaddr(message.get("From", ""))[1].lower()
    domain = sender.rpartition("@")[2]
    allowed = settings.SNIPPE_NOTICES_SENDER_DOMAINS
    if not any(domain == d or domain.endswith("." + d) for d in allowed):
        return False
    if not settings.SNIPPE_NOTICES_REQUIRE_DKIM:
        return True
    results = " ".join(message.get_all("Authentication-Results") or []).lower()
    return any(
        re.search(rf"dkim=pass[^;]*header\.(?:d|i)=@?(?:[\w-]+\.)*{re.escape(d)}\b", results) for d in allowed
    )


# --- acting on a notice ----------------------------------------------------------------


def _admin_emails():
    return list(
        get_user_model().objects.filter(role="admin", is_active=True).exclude(email="").values_list("email", flat=True)
    )


def _alert_admins(subject, message):
    recipients = _admin_emails()
    if recipients:
        send_notification(subject=subject, message=message, recipient_list=recipients)


def _local(dt):
    return timezone.localtime(dt, EAT).strftime("%a %d %b %Y, %I:%M %p")


def ingest_email(raw_bytes):
    """Acts on one raw email: records it, and opens or ends outages. Returns the outcome,
    or None for a message already handled."""
    message = email.message_from_bytes(raw_bytes, policy=policy.default)
    message_id = (message.get("Message-ID") or "").strip()[:300]
    subject = str(message.get("Subject", "")).strip()[:300]
    sender = str(message.get("From", ""))[:300]
    if not message_id or SnippeNotice.objects.filter(message_id=message_id).exists():
        return None
    try:
        received_at = parsedate_to_datetime(message.get("Date"))
    except (TypeError, ValueError):
        received_at = timezone.now()

    if not _is_from_snippe(message):
        outcome = "Ignored: not verifiably from Snippe (sender domain or DKIM check failed)."
        logger.warning("Ignored notice %r from %s: %s", subject, sender, outcome)
    else:
        outcome = _apply_notice(parse_notice(subject, _body_text(message)), message_id, subject, received_at)
    SnippeNotice.objects.create(
        message_id=message_id, subject=subject, sender=sender, received_at=received_at, outcome=outcome[:500]
    )
    return outcome


def _apply_notice(notice, message_id, subject, received_at):
    if notice.kind is None:
        return "No action: not an outage or maintenance notice."
    if notice.kind == "payouts_only":
        return "No action: only about payouts (disbursements), which this site doesn't use."

    labels = ", ".join(dict(PaymentOutage.CHANNEL_CHOICES)[c] for c in notice.channels)
    if notice.kind == "resolved":
        now = timezone.now()
        ended = PaymentOutage.objects.current(now).filter(
            source=PaymentOutage.SOURCE_EMAIL, channel__in=notice.channels
        )
        count = ended.update(ends_at=now)
        outcome = f"Ended {count} current outage(s) for {labels}."
        if count:
            log_action(None, ACTION_OUTAGE_ENDED, f"{outcome} Snippe email: {subject}"[:500])
        return outcome

    needs_review = notice.starts_at is None
    starts_at = notice.starts_at or received_at or timezone.now()
    with transaction.atomic():
        for channel in notice.channels:
            PaymentOutage.objects.get_or_create(
                source_ref=message_id,
                channel=channel,
                defaults={
                    "source": PaymentOutage.SOURCE_EMAIL,
                    "blocks_payments": channel == PaymentOutage.CHANNEL_ALL,
                    "starts_at": starts_at,
                    "ends_at": notice.ends_at,
                    "subject": subject,
                    # A notice whose window couldn't be read isn't applied on a guess.
                    "is_active": not needs_review,
                    "review_note": "Couldn't read the start time from the email — check it, set the times, "
                    "then tick Is active." if needs_review else "",
                },
            )
    window = f"{_local(starts_at)} – {_local(notice.ends_at) if notice.ends_at else 'until further notice'} (EAT)"
    if needs_review:
        outcome = f"Needs review: outage for {labels} recorded but not active; its times couldn't be read."
    else:
        outcome = f"Outage recorded for {labels}: {window}."
    log_action(None, ACTION_OUTAGE_RECORDED, f"{outcome} Snippe email: {subject}"[:500])
    if needs_review or PaymentOutage.CHANNEL_ALL in notice.channels:
        _alert_admins(
            f"Snippe outage notice: {subject}",
            f"{outcome}\n\nReview it in Django admin under Bookings → Payment outages.",
        )
    return outcome


def fetch_notice_emails():
    """Reads recent Snippe emails from the configured mailbox (read-only: nothing is
    marked read or moved) and acts on any not seen before. Returns the outcomes."""
    host = settings.SNIPPE_NOTICES_IMAP_HOST
    if not host:
        return []
    since = (timezone.now() - timedelta(days=settings.SNIPPE_NOTICES_LOOKBACK_DAYS)).strftime("%d-%b-%Y")
    outcomes = []
    with imaplib.IMAP4_SSL(host, settings.SNIPPE_NOTICES_IMAP_PORT, timeout=30) as mailbox:
        mailbox.login(settings.SNIPPE_NOTICES_IMAP_USER, settings.SNIPPE_NOTICES_IMAP_PASSWORD)
        mailbox.select(f'"{settings.SNIPPE_NOTICES_IMAP_FOLDER}"', readonly=True)
        _, found = mailbox.search(None, "SINCE", since, "FROM", '"snippe"')
        for number in found[0].split():
            _, data = mailbox.fetch(number, "(BODY.PEEK[])")
            raw = next((part[1] for part in data if isinstance(part, tuple)), None)
            if raw is None:
                continue
            try:
                outcome = ingest_email(raw)
            except Exception:
                # One unreadable email mustn't stop the rest being checked.
                logger.exception("Failed to process Snippe notice email %s", number)
                continue
            if outcome:
                outcomes.append(outcome)
    return outcomes


# --- the status page -------------------------------------------------------------------

STATUS_COMPONENT = "Snippe API"
BLOCKING_STATUSES = {"MAJOROUTAGE", "UNDERMAINTENANCE"}
WARNING_STATUSES = {"PARTIALOUTAGE", "DEGRADEDPERFORMANCE"}


def _fetch_component_status():
    url = settings.SNIPPE_STATUS_URL.rstrip("/") + "/v2/components.json"
    request = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "SafariQuest"})
    with urllib.request.urlopen(request, timeout=15) as response:
        components = json.loads(response.read()).get("components") or []
    for component in components:
        if component.get("name") == STATUS_COMPONENT:
            return component.get("status")
    return None


def check_status_page():
    """Opens an outage while Snippe's API is reported down or degraded, and ends it once
    the status page says it's operational again. Returns a description of any change."""
    try:
        status = _fetch_component_status()
    except Exception as exc:  # network trouble, bad JSON: try again next run
        logger.warning("Could not read Snippe's status page: %s", exc)
        return None
    if status is None:
        return None

    now = timezone.now()
    open_rows = PaymentOutage.objects.current(now).filter(source=PaymentOutage.SOURCE_STATUS_PAGE)
    blocking = status in BLOCKING_STATUSES
    if status not in BLOCKING_STATUSES | WARNING_STATUSES:
        if open_rows.update(ends_at=now):
            change = f"Snippe status page reports {STATUS_COMPONENT} {status}; status-page outage ended."
            log_action(None, ACTION_OUTAGE_ENDED, change)
            return change
        return None
    if open_rows.filter(blocks_payments=blocking).exists():
        return None
    open_rows.update(ends_at=now)
    PaymentOutage.objects.create(
        channel=PaymentOutage.CHANNEL_ALL,
        blocks_payments=blocking,
        starts_at=now,
        source=PaymentOutage.SOURCE_STATUS_PAGE,
        source_ref=f"status-page:{now.isoformat()}",
        subject=f"{STATUS_COMPONENT}: {status}",
    )
    change = f"Snippe status page reports {STATUS_COMPONENT} {status}; payments {'blocked' if blocking else 'warned'}."
    log_action(None, ACTION_OUTAGE_RECORDED, change)
    if blocking:
        _alert_admins("Snippe is down — online payments paused", change)
    return change


# --- failures Snippe didn't announce ----------------------------------------------------

# Failures the tourist caused — they say nothing about whether the network works.
USER_CAUSED = re.compile(
    r"declin|cancel|insufficient|not enough|balance|\bpin\b|invalid (?:phone|number|msisdn|account)"
    r"|not registered|limit exceeded",
    re.I,
)


def channel_for_provider(provider):
    """Snippe's provider name ("mpesa", "airtel", "MPESA", "tigo"…) as one of our channels,
    or None for one we don't recognise."""
    provider = (provider or "").lower()
    for channel, pattern in CHANNEL_PATTERNS.items():
        if re.search(pattern, provider) or provider.replace("-", "").replace(" ", "") == channel:
            return channel
    return None


def _attempt_channel(data):
    """The network a webhook's payment went through: `channel.provider` in the current
    payload format, `payment_channel` in the legacy one."""
    channel_info = data.get("channel") or {}
    provider = channel_info.get("provider") if isinstance(channel_info, dict) else None
    return channel_for_provider(provider or data.get("payment_channel"))


def _failures_since_last_success(channel, since):
    """This network's countable failures since `since`, after its most recent success."""
    recent = PaymentAttempt.objects.filter(channel=channel, created_at__gte=since)
    last_success = recent.filter(succeeded=True).order_by("-created_at").values_list("created_at", flat=True).first()
    failures = recent.filter(counts_toward_outage=True)
    if last_success:
        failures = failures.filter(created_at__gt=last_success)
    return failures


def _open_detected_outage(channel, failure_count, reason, now, window):
    label = dict(PaymentOutage.CHANNEL_CHOICES)[channel]
    minutes = settings.SNIPPE_FAILURE_WINDOW_MINUTES
    PaymentOutage.objects.create(
        channel=channel,
        blocks_payments=False,
        starts_at=now,
        ends_at=now + window,
        source=PaymentOutage.SOURCE_DETECTED,
        source_ref=f"detected:{channel}:{now.isoformat()}",
        subject=f"{failure_count} {label} payments failed in {minutes} minutes",
    )
    change = (
        f"{failure_count} {label} payments failed within {minutes} minutes with none succeeding "
        f"(latest: {reason or 'no reason given'}). Tourists are now warned to use another network."
    )
    log_action(None, ACTION_OUTAGE_DETECTED, change[:500])
    logger.warning(change)
    _alert_admins(
        f"{label} payments are failing",
        f"{change}\n\nSnippe hasn't announced an outage. "
        "See Bookings → Payment attempts and Payment outages in Django admin.",
    )


def record_attempt(*, event_id, payment, data, succeeded):
    """Records one attempt from a payment.completed / payment.failed webhook and updates
    the detected outage for its network: a success ends it; enough failures from
    different payments with no success in between start (or extend) it."""
    channel = _attempt_channel(data)
    if channel is None:
        return None
    reason = str(data.get("failure_reason") or "")[:300]
    try:
        with transaction.atomic():
            attempt = PaymentAttempt.objects.create(
                event_id=str(event_id or "")[:100],
                payment=payment,
                channel=channel,
                succeeded=succeeded,
                counts_toward_outage=not succeeded and not USER_CAUSED.search(reason),
                failure_reason=reason,
            )
    except IntegrityError:
        return None  # a retried webhook event, already counted

    now = timezone.now()
    window = timedelta(minutes=settings.SNIPPE_FAILURE_WINDOW_MINUTES)
    detected = PaymentOutage.objects.current(now).filter(source=PaymentOutage.SOURCE_DETECTED, channel=channel)

    if succeeded:
        if detected.update(ends_at=now):
            label = dict(PaymentOutage.CHANNEL_CHOICES)[channel]
            log_action(None, ACTION_OUTAGE_ENDED, f"{label} payments are going through again; detected outage ended.")
        return attempt
    if not attempt.counts_toward_outage:
        return attempt

    if detected.exists():
        detected.update(ends_at=now + window)  # still failing: keep the warning up
        return attempt
    failures = _failures_since_last_success(channel, now - window)
    distinct_payments = failures.exclude(payment=None).values("payment").distinct().count()
    if (
        failures.count() >= settings.SNIPPE_FAILURE_THRESHOLD
        and distinct_payments >= settings.SNIPPE_FAILURE_MIN_PAYMENTS
    ):
        _open_detected_outage(channel, failures.count(), reason, now, window)
    return attempt


# --- what the site shows -----------------------------------------------------------------


def describe(outage):
    until = f" until {_local(outage.ends_at)} (EAT)" if outage.ends_at else ""
    if outage.channel != PaymentOutage.CHANNEL_ALL:
        label = outage.get_channel_display()
        others = [label for c, label in PaymentOutage.CHANNEL_CHOICES if c not in (outage.channel, "all")]
        alternatives = f"{', '.join(others[:-1])} or {others[-1]}"
        if outage.source == PaymentOutage.SOURCE_DETECTED:
            # Inferred from failures, so there's no announced end time to quote.
            return f"{label} payments are failing at the moment. We recommend paying with {alternatives}."
        return f"{label} payments are unavailable{until}. You can still pay with {alternatives}."
    if outage.blocks_payments:
        return (
            f"Mobile money payments are temporarily unavailable{until}. Your booking is saved — "
            "please come back and pay once the service is restored."
        )
    return f"Mobile money payments may be slow or fail right now{until}. If yours doesn't go through, try again shortly."


def payment_availability():
    """{"blocked", "message", "warnings"} for the pay endpoints and the checkout pages."""
    current = list(PaymentOutage.objects.current())
    blocking = next((o for o in current if o.blocks_payments), None)
    # The same network can be reported twice (an email and a re-sent email): say it once.
    warnings = list(dict.fromkeys(describe(o) for o in current if not o.blocks_payments))
    return {
        "blocked": blocking is not None,
        "message": describe(blocking) if blocking else None,
        "warnings": warnings,
    }
