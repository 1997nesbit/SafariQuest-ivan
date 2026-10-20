from django.core.management.base import BaseCommand

from bookings.payments import reconcile_open_payments


class Command(BaseCommand):
    help = (
        "Confirms open Snippe payments by asking Snippe directly — the safety net for a "
        "webhook that never arrives. Safe to run repeatedly; schedule it every ~5 minutes."
    )

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=50, help="Most payments to check in one run.")

    def handle(self, *args, **options):
        counts = reconcile_open_payments(limit=options["limit"])
        message = (
            f"Checked {counts['checked']} open payment(s): {counts['completed']} confirmed, "
            f"{counts['closed']} failed or expired."
        )
        self.stdout.write(self.style.SUCCESS(message) if counts["checked"] else message)
