"""The site's two currencies. A booking is priced and paid in exactly one of them, chosen
at checkout: TZS through Snippe (mobile money), USD through Senjaropay (card). Amounts
in different currencies are never added together — totals are kept per currency."""

TZS = "TZS"
USD = "USD"
CHOICES = [(TZS, "Tanzanian shilling (TZS)"), (USD, "US dollar (USD)")]
CURRENCIES = (TZS, USD)

# Which payment provider takes each currency.
PROVIDER_SNIPPE = "snippe"
PROVIDER_SENJAROPAY = "senjaropay"
PROVIDER_FOR = {TZS: PROVIDER_SNIPPE, USD: PROVIDER_SENJAROPAY}
PROVIDER_LABELS = {PROVIDER_SNIPPE: "Snippe", PROVIDER_SENJAROPAY: "Senjaropay"}


def product_price(product, currency):
    """A safari's per-adult price in `currency`, or None when it has no price in it
    (only TZS is required; the USD price is optional)."""
    return product.price if currency == TZS else product.price_usd


def format_amount(amount, currency):
    """"TZS 1,200,000" / "USD 3,400" — for emails and audit-log text."""
    return f"{currency} {amount:,}"
