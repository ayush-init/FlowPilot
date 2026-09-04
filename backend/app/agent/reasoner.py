import json
from typing import Dict, Any, List, Optional
from google import genai
from google.genai import types
from backend.app.core.config import settings
from backend.app.agent.tools import TOOL_DEFINITIONS


class AgentInferenceResult:
    def __init__(
        self,
        thought_process: str,
        tool_calls: List[Dict[str, Any]],
        next_sleep_seconds: int = 7200,
        state_updates: Optional[Dict[str, Any]] = None
    ):
        self.thought_process = thought_process
        self.tool_calls = tool_calls
        self.next_sleep_seconds = next_sleep_seconds
        self.state_updates = state_updates or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "thought_process": self.thought_process,
            "tool_calls": self.tool_calls,
            "next_sleep_seconds": self.next_sleep_seconds,
            "state_updates": self.state_updates
        }


class AgentReasoner:
    """
    Main Agent Runtime powered by Google Gemini API.
    Evaluates order state, triggers, instructions, and executes structured tool calls.
    """

    @classmethod
    async def infer(
        cls,
        order_id: str,
        trigger: str,
        event_info: Dict[str, Any],
        compact_memory: str,
        current_state: Dict[str, Any],
        base_instruction: str,
        extra_instructions: str = "",
        default_sleep_seconds: int = 7200
    ) -> AgentInferenceResult:
        """
        Runs reasoning cycle using Gemini with function calling or rule fallback.
        """
        # If Gemini API key is available, execute LLM tool calling
        if settings.GEMINI_API_KEY:
            try:
                client = genai.Client(api_key=settings.GEMINI_API_KEY)

                # Convert tool declarations to Gemini FunctionDeclaration format
                gemini_tools = [
                    types.Tool(
                        function_declarations=[
                            types.FunctionDeclaration(
                                name=t["name"],
                                description=t["description"],
                                parameters=t["parameters"]
                            ) for t in TOOL_DEFINITIONS
                        ]
                    )
                ]

                system_instruction = f"""
                You are FlowPilot, an autonomous AI Order Supervisor overseeing Order #{order_id}.
                Base Directive: {base_instruction}
                Extra Human Instructions: {extra_instructions or 'None'}

                Available Business Actions (via Function Calling):
                1. message_fulfillment_team: instruct warehouse packing line
                2. message_payments_team: resolve payment errors, refunds, chargebacks
                3. message_logistics_team: investigate carrier delays, expedite tracking
                4. message_customer: communicate status, updates, and reassurance
                5. create_internal_note: log observations and audit trails

                Rules:
                - If action is needed, call one or more appropriate tools.
                - If no action is needed, explain why and recommend sleep.
                - Keep the customer and relevant departments informed whenever exceptions occur.
                """

                user_prompt = f"""
                [TRIGGER]: {trigger}
                [EVENT CONTEXT]: {json.dumps(event_info)}
                [CURRENT ORDER STATE]: {json.dumps(current_state)}
                [CURRENT COMPACT MEMORY]: {compact_memory or 'Initial workflow start'}

                Review the situation. Execute any necessary business actions through tool calls,
                and provide your reasoning.
                """

                response = client.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=user_prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        tools=gemini_tools,
                        temperature=0.2
                    )
                )

                tool_calls = []
                thought = ""

                # Extract function calls from candidates
                if response.function_calls:
                    for fc in response.function_calls:
                        tool_calls.append({
                            "name": fc.name,
                            "args": dict(fc.args)
                        })

                if response.text:
                    thought = response.text.strip()
                elif tool_calls:
                    thought = f"Decided to execute {len(tool_calls)} business action(s) in response to {trigger}."

                # Determine next sleep duration (e.g. shorter if high alert, normal if calm)
                next_sleep = default_sleep_seconds
                if any(tc["name"] in ["message_logistics_team", "message_payments_team"] for tc in tool_calls):
                    next_sleep = min(1800, default_sleep_seconds)  # Wake sooner to check resolution

                return AgentInferenceResult(
                    thought_process=thought,
                    tool_calls=tool_calls,
                    next_sleep_seconds=next_sleep,
                    state_updates={"last_trigger": trigger}
                )
            except Exception as e:
                # Log error and fall back to rule heuristics
                print(f"[WARN] Gemini inference error: {e}, using heuristic fallback.")

        # Heuristic Rule-Based Fallback Engine (for zero-API-key testing and robust operation)
        return cls._heuristic_fallback(
            order_id=order_id,
            trigger=trigger,
            event_info=event_info,
            current_state=current_state,
            default_sleep_seconds=default_sleep_seconds,
            extra_instructions=extra_instructions
        )

    @classmethod
    def _heuristic_fallback(
        cls,
        order_id: str,
        trigger: str,
        event_info: Dict[str, Any],
        current_state: Dict[str, Any],
        default_sleep_seconds: int,
        extra_instructions: str
    ) -> AgentInferenceResult:
        event_type = event_info.get("event_type", trigger)
        tool_calls = []
        thought = ""
        next_sleep = default_sleep_seconds

        if trigger == "WORKFLOW_START" or event_type == "order_created":
            thought = f"Order #{order_id} supervisor initiated. Verified order details and confirmed initial status."
            tool_calls.append({
                "name": "create_internal_note",
                "args": {
                    "category": "observation",
                    "content": f"Workflow supervisor initialized for Order #{order_id}. Monitoring payment and fulfillment."
                }
            })

        elif event_type == "payment_failed":
            thought = f"Payment failure detected for Order #{order_id}. Alerting payments team and notifying customer."
            next_sleep = 1800  # 30 minutes
            tool_calls.append({
                "name": "message_payments_team",
                "args": {
                    "issue_type": "payment_failed",
                    "amount": current_state.get("amount", 189.99),
                    "message": f"Payment gateway declined transaction for Order #{order_id}. Please review retry attempts or fraud flags."
                }
            })
            tool_calls.append({
                "name": "message_customer",
                "args": {
                    "channel": "email",
                    "subject": f"Action Required: Payment Update for Order #{order_id}",
                    "message": "We were unable to process your payment. Please update your payment method to avoid order cancellation."
                }
            })

        elif event_type == "shipment_delayed":
            thought = f"Shipment delay signal received for Order #{order_id}. Contacting logistics carrier and updating customer."
            next_sleep = 3600  # 1 hour
            tool_calls.append({
                "name": "message_logistics_team",
                "args": {
                    "tracking_id": event_info.get("payload", {}).get("tracking_id", "TRK-99214"),
                    "action_required": "investigate_delay",
                    "message": f"Carrier reported delay for Order #{order_id}. Investigate ETA and prioritize routing."
                }
            })
            tool_calls.append({
                "name": "message_customer",
                "args": {
                    "channel": "email",
                    "subject": f"Update regarding your Order #{order_id} delivery",
                    "message": "Your package is experiencing a minor transit delay. Our team is actively monitoring the carrier."
                }
            })

        elif event_type == "refund_requested":
            thought = f"Customer initiated refund request for Order #{order_id}. Halting fulfillment and notifying payments team."
            tool_calls.append({
                "name": "message_fulfillment_team",
                "args": {
                    "priority": "urgent",
                    "department": "Warehouse Pack Line",
                    "message": f"HOLD SHIPMENT: Refund requested for Order #{order_id}. Do not dispatch."
                }
            })
            tool_calls.append({
                "name": "message_payments_team",
                "args": {
                    "issue_type": "refund_request",
                    "amount": current_state.get("amount", 189.99),
                    "message": f"Process customer refund review for Order #{order_id}."
                }
            })

        elif event_type == "customer_message_received":
            customer_msg = event_info.get("payload", {}).get("message", "Where is my order?")
            thought = f"Customer sent inquiry: '{customer_msg}'. Responding transparently."
            tool_calls.append({
                "name": "message_customer",
                "args": {
                    "channel": "email",
                    "subject": f"Re: Your inquiry for Order #{order_id}",
                    "message": f"Thank you for reaching out. We are actively overseeing your order status and will ensure smooth delivery."
                }
            })

        elif event_type == "delivered":
            thought = f"Order #{order_id} successfully delivered. Creating completion note."
            tool_calls.append({
                "name": "create_internal_note",
                "args": {
                    "category": "decision",
                    "content": f"Carrier confirmed delivery for Order #{order_id}. Concluding active monitoring."
                }
            })

        elif trigger == "SCHEDULED_WAKEUP":
            thought = f"Scheduled wakeup timer elapsed. Routine check on Order #{order_id} showed no active anomalies. Going back to sleep."
            tool_calls.append({
                "name": "create_internal_note",
                "args": {
                    "category": "observation",
                    "content": f"Periodic check-in complete. Order remains in healthy progress."
                }
            })

        else:
            thought = f"Processed event '{event_type}'. No immediate intervention required. Resuming scheduled monitoring."
            tool_calls.append({
                "name": "create_internal_note",
                "args": {
                    "category": "observation",
                    "content": f"Logged event: {event_type}."
                }
            })

        # Check if user added specific extra instructions (e.g. escalate immediately)
        if extra_instructions and "escalate" in extra_instructions.lower() and not any(tc["name"] == "create_internal_note" for tc in tool_calls):
            tool_calls.append({
                "name": "create_internal_note",
                "args": {
                    "category": "escalation",
                    "content": f"Human Instruction Override Applied: {extra_instructions}"
                }
            })

        return AgentInferenceResult(
            thought_process=thought,
            tool_calls=tool_calls,
            next_sleep_seconds=next_sleep,
            state_updates={"last_event": event_type}
        )
