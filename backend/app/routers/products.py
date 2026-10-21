"""
routers/products.py — Product catalogue API endpoints.
"""

from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException
from app.products import get_all_products, get_product_by_id
from app.recommender import recommend_products, build_recommendation_explanation
from app.schemas import Product, RecommendationRequest, RecommendationResponse

router = APIRouter(prefix="/api/products", tags=["Products"])


@router.get("/", summary="List all products in the catalogue")
async def list_products():
    """Returns the complete WaveNxD product catalogue from the internship brief."""
    return {"products": get_all_products(), "count": len(get_all_products())}


@router.get("/{product_id}", summary="Get a specific product by ID")
async def get_product(product_id: str):
    """Returns detailed information about a single product."""
    product = get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail=f"Product '{product_id}' not found")
    return product


@router.post("/recommend", response_model=RecommendationResponse, summary="Get product recommendations")
async def recommend(req: RecommendationRequest):
    """
    Returns product recommendations based on customer requirements.

    All parameters are optional. Provide as many as you know.
    Results are sorted by best match.

    ⚠️ Recommendations are preliminary and require confirmation from the WaveNxD technical team.
    """
    products = recommend_products(
        viscosity_cp=req.viscosity_cp,
        flow_rate_ml_min=req.flow_rate_ml_min,
        droplet_size_um=req.droplet_size_um,
        frequency_khz=req.frequency_khz,
        application=req.application,
    )
    explanation = build_recommendation_explanation(products, req.model_dump())
    return RecommendationResponse(products=products[:5], explanation=explanation)
