"""
recommender.py — Rule-based product recommendation logic.

Matches customer requirements against the product catalogue.
Recommendations are preliminary and subject to confirmation
from WaveNxD Technologies' technical team.
"""

from typing import List, Dict, Any, Optional
from app.products import PRODUCTS


def recommend_products(
    viscosity_cp: Optional[float] = None,
    flow_rate_ml_min: Optional[float] = None,
    droplet_size_um: Optional[float] = None,
    frequency_khz: Optional[float] = None,
    application: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Returns a filtered and scored list of products matching customer requirements.
    Returns all products if no requirements are specified.
    """

    scored: List[tuple] = []

    for product in PRODUCTS:
        score = 0
        reasons = []

        # ── Viscosity check ────────────────────────────────────────────────
        if viscosity_cp is not None:
            if viscosity_cp <= product["max_viscosity_cp"]:
                score += 3
                reasons.append(
                    f"Handles viscosity up to {product['max_viscosity_cp']} cP ✔"
                )
            else:
                continue  # Hard filter: skip products that cannot handle this viscosity

        # ── Flow rate check ────────────────────────────────────────────────
        if flow_rate_ml_min is not None:
            if flow_rate_ml_min <= product["flow_rate_max"]:
                score += 3
                reasons.append(
                    f"Supports flow rate up to {product['flow_rate_max']} ml/min ✔"
                )
            else:
                continue  # Hard filter

        # ── Droplet size check ─────────────────────────────────────────────
        if droplet_size_um is not None:
            diff = abs(product["droplet_size_um"] - droplet_size_um)
            if diff <= 5:
                score += 4
                reasons.append(f"Droplet size {product['droplet_size_um']} µm closely matches ✔")
            elif diff <= 15:
                score += 2
                reasons.append(f"Droplet size {product['droplet_size_um']} µm approximately matches")
            elif diff <= 30:
                score += 1
            # No hard filter on droplet size — finer is usually acceptable

        # ── Frequency check ────────────────────────────────────────────────
        if frequency_khz is not None:
            if abs(product["frequency_khz"] - frequency_khz) <= 5:
                score += 3
                reasons.append(f"Frequency {product['frequency_khz']} kHz matches ✔")
            elif abs(product["frequency_khz"] - frequency_khz) <= 30:
                score += 1

        # ── Application keyword match ──────────────────────────────────────
        if application:
            app_lower = application.lower()
            for app in product["applications"]:
                if any(word in app.lower() for word in app_lower.split()):
                    score += 2
                    reasons.append(f"Application '{app}' matches ✔")
                    break
            # Category check
            if product["category"].lower() in app_lower:
                score += 1

        # Default score if no filters applied
        if all(v is None for v in [viscosity_cp, flow_rate_ml_min, droplet_size_um, frequency_khz, application]):
            score = 1

        scored.append((score, product, reasons))

    # Sort by descending score
    scored.sort(key=lambda x: x[0], reverse=True)

    # Return top results with reasons attached
    results = []
    for score, product, reasons in scored:
        enriched = dict(product)
        enriched["match_score"] = score
        enriched["match_reasons"] = reasons
        results.append(enriched)

    return results


def build_recommendation_explanation(products: List[Dict[str, Any]], requirements: Dict) -> str:
    """Generates a human-readable explanation of recommendations."""
    if not products:
        return (
            "No products in our current catalogue exactly match all your specified requirements. "
            "Please contact WaveNxD Technologies directly for a custom solution — "
            "the team may be able to develop a nozzle tailored to your needs."
        )

    top = products[0]
    lines = [
        f"Based on your requirements, the **{top['name']}** is the closest match.",
        "",
        "**Match reasons:**",
    ]
    for reason in top.get("match_reasons", []):
        lines.append(f"- {reason}")

    if len(products) > 1:
        lines.append("")
        lines.append("**Other compatible options:**")
        for p in products[1:3]:
            lines.append(f"- {p['name']} ({p['category']})")

    lines.append("")
    lines.append(
        "> ⚠️ These recommendations are preliminary and based only on the internship "
        "task brief data. Please confirm suitability with the WaveNxD Technologies technical team."
    )

    return "\n".join(lines)
