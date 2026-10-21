"""
products.py — WaveNxD Technologies product catalogue.

IMPORTANT: This data is based on the internship task brief only.
It may not represent the complete official product catalogue.
Do not add specifications, prices, or details not listed here.
"""

from typing import List, Dict, Any

PRODUCTS: List[Dict[str, Any]] = [
    {
        "id": "SN-60K",
        "name": "Standard Spray Nozzle (60 kHz)",
        "nozzle_type": "Standard",
        "frequency_khz": 60,
        "droplet_size_um": 40,
        "flow_rate_ml_min": "up to 5",
        "flow_rate_max": 5,
        "max_viscosity_cp": 50,
        "applications": ["Lab spray drying", "Spray pyrolysis"],
        "description": (
            "A versatile standard spray nozzle operating at 60 kHz. "
            "Produces 40 µm droplets at up to 5 ml/min flow rate. "
            "Suitable for low-viscosity liquids (below 50 cP). "
            "Ideal for laboratory-scale spray drying and spray pyrolysis."
        ),
        "category": "Standard",
    },
    {
        "id": "SN-120K",
        "name": "Standard Nozzle (120 kHz)",
        "nozzle_type": "Standard",
        "frequency_khz": 120,
        "droplet_size_um": 25,
        "flow_rate_ml_min": "up to 3",
        "flow_rate_max": 3,
        "max_viscosity_cp": 50,
        "applications": [
            "Lab spray drying",
            "Spray pyrolysis",
            "Powder synthesis",
            "Hydrogen production",
        ],
        "description": (
            "Higher-frequency standard nozzle at 120 kHz producing finer 25 µm droplets. "
            "Flow rate up to 3 ml/min with low-viscosity liquids (below 50 cP). "
            "Well-suited for powder synthesis and hydrogen production applications."
        ),
        "category": "Standard",
    },
    {
        "id": "STN-180K",
        "name": "Standard Torch Nozzle (180 kHz)",
        "nozzle_type": "Torch",
        "frequency_khz": 180,
        "droplet_size_um": 10,
        "flow_rate_ml_min": "up to 5",
        "flow_rate_max": 5,
        "max_viscosity_cp": 50,
        "applications": ["Stent coatings"],
        "description": (
            "High-frequency torch nozzle at 180 kHz with an ultra-fine 10 µm droplet size. "
            "Flow rate up to 5 ml/min for low-viscosity liquids (below 50 cP). "
            "Designed for precision coating applications such as medical stent coatings."
        ),
        "category": "Standard",
    },
    {
        "id": "HV-60K",
        "name": "High-Viscosity Conical Nozzle (60 kHz)",
        "nozzle_type": "Conical",
        "frequency_khz": 60,
        "droplet_size_um": 40,
        "flow_rate_ml_min": "up to 3",
        "flow_rate_max": 3,
        "max_viscosity_cp": 1000,
        "applications": ["Fuel cell coating"],
        "description": (
            "Conical nozzle engineered for high-viscosity liquids up to 1000 cP. "
            "Operates at 60 kHz producing 40 µm droplets at up to 3 ml/min. "
            "Specifically designed for fuel cell coating processes."
        ),
        "category": "High-Viscosity",
    },
    {
        "id": "HV-24K",
        "name": "High-Viscosity Conical Nozzle (24 kHz)",
        "nozzle_type": "Conical",
        "frequency_khz": 24,
        "droplet_size_um": 60,
        "flow_rate_ml_min": "up to 3",
        "flow_rate_max": 3,
        "max_viscosity_cp": 1000,
        "applications": ["Fuel cell coating"],
        "description": (
            "Low-frequency conical nozzle at 24 kHz producing larger 60 µm droplets. "
            "Handles high-viscosity liquids up to 1000 cP at up to 3 ml/min. "
            "Suitable for fuel cell membrane electrode assembly coating."
        ),
        "category": "High-Viscosity",
    },
    {
        "id": "HF-60K",
        "name": "High-Flow Conical Nozzle (60 kHz)",
        "nozzle_type": "Conical",
        "frequency_khz": 60,
        "droplet_size_um": 40,
        "flow_rate_ml_min": "up to 200",
        "flow_rate_max": 200,
        "max_viscosity_cp": 50,
        "applications": ["Industrial spray drying"],
        "description": (
            "High-throughput conical nozzle operating at 60 kHz. "
            "Supports flow rates up to 200 ml/min for industrial-scale operations. "
            "Produces 40 µm droplets with low-viscosity liquids (below 50 cP). "
            "Designed for large-scale industrial spray drying."
        ),
        "category": "High-Flow",
    },
    {
        "id": "PIPAC-60K",
        "name": "PIPAC Conical Nozzle (60 kHz)",
        "nozzle_type": "Conical",
        "frequency_khz": 60,
        "droplet_size_um": 40,
        "flow_rate_ml_min": "up to 20",
        "flow_rate_max": 20,
        "max_viscosity_cp": 50,
        "applications": ["PIPAC chemotherapy"],
        "description": (
            "Specialised conical nozzle designed for Pressurised IntraPeritoneal Aerosol "
            "Chemotherapy (PIPAC). Operates at 60 kHz with 40 µm droplets "
            "at up to 20 ml/min. Requires liquid viscosity below 50 cP."
        ),
        "category": "Medical",
    },
    {
        "id": "EH-15-CN",
        "name": "Extended Horn 15 mm — Conical Nozzle",
        "nozzle_type": "Extended Horn (Conical)",
        "frequency_khz": 60,
        "droplet_size_um": 40,
        "flow_rate_ml_min": "up to 5",
        "flow_rate_max": 5,
        "max_viscosity_cp": 50,
        "applications": ["Blood collection tube coating"],
        "description": (
            "15 mm extended horn with conical nozzle at 60 kHz. "
            "Produces 40 µm droplets at up to 5 ml/min with liquids below 50 cP. "
            "Designed for precise internal coating of blood collection tubes."
        ),
        "category": "Extended Horn",
    },
    {
        "id": "EH-25-TN",
        "name": "Extended Horn 25 mm — Torch Nozzle",
        "nozzle_type": "Extended Horn (Torch)",
        "frequency_khz": 60,
        "droplet_size_um": 40,
        "flow_rate_ml_min": "up to 5",
        "flow_rate_max": 5,
        "max_viscosity_cp": 1000,
        "applications": ["Syringe coating", "High-viscosity applications"],
        "description": (
            "25 mm extended horn with torch nozzle at 60 kHz. "
            "Handles high-viscosity liquids up to 1000 cP at up to 5 ml/min with 40 µm droplets. "
            "Suitable for syringe barrel coating and other high-viscosity coating needs."
        ),
        "category": "Extended Horn",
    },
]


# ── Additional capabilities (not individual nozzle products) ──────────────────
ADDITIONAL_CAPABILITIES = [
    "Air-shaping attachments for spray pattern control",
    "Micro-fluid dispensing: 0–200 µl precision dispensing",
    "PLC-controlled XY spray pyrolysis system (up to 450 °C substrate temperature)",
    "SS316 stainless steel enclosure options",
]


def get_all_products() -> List[Dict[str, Any]]:
    return PRODUCTS


def get_product_by_id(product_id: str):
    return next((p for p in PRODUCTS if p["id"] == product_id), None)
