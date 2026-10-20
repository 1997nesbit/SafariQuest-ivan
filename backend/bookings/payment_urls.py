from django.urls import path

from .views import PaymentAvailabilityView, SnippeWebhookView

urlpatterns = [
    path("availability/", PaymentAvailabilityView.as_view(), name="payment-availability"),
    path("snippe/webhook/", SnippeWebhookView.as_view(), name="snippe-webhook"),
]
