import json
from typing import List, Dict, Any, Optional
from google import genai
from google.genai import types
from backend.app.core.config import settings


class MemoryManager:
    """
    Manages rolling compact memory summarization and end-of-run retrospective generation.
    """

    @classmethod
    async def compact_memory(
        cls,
        previous_memory: str,
        trigger: str,
        event_info: Dict[str, Any],
        actions_taken: List[Dict[str, Any]],
        current_state: Dict[str, Any]
    ) -> str:
        """
        Updates the compact rolling memory summary of the order run.
        """
        if settings.GEMINI_API_KEY:
            try:
                client = genai.Client(api_key=settings.GEMINI_API_KEY)
                prompt = f"""
                You are maintaining the compact memory summary for an order supervisor workflow.
                Previous Memory: {previous_memory or 'None (initial start)'}
                Latest Trigger: {trigger}
                Event / Context: {json.dumps(event_info)}
                Actions Taken in this step: {json.dumps(actions_taken)}
                Current Order State: {json.dumps(current_state)}

                Task: Produce an updated, compact memory summary (maximum 3-4 sentences).
                Highlight the current status, any blockers/delays resolved or pending, and key decisions made.
                """
                response = client.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=prompt,
                    config=types.GenerateContentConfig(temperature=0.2)
                )
                return response.text.strip()
            except Exception:
                pass

        # Fallback heuristic compaction
        actions_summary = ", ".join([a.get("name", "action") for a in actions_taken]) or "No actions needed"
        return f"Order status: {current_state.get('status', 'in_progress')}. Last trigger: {trigger}. Actions executed: {actions_summary}. Monitoring continues."

    @classmethod
    async def generate_retrospective(
        cls,
        order_id: str,
        compact_memory: str,
        activities: List[Dict[str, Any]],
        supervisor_name: str,
        base_instruction: str,
        termination_reason: Optional[str] = None
    ) -> Dict[str, str]:
        """
        Generates the end-of-run final summary, key learnings, and recommendations.
        """
        if settings.GEMINI_API_KEY:
            try:
                client = genai.Client(api_key=settings.GEMINI_API_KEY)
                prompt = f"""
                You are concluding an AI Order Supervisor run for Order #{order_id}.
                Supervisor: {supervisor_name}
                Base Strategy: {base_instruction}
                Termination / Completion Reason: {termination_reason or 'Order reached terminal completion (delivered/settled)'}
                Final Memory Snapshot: {compact_memory}
                Activity Log (Chronological): {json.dumps(activities[-15:])}

                Task: Produce a structured end-of-run retrospective with 3 sections:
                1. "final_summary": Comprehensive 2-3 paragraph overview of the order's entire journey from placement to completion.
                2. "key_learnings": 3-4 bullet points analyzing operational bottlenecks, agent interventions, and response effectiveness.
                3. "recommendations": 3-4 actionable recommendations for fulfillment, logistics, payments, or customer service teams.

                Respond ONLY in valid JSON format:
                {{
                    "final_summary": "...",
                    "key_learnings": "...",
                    "recommendations": "..."
                }}
                """
                response = client.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.3
                    )
                )
                result = json.loads(response.text)
                return {
                    "final_summary": result.get("final_summary", "Order workflow completed."),
                    "learnings": result.get("key_learnings", "Learnings captured."),
                    "recommendations": result.get("recommendations", "Process recommendations logged.")
                }
            except Exception:
                pass

        # Rule-based fallback retrospective
        return {
            "final_summary": f"Order #{order_id} reached lifecycle completion ({termination_reason or 'Terminal event reached'}). The AI supervisor monitored all transit signals, handled exceptions, and logged all activities.",
            "learnings": "- Automated signal classification effectively filtered routine events from exceptions.\n- Proactive internal notifications reduced resolution latency.\n- Durable workflow maintained state across sleep and wake cycles.",
            "recommendations": "- Maintain direct carrier API integrations for real-time delay notifications.\n- Continue standardizing customer proactive delay templates.\n- Review fulfillment response times for high-priority orders."
        }
