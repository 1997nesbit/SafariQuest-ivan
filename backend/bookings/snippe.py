"""Thin client for Snippe's hosted checkout (https://docs.snippe.sh, API 2026-01-25).

Only the two calls this site needs — create a session, read one back — plus webhook
signature verification. Plain urllib rather than an SDK so there's no new dependency
and the requests stay easy to stub in tests (patch `_request`).
"""

import hashlib
import hmac
import json
import time
import urllib.error
import urllib.request

from django.conf import settings

SESSIONS_PATH = "/api/v1/sessions"
# Snippe recommends rejecting webhooks older than this, against replays.
WEBHOOK_TOLERANCE_SECONDS = 300
REQUEST_TIMEOUT_SECONDS = 15


class SnippeError(Exception):
    """Snippe couldn't be reached, or answered with an error."""


def is_configured():
    return bool(settings.SNIPPE_API_KEY)


def _request(method, path, payload=None, idempotency_key=None, api_key=None):
    body = json.dumps(payload).encode() if payload is not None else None
    request = urllib.request.Request(
        settings.SNIPPE_API_URL + path,
        data=body,
        method=method,
        headers={
            "Authorization": f"Bearer {api_key or settings.SNIPPE_API_KEY}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )
    if idempotency_key:
        request.add_header("Idempotency-Key", idempotency_key)
    try:
        with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
            return json.loads(response.read() or b"{}")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode(errors="replace")[:500]
        raise SnippeError(f"Snippe {method} {path} returned {exc.code}: {detail}") from exc
    except (urllib.error.URLError, TimeoutError, ValueError) as exc:
        raise SnippeError(f"Snippe {method} {path} failed: {exc}") from exc


def create_session(*, amount, description, metadata, customer, redirect_url, idempotency_key):
    """Creates a checkout session and returns its `data` object (reference, checkout_url, …)."""
    payload = {
        "amount": amount,
        "currency": settings.SNIPPE_CURRENCY,
        "allowed_methods": ["mobile_money"],
        "description": description[:500],
        "metadata": metadata,
        "customer": {key: value for key, value in customer.items() if value},
        "redirect_url": redirect_url,
        "expires_in": settings.SNIPPE_SESSION_EXPIRES_IN,
    }
    if settings.SNIPPE_WEBHOOK_URL:
        payload["webhook_url"] = settings.SNIPPE_WEBHOOK_URL
    if settings.SNIPPE_PROFILE_ID:
        payload["profile_id"] = settings.SNIPPE_PROFILE_ID
    data = _request("POST", SESSIONS_PATH, payload, idempotency_key=idempotency_key).get("data") or {}
    if not data.get("reference") or not data.get("checkout_url"):
        raise SnippeError("Snippe created a session without a reference or checkout URL")
    return data


def get_session(reference):
    # Snippe scopes keys separately; reads use the collection:read key when one is set.
    api_key = settings.SNIPPE_READ_API_KEY or settings.SNIPPE_API_KEY
    return _request("GET", f"{SESSIONS_PATH}/{reference}", api_key=api_key).get("data") or {}


def verify_webhook(raw_body, timestamp, signature, now=None):
    """True when `signature` is Snippe's HMAC-SHA256 of "{timestamp}.{raw_body}" under our
    signing key and the timestamp is recent. `raw_body` must be the exact bytes received —
    re-serialising the JSON changes them and the signature no longer matches."""
    secret = settings.SNIPPE_WEBHOOK_SECRET
    if not secret or not timestamp or not signature:
        return False
    try:
        sent_at = int(timestamp)
    except ValueError:
        return False
    if abs((now or time.time()) - sent_at) > WEBHOOK_TOLERANCE_SECONDS:
        return False
    message = timestamp.encode() + b"." + raw_body
    expected = hmac.new(secret.encode(), message, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature.strip().lower())
