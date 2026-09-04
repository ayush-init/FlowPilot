import json
from typing import Dict, Any, Tuple
from google import genai
from google.genai import types
from backend.app.core.config import settings


class EventClassifier:
    """
    Lightweight Event Classifier that inspects incoming signals and determines
    whether the event is important enough to wake the main LLM agent immediately
    or let the workflow stay asleep until the next scheduled wakeup.
    """

    CRITICAL_EVENTS = {
        "payment_failed",
        "shipment_delayed",
        "refund_requested",
        "customer_message_received",
        "fraud_alert",
        "address_issue",
        "delivered"  # Terminal completion trigger
    }

    ROUTINE_EVENTS = {
        "order_created",
        "payment_confirmed",
        "shipment_created",
        "carrier_scanned",
        "in_transit_update"
    }

    @classmethod
    async def evaluate_wake(
        cls,
        event_type: str,
        payload: Dict[str, Any],
        aggressiveness: str = "balanced",
        extra_instructions: str = ""
    ) -> Tuple[bool, str]:
        """
        Returns (should_wake: bool, reason: str).
        Uses Gemini if API key is present, otherwise uses deterministic policy logic.
        """
        # If there are specific user instructions that mention this event, wake immediately
        if extra_instructions and event_type.lower() in extra_instructions.lower():
            return True, f"Waking due to custom instruction match for '{event_type}'."

        # High aggressiveness wakes on virtually all events
        if aggressiveness == "high":
            return True, f"Aggressiveness is HIGH: waking for event '{event_type}'."

        # Low aggressiveness sleeps through routine events, waking only on critical errors
        if aggressiveness == "low":
            if event_type in cls.CRITICAL_EVENTS:
                return True, f"Aggressiveness is LOW: waking for critical event '{event_type}'."
            return False, f"Aggressiveness is LOW: sleeping through routine event '{event_type}'."

        # Balanced aggressiveness: use Gemini for smart context evaluation if configured, or default policy
        if settings.GEMINI_API_KEY:
            try:
                client = genai.Client(api_key=settings.GEMINI_API_KEY)
                prompt = f"""
                You are a fast, lightweight event classifier for an AI Order Supervisor.
                Event Type: {event_type}
                Event Payload: {json.dumps(payload)}
                Supervisor Aggressiveness: {aggressiveness}
                Extra Human Instructions: {extra_instructions or 'None'}

                Task: Determine if this event requires immediate AI agent reasoning and intervention (WAKE),
                or if it is a normal progress update that can wait for the next scheduled check-in (SLEEP).

                Respond ONLY in valid JSON format:
                {{"wake": true/false, "reason": "brief 1-sentence rationale"}}
                """
                response = client.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.1
                    )
                )
                result = json.loads(response.text)
                return bool(result.get("wake", True)), result.get("reason", "Evaluated by Gemini classifier.")
            except Exception as e:
                # Fallback to rule heuristics on API error
                pass

        # Rule-based fallback for balanced mode
        if event_type in cls.CRITICAL_EVENTS:
            return True, f"Balanced policy: waking on priority event '{event_type}'."
        return False, f"Balanced policy: event '{event_type}' recorded, remaining asleep until next scheduled wakeup."
