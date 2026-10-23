import unittest
from datetime import datetime, timezone
from unittest.mock import patch

from app.config import settings
from app.models import QuotationRequest
from app.routers.admin import QuotationActionRequest
from app.quotation_documents import (
    PAYMENT_TERMS,
    _send_email_sync,
    calculate_quotation_totals,
    render_quotation_pdf,
    validate_quotation_for_approval,
)


def make_quotation(**overrides):
    values = {
        "customer_name": "A Customer",
        "company": "Example Industries",
        "email": "customer@example.invalid",
        "recommended_product": "Standard Nozzle",
        "quotation_product": "Standard Nozzle",
        "quantity": 3,
        "unit_price": 1200,
        "tax_rate_percent": 18,
        "shipping_charge": 100,
        "customization_charge": 50,
        "currency": "INR",
        "validity_days": 30,
        "payment_terms": "50% advance; balance before dispatch",
        "quotation_issued_at": datetime(2026, 10, 22, tzinfo=timezone.utc),
    }
    values.update(overrides)
    return QuotationRequest.model_construct(**values)


class QuotationDocumentTests(unittest.TestCase):
    def test_admin_approval_defaults_payment_terms(self):
        request = QuotationActionRequest(action="Approved")

        self.assertEqual(request.payment_terms, PAYMENT_TERMS)

    def test_admin_can_change_payment_terms(self):
        custom_terms = "Full payment before dispatch."
        request = QuotationActionRequest(action="Approved", payment_terms=custom_terms)

        self.assertEqual(request.payment_terms, custom_terms)

    def test_totals_include_quantity_and_tax_on_all_charges(self):
        quotation = make_quotation()

        self.assertEqual(
            calculate_quotation_totals(quotation),
            {
                "quotation_subtotal": 3600.0,
                "tax_amount": 675.0,
                "quotation_total": 4425.0,
            },
        )

    def test_pdf_is_generated_for_a_complete_quotation(self):
        pdf = render_quotation_pdf(make_quotation())

        self.assertTrue(pdf.startswith(b"%PDF-"))
        self.assertGreater(len(pdf), 1000)

    def test_email_includes_the_pdf_attachment(self):
        quotation = make_quotation()
        pdf = render_quotation_pdf(quotation)
        with (
            patch.object(settings, "SMTP_USERNAME", "sender@example.invalid"),
            patch.object(settings, "SMTP_PASSWORD", "mock-only"),
            patch.object(settings, "SMTP_FROM_EMAIL", "sender@example.invalid"),
            patch.object(settings, "SMTP_HOST", "smtp.example.invalid"),
            patch.object(settings, "SMTP_PORT", 587),
            patch("app.quotation_documents.smtplib.SMTP") as smtp,
        ):
            _send_email_sync(quotation, pdf)

        sent_message = smtp.return_value.__enter__.return_value.send_message.call_args.args[0]
        attachment = next(sent_message.iter_attachments())
        self.assertEqual(
            sent_message["Subject"],
            f"Your quotation from WaveNxD Technologies is ready (Ref: {quotation.id})",
        )
        self.assertEqual(
            sent_message["From"],
            "WaveNxD Technologies <sender@example.invalid>",
        )
        self.assertEqual(sent_message["Reply-To"], "sender@example.invalid")
        self.assertIsNotNone(sent_message["Date"])
        self.assertTrue(sent_message["Message-ID"].startswith("<"))
        self.assertEqual(sent_message["To"], quotation.email)
        self.assertEqual(attachment.get_filename(), f"WaveNxD-Quotation-{quotation.id}.pdf")
        self.assertEqual(attachment.get_content(), pdf)

    def test_approval_rejects_missing_payment_terms(self):
        quotation = make_quotation(payment_terms=None)

        with self.assertRaisesRegex(ValueError, "payment terms"):
            validate_quotation_for_approval(quotation)

    def test_approval_rejects_invalid_quantity(self):
        quotation = make_quotation()
        quotation.quantity = 0

        with self.assertRaisesRegex(ValueError, "Quantity"):
            validate_quotation_for_approval(quotation)


if __name__ == "__main__":
    unittest.main()
