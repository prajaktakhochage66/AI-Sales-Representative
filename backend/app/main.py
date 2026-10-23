"""
main.py — FastAPI application entry point for WaveNxD Technologies AI Sales Rep.

Run with:
    uvicorn app.main:app --reload --port 8000

Swagger UI: http://localhost:8000/docs
"""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db

from app.routers import chat, quotations, followups, products, auth, admin

# ── Initialize MongoDB (Beanie) ───────────────────────────────────────────────────
# The database is initialized in the startup event below.


# ── FastAPI App ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="WaveNxD Technologies — AI Sales Representative API",
    description=(
        "Backend API for the WaveNxD Technologies AI Sales Representative. "
        "Provides chatbot, product catalogue, recommendations, quotation management, "
        "and follow-up tracking.\n\n"
        "**Note:** Product information is based on internship task brief data only "
        "and may not represent the complete official catalogue."
    ),
    version="1.0.0",
    contact={
        "name": "WaveNxD Technologies Pvt. Ltd.",
        "url": "https://wavenxd.com",
    },
)

# ── CORS — Allow React frontend ────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://wavenxd.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(quotations.router)
app.include_router(followups.router)
app.include_router(products.router)
app.include_router(admin.router)


# ── Health check ───────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"], summary="Health check")
async def root():
    return {
        "status": "running",
        "app": "WaveNxD Technologies AI Sales Representative",
        "version": "1.0.0",
        "ai_configured": settings.API_KEY_CONFIGURED,
        "ai_model": settings.GEMINI_MODEL if settings.API_KEY_CONFIGURED else "not configured",
        "docs": "/docs",
    }


@app.get("/api/status", tags=["Health"], summary="API status")
async def api_status():
    """Returns the current API status including AI configuration."""
    return {
        "status": "ok",
        "ai_available": settings.API_KEY_CONFIGURED,
        "ai_model": settings.GEMINI_MODEL if settings.API_KEY_CONFIGURED else None,
        "message": (
            "AI Sales Representative is ready."
            if settings.API_KEY_CONFIGURED
            else (
                "Running in demo mode. "
                "Configure GEMINI_API_KEY in backend/.env to enable live AI."
            )
        ),
    }


# ── Startup message ────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    import sys
    import io
    # Force UTF-8 output to avoid Windows console encoding errors
    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass

    sep = "=" * 60
    print(f"\n{sep}")
    print("  WaveNxD Technologies - AI Sales Representative")
    print(sep)
    if settings.API_KEY_CONFIGURED:
        print(f"  [OK] Gemini AI configured (model: {settings.GEMINI_MODEL})")
    else:
        print("  [!] Gemini AI NOT configured - running in demo mode")
        print("  [>] To enable AI: edit backend/.env and add GEMINI_API_KEY")
        print("      Get a free key at: https://aistudio.google.com/app/apikey")
    if not settings.JWT_SECRET:
        print("  [!] JWT_SECRET is not set; auth tokens will be invalid after a backend restart.")
        print("      Set a persistent JWT_SECRET in backend/.env.")
    print("  [*] API docs: http://localhost:8000/docs")
    print(f"{sep}\n")
    # Initialize Beanie ODM (MongoDB) on startup
    await init_db()

    # Seed default admin user if not exists
    await seed_admin()


async def seed_admin():
    """Create or configure the admin account from explicit environment credentials."""
    from app.models import ActivityLog, User
    from app.auth import get_password_hash, verify_password

    username = os.getenv("ADMIN_USERNAME", "").strip()
    password = os.getenv("ADMIN_PASSWORD", "")
    existing_admin = await User.find_one(User.role == "ADMIN")
    if not username or not password:
        if not existing_admin:
            print("  [!] No admin exists. Set ADMIN_USERNAME and ADMIN_PASSWORD to create one.")
        else:
            print(f"  [OK] Admin user exists: {existing_admin.username}")
        return
    if len(password) < 8:
        print("  [!] ADMIN_PASSWORD must contain at least 8 characters; admin was not configured.")
        return

    configured_user = await User.find_one(User.username == username)
    if configured_user and configured_user.role != "ADMIN":
        print(f"  [!] ADMIN_USERNAME '{username}' is already assigned to a non-admin user.")
        return

    if configured_user:
        admin_user = configured_user
        if verify_password(password, admin_user.password_hash):
            print(f"  [OK] Admin user exists: {admin_user.username}")
            return
        admin_user.password_hash = get_password_hash(password)
        await admin_user.save()
        action = "ADMIN_CREDENTIALS_CONFIGURED"
    elif existing_admin:
        print(
            f"  [OK] Admin user exists: {existing_admin.username}. "
            "Set ADMIN_USERNAME to that username to configure its password."
        )
        return
    else:
        admin_user = User(
            username=username,
            password_hash=get_password_hash(password),
            role="ADMIN",
        )
        await admin_user.insert()
        action = "ADMIN_CREATED"

    await ActivityLog(
        user_id=str(admin_user.id),
        username=admin_user.username,
        role=admin_user.role,
        action=action,
        details="Admin account initialized from environment configuration",
    ).insert()
    print(f"  [+] Admin account configured (username: {admin_user.username})")
