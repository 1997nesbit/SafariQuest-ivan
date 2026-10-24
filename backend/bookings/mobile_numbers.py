"""Tanzanian mobile numbers: the one format Snippe accepts, and which network a number
is on — so the site can turn a number away during that network's outage before a
payment prompt is ever sent (bookings.outages)."""

import re

from .models import PaymentOutage

# Network by the two digits after the leading 0 (07x / 06x). TTCL's 073 (T-Pesa) isn't
# offered by Snippe, so it has no entry and is refused like any unknown prefix.
PREFIX_CHANNELS = {
    "61": PaymentOutage.CHANNEL_HALOTEL,
    "62": PaymentOutage.CHANNEL_HALOTEL,
    "65": PaymentOutage.CHANNEL_MIXX,
    "67": PaymentOutage.CHANNEL_MIXX,
    "71": PaymentOutage.CHANNEL_MIXX,
    "77": PaymentOutage.CHANNEL_MIXX,
    "68": PaymentOutage.CHANNEL_AIRTEL,
    "69": PaymentOutage.CHANNEL_AIRTEL,
    "78": PaymentOutage.CHANNEL_AIRTEL,
    "74": PaymentOutage.CHANNEL_MPESA,
    "75": PaymentOutage.CHANNEL_MPESA,
    "76": PaymentOutage.CHANNEL_MPESA,
}


def normalize(raw):
    """"0754 123 456", "+255 754 123 456", "255754123456" or "754123456" → "255754123456";
    None for anything that isn't a Tanzanian mobile number."""
    digits = re.sub(r"\D", "", raw or "")
    if digits.startswith("255"):
        digits = digits[3:]
    elif digits.startswith("0"):
        digits = digits[1:]
    if len(digits) != 9 or digits[0] not in "67":
        return None
    return "255" + digits


def network_for(msisdn):
    """The channel for a normalized number, or None for a prefix Snippe doesn't take."""
    return PREFIX_CHANNELS.get(msisdn[3:5]) if msisdn else None


def masked(msisdn):
    """"0754 *** 456" — enough for the tourist to recognise their number on screen."""
    local = "0" + msisdn[3:]
    return f"{local[:4]} *** {local[-3:]}"
