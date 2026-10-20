from django.core.management.base import BaseCommand

from bookings.outages import check_status_page, fetch_notice_emails, payment_availability


class Command(BaseCommand):
    help = (
        "Reads Snippe's notice emails and status page and records payment outages "
        "(bookings.outages). Safe to run repeatedly; schedule it every ~10 minutes."
    )

    def handle(self, *args, **options):
        try:
            outcomes = fetch_notice_emails()
        except Exception as exc:  # a mailbox problem shouldn't skip the status check
            self.stderr.write(f"Email check failed: {exc}")
            outcomes = []
        for outcome in outcomes:
            self.stdout.write(f"email: {outcome}")
        change = check_status_page()
        if change:
            self.stdout.write(f"status page: {change}")

        availability = payment_availability()
        if availability["blocked"]:
            self.stdout.write(self.style.WARNING(f"Payments blocked: {availability['message']}"))
        for warning in availability["warnings"]:
            self.stdout.write(self.style.WARNING(f"Warning shown: {warning}"))
        if not availability["blocked"] and not availability["warnings"]:
            self.stdout.write(self.style.SUCCESS("No current outages."))
