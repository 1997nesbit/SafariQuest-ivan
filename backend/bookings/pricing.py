"""What a checkout booking costs, computed on the server.

The checkout pages (website/src/pages/Checkout.tsx, pages/plan/PlanPayment.tsx)
show the tourist the same numbers before they pay; the server used to record
whatever amounts the page sent back, so any caller could set their own price.
The arithmetic here deliberately mirrors the browser's — IEEE floats and
Math.round's round-half-up — so the figure on screen is the figure recorded.
Change one side and the other has to change with it.
"""

import math

from pricing.models import Season

CHILD_RATE = 0.5
DEPOSIT_RATE = 0.3


def _js_round(value: float) -> int:
    """JavaScript's Math.round for the positive amounts used here: halves round up."""
    return math.floor(value + 0.5)


def trip_total_for(booking, discount_percent=None) -> int:
    product = booking.safari if booking.safari_id else booking.region_safari
    # First season covering the start date, in the order the site lists them
    # (SeasonViewSet) — the same pick as lib/seasonalPrice.ts.
    season = (
        Season.objects.filter(start_date__lte=booking.start_date, end_date__gte=booking.start_date)
        .order_by("start_date", "id")
        .first()
    )
    adult_price = _js_round(product.price * float(season.multiplier)) if season else product.price
    child_price = _js_round(adult_price * CHILD_RATE)
    adults = booking.guests - booking.children
    total = adult_price * adults + child_price * booking.children
    if discount_percent:
        total = _js_round(total * (1 - float(discount_percent) / 100))
    return total


def deposit_for(trip_total: int) -> int:
    return _js_round(trip_total * DEPOSIT_RATE)
