"""
ai_service.py — Google Gemini REST API integration
for the WaveNxD Technologies AI Sales Representative.
"""

<<<<<<< HEAD
import json
import time
from typing import Dict, Iterator, List

import requests
=======
import requests
from typing import List, Dict
>>>>>>> 171b31ee03ffb6b8eba4c25febe1f1542b3422b8

from app.config import settings
from app.products import PRODUCTS, ADDITIONAL_CAPABILITIES

<<<<<<< HEAD
_PRODUCT_CATALOGUE = json.dumps(PRODUCTS, ensure_ascii=False, indent=2)
_CAPABILITIES_SUMMARY = "\n".join(f"- {item}" for item in ADDITIONAL_CAPABILITIES)
=======
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
>>>>>>> 171b31ee03ffb6b8eba4c25febe1f1542b3422b8

# ── System prompt ─────────────────────────────────────────────────────────────
SYSTEM_PROMPT = f"""
You are an AI Sales Representative for WaveNxD Technologies Pvt. Ltd.,
Kolhapur, Maharashtra, India.

WaveNxD Technologies specialises in ultrasonic spray nozzle systems
for laboratory and industrial applications.

Your role:
<<<<<<< HEAD
- Introduce yourself as the WaveNxD AI Sales Representative when greeting a customer.
- Explain ultrasonic spray nozzles clearly and answer using only the exact catalogue below.
- Never invent or extrapolate specifications, prices, delivery times, stock, warranties, or certifications.
- For recommendations, compare the customer's stated industry, application, liquid, viscosity,
  flow rate, and target droplet size with the listed product limits. State why the option fits,
  disclose any mismatch, and call the recommendation preliminary.
- If requirements are missing, ask a concise follow-up question for the most important missing
  details. Do not make the customer repeat information already given in the conversation.
- Reply in the language the customer uses. Support English, Hindi, Marathi, and other
  requested regional languages; keep product names and units unchanged.
- Be friendly, professional, direct, and concise. Normally answer in a few short sentences.
- When a customer wants a quote, guide them to the app's Request Quotation form. The form requires
  customer name and email and collects company, phone, and technical requirements. A request is
  stored for admin review; do not claim that an email was sent.
- The app does not automatically send email or book calls. If asked, invite the customer to provide
  a phone number and preferred callback time in the quotation form's additional requirements.
  Do not claim a call has been scheduled or confirmed.
- Use readable Markdown when helpful.

PRODUCT CATALOGUE:
{_PRODUCT_CATALOGUE}
=======
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
>>>>>>> 171b31ee03ffb6b8eba4c25febe1f1542b3422b8

ADDITIONAL CAPABILITIES:
{_CAPABILITIES_SUMMARY}

<<<<<<< HEAD
=======
IMPORTANT:
- Prices, delivery timelines, availability, and certifications are unknown
  unless explicitly included in the catalogue.
- For custom requirements, say:
  "Please confirm with our technical team."
- Never invent product model numbers or specifications.
>>>>>>> 171b31ee03ffb6b8eba4c25febe1f1542b3422b8
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
<<<<<<< HEAD
        "3. Ensure `GEMINI_MODEL=gemini-3.5-flash` is configured.\n"
=======
        "3. Ensure `GEMINI_MODEL=gemini-3.6-flash` is configured.\n"
>>>>>>> 171b31ee03ffb6b8eba4c25febe1f1542b3422b8
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

<<<<<<< HEAD
def _build_payload(
    message: str,
    history: List[Dict[str, str]],
    max_output_tokens: int = 2048,
) -> Dict:
    contents = []
    for item in history[-12:]:
        role = item.get("role", "user")
        content = item.get("content", "")
        if role in ("user", "model") and content:
            contents.append({"role": role, "parts": [{"text": content}]})
    contents.append({"role": "user", "parts": [{"text": message}]})
    return {
        "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        "contents": contents,
        "generationConfig": {"temperature": 0.3, "maxOutputTokens": max_output_tokens},
    }


def _error_message(status_code: int, model: str) -> str:
    if status_code in (401, 403):
        return "The Gemini API rejected the request. Check that the API key is valid and enabled."
    if status_code == 404:
        return f"The configured Gemini model '{model}' is unavailable. Check GEMINI_MODEL in backend/.env."
    if status_code == 429:
        return "The AI service is rate-limited right now. Please try again shortly."
    if status_code == 503:
        return "The AI service is busy right now. Please try again shortly."
    return "The AI service could not complete that request. Please try again shortly."


def stream_chat_with_ai(
    message: str,
    history: List[Dict[str, str]],
) -> Iterator[Dict[str, object]]:
    """Yield response text as Gemini generates it, followed by availability status."""
    if not settings.API_KEY_CONFIGURED:
        yield {"type": "chunk", "text": _demo_response()}
        yield {"type": "done", "ai_available": False}
        return

    model = settings.GEMINI_MODEL
    url = f"{GEMINI_API_BASE}/{model}:streamGenerateContent"
    retryable_statuses = {429, 503}
    last_error = "The AI response ended before it was complete. Please try again."
    previous_attempt_streamed = False

    for attempt in range(3):
        attempt_text = False
        finish_reason = None
        max_output_tokens = min(2048 * (2 ** attempt), 4096)
        try:
            with requests.post(
                url,
                params={"key": settings.GEMINI_API_KEY, "alt": "sse"},
                json=_build_payload(message, history, max_output_tokens),
                timeout=(10, 120),
                headers={"Content-Type": "application/json"},
                stream=True,
            ) as response:
                if response.status_code != 200:
                    last_error = _error_message(response.status_code, model)
                    if response.status_code in retryable_statuses and attempt < 2:
                        time.sleep(attempt + 1)
                        continue
                    yield {"type": "error", "message": last_error}
                    yield {"type": "done", "ai_available": False}
                    return

                for line in response.iter_lines():
                    if not line:
                        continue
                    if isinstance(line, bytes):
                        line = line.decode("utf-8", errors="replace")
                    if not line.startswith("data:"):
                        continue
                    try:
                        data = json.loads(line[5:].strip())
                    except json.JSONDecodeError:
                        continue
                    candidates = data.get("candidates", [])
                    if not candidates:
                        continue
                    candidate = candidates[0]
                    if candidate.get("finishReason"):
                        finish_reason = candidate["finishReason"]
                    parts = candidate.get("content", {}).get("parts", [])
                    for part in parts:
                        text = part.get("text")
                        if text:
                            attempt_text = True
                            if previous_attempt_streamed:
                                yield {"type": "replace", "text": text}
                                previous_attempt_streamed = False
                            else:
                                yield {"type": "chunk", "text": text}

            if finish_reason == "STOP" and attempt_text:
                yield {"type": "done", "ai_available": True}
                return

            if finish_reason == "STOP":
                last_error = "The AI returned an empty response. Please try asking in another way."
            elif finish_reason == "MAX_TOKENS":
                last_error = "The AI response reached its length limit before it was complete. Please ask for a shorter answer."
            elif finish_reason:
                last_error = f"The AI response could not be completed ({finish_reason}). Please try again."
            elif not attempt_text:
                last_error = "The AI returned an empty response. Please try asking in another way."

            previous_attempt_streamed = previous_attempt_streamed or attempt_text
            if attempt < 2 and finish_reason in (None, "MAX_TOKENS"):
                time.sleep(attempt + 1)
                continue
            yield {"type": "error", "message": last_error}
            yield {"type": "done", "ai_available": False}
            return
        except requests.exceptions.Timeout:
            last_error = "The AI service timed out before the response completed. Please try again."
        except requests.exceptions.RequestException as error:
            print(f"[ai_service] Gemini network error: {type(error).__name__}")
            last_error = "Cannot connect to the AI service. Please check your connection and try again."

        previous_attempt_streamed = previous_attempt_streamed or attempt_text
        if attempt < 2:
            time.sleep(attempt + 1)
            continue
        yield {"type": "error", "message": last_error}
        yield {"type": "done", "ai_available": False}


def chat_with_ai(message: str, history: List[Dict[str, str]]) -> tuple:
    """Collect a streamed Gemini response for clients using the non-streaming API."""
    reply_parts = []
    ai_available = False
    for event in stream_chat_with_ai(message, history):
        if event["type"] == "chunk":
            reply_parts.append(str(event["text"]))
        elif event["type"] == "error":
            reply_parts.append(str(event["message"]))
        elif event["type"] == "done":
            ai_available = bool(event["ai_available"])
    return "".join(reply_parts), ai_available
=======
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
>>>>>>> 171b31ee03ffb6b8eba4c25febe1f1542b3422b8
