"""
ai_service.py — Google Gemini REST API integration
for the WaveNxD Technologies AI Sales Representative.
"""

import requests
from typing import List, Dict

from app.config import settings
from app.products import PRODUCTS, ADDITIONAL_CAPABILITIES

# ── Product catalogue summaries ───────────────────────────────────────────────
_PRODUCT_SUMMARY = "\n".join(
    f"- {p['name']} | {p['frequency_khz']} kHz | "
    f"{p['droplet_size_um']} um droplets | "
    f"Flow: {p['flow_rate_ml_min']} ml/min | "
    f"Max viscosity: {p['max_viscosity_cp']} cP | "
    f"Applications: {', '.join(p['applications'])}"
    for p in PRODUCTS
)

_CAPABILITIES_SUMMARY = "\n".join(
    f"- {capability}" for capability in ADDITIONAL_CAPABILITIES
)

# ── System prompt ─────────────────────────────────────────────────────────────
SYSTEM_PROMPT = f"""
You are an AI Sales Representative for WaveNxD Technologies Pvt. Ltd.,
Kolhapur, Maharashtra, India.

WaveNxD Technologies specialises in ultrasonic spray nozzle systems
for laboratory and industrial applications.

Your role:
- Greet customers warmly and introduce yourself as the WaveNxD AI Sales Representative.
- Explain products using only the information provided below.
- Never invent specifications, prices, delivery times, warranties,
  certifications, or stock status.
- If catalogue information is unavailable, say so and recommend contacting
  the company for confirmation.
- Discover customer requirements, including application, liquid type,
  viscosity (cP), desired flow rate (ml/min), droplet size (um),
  operating frequency (kHz), and other relevant details.
- Recommend suitable products based only on catalogue information.
- Explain that recommendations are preliminary and require confirmation
  from the WaveNxD technical team.
- Support English, Hindi, and Marathi. Respond in the customer's language.
- Be professional, friendly, and helpful.
- Guide interested customers to submit a quotation request.
- Use readable Markdown formatting with complete sentences and bullet points.
- Do not start a list item and leave it unfinished.
- Keep answers concise but useful.
- If the catalogue does not provide a required specification, clearly say
  that it is not available in the provided catalogue.

PRODUCT CATALOGUE:
{_PRODUCT_SUMMARY}

ADDITIONAL CAPABILITIES:
{_CAPABILITIES_SUMMARY}

IMPORTANT:
- Prices, delivery timelines, availability, and certifications are unknown
  unless explicitly included in the catalogue.
- For custom requirements, say:
  "Please confirm with our technical team."
- Never invent product model numbers or specifications.
"""

# ── Gemini REST API configuration ─────────────────────────────────────────────
GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"

# ── Demo responses when the API key is not configured ─────────────────────────
_DEMO_RESPONSES = [
    (
        "**Demo Mode -- AI Not Available**\n\n"
        "The Gemini API key is not configured, so I am running in demo mode.\n\n"
        "**WaveNxD Technologies** offers ultrasonic spray nozzle systems. "
        "Please browse the product catalogue or contact the company for "
        "confirmed product specifications.\n\n"
        "To enable live AI responses, configure your Gemini API key "
        "in `backend/.env`."
    ),
    (
        "**Demo Mode -- API Key Required**\n\n"
        "To enable live AI chat:\n"
        "1. Get an API key from https://aistudio.google.com/app/apikey\n"
        "2. Add it to `backend/.env`.\n"
        "3. Ensure `GEMINI_MODEL=gemini-3.6-flash` is configured.\n"
        "4. Restart the backend server.\n\n"
        "You can still browse the product catalogue and submit a quotation request."
    ),
]

_demo_index = 0

def _demo_response() -> str:
    """Return a rotating demo response."""
    global _demo_index
    response_text = _DEMO_RESPONSES[_demo_index % len(_DEMO_RESPONSES)]
    _demo_index += 1
    return response_text

def chat_with_ai(message: str, history: List[Dict[str, str]]) -> tuple:
    """
    Send a message and conversation history to Gemini.

    Returns:
        (reply_text, ai_available)
    """
    if not settings.API_KEY_CONFIGURED:
        return _demo_response(), False

    try:
        # Build conversation history.
        contents = []
        for msg in history:
            role = msg.get("role", "user")
            if role not in ("user", "model"):
                role = "user"
            content_text = msg.get("content", "")
            if content_text:
                contents.append({"role": role, "parts": [{"text": content_text}]})

        # Add the current user message.
        contents.append({"role": "user", "parts": [{"text": message}]})

        model = settings.GEMINI_MODEL
        url = f"{GEMINI_API_BASE}/{model}:generateContent"

        payload = {
            "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
            "contents": contents,
            "generationConfig": {"temperature": 0.4, "maxOutputTokens": 2048},
        }

        # Retry logic for transient errors (429, 503)
        import time
        MAX_RETRIES = 3
        for attempt in range(1, MAX_RETRIES + 1):
            response = requests.post(
                url,
                params={"key": settings.GEMINI_API_KEY},
                json=payload,
                timeout=(10, 90),
                headers={"Content-Type": "application/json"},
            )
            if response.status_code == 200:
                data = response.json()
                candidates = data.get("candidates", [])
                if candidates:
                    candidate = candidates[0]
                    parts = candidate.get("content", {}).get("parts", [])
                    reply_parts = [p.get("text", "") for p in parts if p.get("text")]
                    reply = "\n".join(reply_parts).strip()
                    if reply:
                        finish_reason = candidate.get("finishReason")
                        if finish_reason == "MAX_TOKENS":
                            print("[ai_service] Response reached the output-token limit.")
                        return reply, True
                print("[ai_service] Gemini returned no text candidate.")
                return (
                    "I received your message but could not generate a response. Please try again.",
                    False,
                )

            if response.status_code in (429, 503):
                wait_seconds = 2 ** attempt
                print(f"[ai_service] Transient error {response.status_code}. Retrying in {wait_seconds}s (attempt {attempt}/{MAX_RETRIES})")
                time.sleep(wait_seconds)
                continue

            # Parse API errors safely.
            try:
                error_data = response.json()
            except ValueError:
                error_data = {}
            error_msg = error_data.get("error", {}).get("message", "Unknown error")
            print(f"[ai_service] Gemini API error {response.status_code}: {error_msg}")

            if response.status_code in (400, 401, 403) or "API_KEY_INVALID" in error_msg:
                return (
                    "The Gemini API request was rejected. Please check the API key, permissions, and request configuration.",
                    False,
                )

            if response.status_code == 404:
                return (
                    f"The AI model '{model}' was not found. Please check GEMINI_MODEL in backend/.env.",
                    False,
                )

            # For other errors, break and return generic message
            break

        # After retries exhausted or non‑retriable error
        return (
            "The AI service is currently unavailable or overloaded. Please try again later.",
            False,
        )

    except requests.exceptions.Timeout as error:
        print(f"[ai_service] Gemini request timed out: {error}")
        return ("The AI service timed out. Please try again in a moment.", False)

    except requests.exceptions.ConnectionError as error:
        print(f"[ai_service] Gemini connection error: {error}")
        return ("Cannot connect to the Gemini API. Please check your internet connection.", False)

    except requests.exceptions.RequestException as error:
        print(f"[ai_service] Gemini request error: {error}")
        return ("A network error occurred while contacting the AI service. Please try again.", False)

    except Exception as error:
        print(f"[ai_service] Unexpected error: {error}")
        return ("An unexpected error occurred. Please try again.", False)
