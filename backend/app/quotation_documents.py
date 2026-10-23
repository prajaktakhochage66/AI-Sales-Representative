"""Quotation totals, PDF rendering, and SMTP delivery."""

import asyncio
import math
import re
import smtplib
import ssl
from datetime import datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP
from email.message import EmailMessage
from email.utils import format_datetime, formataddr, make_msgid, parseaddr
from io import BytesIO
from typing import Any
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.config import settings
from app.models import QuotationRequest

CENT = Decimal("0.01")
INDIAN_STANDARD_TIME = timezone(timedelta(hours=5, minutes=30))
PAYMENT_TERMS = "50% advance payment and 50% before dispatch, subject to company approval."


class QuotationEmailDeliveryError(Exception):
    """Raised after an approved quotation is saved but email delivery fails."""


def _money(value: Any) -> Decimal:
    return Decimal(str(value or 0)).quantize(CENT, rounding=ROUND_HALF_UP)


def calculate_quotation_totals(quotation: QuotationRequest) -> dict[str, float]:
    subtotal = _money(_money(quotation.unit_price) * quotation.quantity)
    shipping = _money(quotation.shipping_charge)
    customization = _money(quotation.customization_charge)
    tax_base = subtotal + shipping + customization
    tax = (tax_base * Decimal(str(quotation.tax_rate_percent or 0)) / Decimal("100")).quantize(
        CENT, rounding=ROUND_HALF_UP
    )
    total = tax_base + tax
    return {
        "quotation_subtotal": float(subtotal),
        "tax_amount": float(tax),
        "quotation_total": float(total),
    }


def validate_quotation_for_approval(quotation: QuotationRequest) -> None:
    required = {
        "unit price": quotation.unit_price,
        "verified product": quotation.quotation_product,
        "tax rate": quotation.tax_rate_percent,
        "shipping charge": quotation.shipping_charge,
        "customization charge": quotation.customization_charge,
        "validity period": quotation.validity_days,
        "payment terms": quotation.payment_terms,
    }
    missing = [label for label, value in required.items() if value is None]
    if missing:
        raise ValueError(f"Complete the following quotation fields before approval: {', '.join(missing)}.")
    if quotation.quantity < 1:
        raise ValueError("Quantity must be at least 1.")
    if not quotation.quotation_product or not quotation.quotation_product.strip():
        raise ValueError("The verified product name is required before approval.")
    parsed_email = parseaddr(quotation.email)[1]
    if parsed_email != quotation.email or "@" not in parsed_email:
        raise ValueError("A valid customer email address is required for quotation delivery.")
    if not quotation.currency or re.fullmatch(r"[A-Za-z]{3}", quotation.currency) is None:
        raise ValueError("Currency must be a three-letter currency code.")
    for label, value in (
        ("Unit price", quotation.unit_price),
        ("Tax rate", quotation.tax_rate_percent),
        ("Shipping charge", quotation.shipping_charge),
        ("Customization charge", quotation.customization_charge),
    ):
        if value is None or not math.isfinite(value) or value < 0:
            raise ValueError(f"{label} must be a finite non-negative amount.")
    if quotation.tax_rate_percent is not None and quotation.tax_rate_percent > 100:
        raise ValueError("Tax rate cannot exceed 100%.")
    if not quotation.payment_terms or not quotation.payment_terms.strip():
        raise ValueError("Payment terms are required before approval.")
    if quotation.validity_days is None or not 1 <= quotation.validity_days <= 365:
        raise ValueError("Quotation validity must be between 1 and 365 days.")


def smtp_is_configured() -> bool:
    return settings.SMTP_CONFIGURED


def prepare_quotation_for_approval(quotation: QuotationRequest) -> bytes:
    validate_quotation_for_approval(quotation)
    if not smtp_is_configured():
        raise RuntimeError(
            "SMTP is not configured. Set SMTP_USERNAME and SMTP_PASSWORD in backend/.env."
        )
    quotation.quotation_issued_at = datetime.now(timezone.utc)
    quotation.quotation_valid_until = (
        quotation.quotation_issued_at.astimezone(INDIAN_STANDARD_TIME).date()
        + timedelta(days=quotation.validity_days or 30)
    )
    totals = calculate_quotation_totals(quotation)
    quotation.quotation_subtotal = totals["quotation_subtotal"]
    quotation.tax_amount = totals["tax_amount"]
    quotation.quotation_total = totals["quotation_total"]
    return render_quotation_pdf(quotation)


async def email_approved_quotation(
    quotation: QuotationRequest,
    pdf_bytes: bytes | None = None,
) -> None:
    if not smtp_is_configured():
        raise RuntimeError(
            "SMTP is not configured. Set SMTP_USERNAME and SMTP_PASSWORD in backend/.env."
        )

    pdf_bytes = pdf_bytes or render_quotation_pdf(quotation)
    quotation.quotation_email_status = "sending"
    await quotation.save()
    try:
        await send_quotation_email(quotation, pdf_bytes)
    except (smtplib.SMTPException, OSError, ssl.SSLError) as error:
        quotation.quotation_email_status = "failed"
        await quotation.save()
        raise QuotationEmailDeliveryError from error

    quotation.quotation_email_status = "sent"
    quotation.quotation_email_sent_at = datetime.now(timezone.utc)
    await quotation.save()


def render_quotation_pdf(quotation: QuotationRequest) -> bytes:
    validate_quotation_for_approval(quotation)
    buffer = BytesIO()
    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=18 * mm,
        title=f"WaveNxD Quotation {quotation.id}",
        author="WaveNxD Technologies Pvt. Ltd.",
    )
    base_styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "QuotationTitle", parent=base_styles["Title"], fontName="Helvetica-Bold",
        fontSize=21, leading=26, textColor=colors.HexColor("#102a43"), alignment=TA_CENTER,
    )
    subtitle_style = ParagraphStyle(
        "QuotationSubtitle", parent=base_styles["Normal"], fontSize=9,
        textColor=colors.HexColor("#52606d"), alignment=TA_CENTER,
    )
    section_style = ParagraphStyle(
        "QuotationSection", parent=base_styles["Heading2"], fontSize=10,
        leading=13, textColor=colors.HexColor("#087e8b"), spaceBefore=8, spaceAfter=5,
    )
    normal_style = ParagraphStyle(
        "QuotationBody", parent=base_styles["BodyText"], fontSize=9,
        leading=13, textColor=colors.HexColor("#243b53"),
    )
    small_style = ParagraphStyle(
        "QuotationSmall", parent=normal_style, fontSize=8, leading=11,
        textColor=colors.HexColor("#52606d"),
    )
    right_style = ParagraphStyle("QuotationRight", parent=normal_style, alignment=TA_RIGHT)
    header_style = ParagraphStyle(
        "QuotationHeader", parent=normal_style, fontName="Helvetica-Bold",
        textColor=colors.white,
    )

    issued_at = quotation.quotation_issued_at or datetime.now(timezone.utc)
    local_issued = issued_at.astimezone(INDIAN_STANDARD_TIME)
    valid_until = quotation.quotation_valid_until or (
        local_issued.date() + timedelta(days=quotation.validity_days or 30)
    )
    currency = quotation.currency.upper()
    totals = calculate_quotation_totals(quotation)

    def paragraph(value: Any, style: ParagraphStyle = normal_style) -> Paragraph:
        safe_value = escape(str(value or "—")).replace("\n", "<br/>")
        return Paragraph(safe_value, style)

    story = [
        Paragraph("WaveNxD", title_style),
        Paragraph("TECHNOLOGIES PVT. LTD.  |  KOLHAPUR, MAHARASHTRA", subtitle_style),
        Spacer(1, 7 * mm),
        Paragraph("QUOTATION", ParagraphStyle(
            "QuotationHeading", parent=title_style, fontSize=15, leading=18,
            textColor=colors.HexColor("#087e8b"),
        )),
        Spacer(1, 4 * mm),
    ]

    meta = [
        [paragraph(f"Quotation ID: {quotation.id}"), paragraph(f"Issued: {local_issued.strftime('%d %b %Y')}", right_style)],
        [paragraph(f"Valid until: {valid_until.strftime('%d %b %Y')}"), paragraph(f"Currency: {currency}", right_style)],
    ]
    meta_table = Table(meta, colWidths=[85 * mm, 85 * mm])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f0f7f8")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#c8e2e5")),
        ("INNERGRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#d9e8eb")),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.extend([meta_table, Paragraph("Prepared for", section_style)])
    customer_lines = [quotation.customer_name]
    if quotation.company:
        customer_lines.append(quotation.company)
    customer_lines.extend([quotation.email, quotation.phone or ""])
    customer = Paragraph("<br/>".join(escape(line) for line in customer_lines if line), normal_style)
    story.extend([customer, Paragraph("Product and requirements", section_style)])

    product = quotation.quotation_product or quotation.recommended_product or "As specified in customer requirements"
    requirement_parts = [
        quotation.application,
        f"Liquid: {quotation.liquid_type}" if quotation.liquid_type else None,
        quotation.additional_requirements,
    ]
    requirements = "<br/>".join(escape(part) for part in requirement_parts if part)
    product_table = Table(
        [[paragraph("Product"), paragraph(product)],
         [paragraph("Application / requirements"), Paragraph(requirements or "—", small_style)]],
        colWidths=[50 * mm, 120 * mm],
    )
    product_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f0f7f8")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#c8e2e5")),
        ("INNERGRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#d9e8eb")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.extend([product_table, Paragraph("Price summary", section_style)])

    rows = [
        [paragraph("Description", header_style), paragraph("Qty", header_style), paragraph("Amount (" + currency + ")", header_style)],
        [paragraph(f"{product} — unit price"), paragraph(quotation.quantity, right_style),
         paragraph(f"{_money(quotation.unit_price):,.2f}", right_style)],
        [paragraph("Subtotal"), "", paragraph(f"{_money(totals['quotation_subtotal']):,.2f}", right_style)],
        [paragraph(f"Shipping charge"), "", paragraph(f"{_money(quotation.shipping_charge):,.2f}", right_style)],
        [paragraph("Customization charges"), "", paragraph(f"{_money(quotation.customization_charge):,.2f}", right_style)],
        [paragraph(f"Tax ({Decimal(str(quotation.tax_rate_percent)):g}%)"), "",
         paragraph(f"{_money(totals['tax_amount']):,.2f}", right_style)],
        [paragraph("TOTAL", ParagraphStyle(
            "QuotationTotalLabel", parent=normal_style, fontName="Helvetica-Bold",
        )), "", paragraph(f"{currency} {_money(totals['quotation_total']):,.2f}", right_style)],
    ]
    prices = Table(rows, colWidths=[92 * mm, 25 * mm, 53 * mm], repeatRows=1)
    prices.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#102a43")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#e8f6f6")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#c8d8e4")),
        ("INNERGRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#d9e2ec")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("SPAN", (0, 2), (1, 2)),
        ("SPAN", (0, 3), (1, 3)),
        ("SPAN", (0, 4), (1, 4)),
        ("SPAN", (0, 5), (1, 5)),
        ("SPAN", (0, 6), (1, 6)),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
    ]))
    story.extend([
        prices,
        Paragraph("Payment terms", section_style),
        paragraph(quotation.payment_terms),
        Spacer(1, 2 * mm),
        Paragraph(
            f"This quotation is valid for {quotation.validity_days} days, until "
            f"{valid_until.strftime('%d %b %Y')}. Tax is calculated on the subtotal, "
            "shipping, and customization charges. Prices and terms above are specific "
            "to this quotation.",
            small_style,
        ),
        Spacer(1, 7 * mm),
        Paragraph("Thank you for considering WaveNxD Technologies.", subtitle_style),
    ])
    document.build(story)
    return buffer.getvalue()


def _send_email_sync(quotation: QuotationRequest, pdf_bytes: bytes) -> None:
    if not smtp_is_configured():
        raise RuntimeError("SMTP email settings are incomplete.")

    message = EmailMessage()
    message["Subject"] = (
        f"Your quotation from WaveNxD Technologies is ready (Ref: {quotation.id})"
    )
    message["From"] = formataddr(("WaveNxD Technologies", settings.SMTP_FROM_EMAIL))
    message["Reply-To"] = settings.SMTP_FROM_EMAIL
    message["To"] = quotation.email
    message["Date"] = format_datetime(datetime.now(timezone.utc))
    message["Message-ID"] = make_msgid()
    message.set_content(
        f"Dear {quotation.customer_name},\n\n"
        "Thank you for your enquiry with WaveNxD Technologies Pvt. Ltd. "
        "Please find your approved quotation attached as a PDF. The quotation "
        f"is valid for {quotation.validity_days} days.\n\n"
        "Please contact our sales team if you have any questions.\n\n"
        "Regards,\nWaveNxD Technologies Pvt. Ltd.\nKolhapur, Maharashtra"
    )
    message.add_alternative(
        "<html><body style=\"font-family:Arial,sans-serif;color:#243b53\">"
        f"<p>Dear {escape(quotation.customer_name)},</p>"
        "<p>Thank you for your enquiry with <strong>WaveNxD Technologies Pvt. Ltd.</strong> "
        "Your approved quotation is attached as a PDF.</p>"
        f"<p>The quotation is valid for <strong>{quotation.validity_days} days</strong>.</p>"
        "<p>Please contact our sales team if you have any questions.</p>"
        "<p>Regards,<br><strong>WaveNxD Technologies Pvt. Ltd.</strong><br>"
        "Kolhapur, Maharashtra</p></body></html>",
        subtype="html",
    )
    message.add_attachment(
        pdf_bytes,
        maintype="application",
        subtype="pdf",
        filename=f"WaveNxD-Quotation-{quotation.id}.pdf",
    )

    context = ssl.create_default_context()
    if settings.SMTP_PORT == 465:
        with smtplib.SMTP_SSL(
            settings.SMTP_HOST, settings.SMTP_PORT, timeout=20, context=context
        ) as server:
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(message)
    else:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as server:
            server.ehlo()
            server.starttls(context=context)
            server.ehlo()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(message)


async def send_quotation_email(quotation: QuotationRequest, pdf_bytes: bytes) -> None:
    await asyncio.to_thread(_send_email_sync, quotation, pdf_bytes)
