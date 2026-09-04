from typing import Dict, Any, List

# Tool definitions formatted for Google Gemini API Function Declarations
# and standard JSON Schema tool callers.

TOOL_DEFINITIONS: List[Dict[str, Any]] = [
    {
        "name": "message_fulfillment_team",
        "description": "Send an urgent or operational instruction to the warehouse/fulfillment team.",
        "parameters": {
            "type": "object",
            "properties": {
                "priority": {
                    "type": "string",
                    "enum": ["low", "medium", "high", "urgent"],
                    "description": "Urgency level of this request"
                },
                "department": {
                    "type": "string",
                    "description": "Target warehouse or department (e.g., Warehouse Pack Line, Quality Check, Inventory Desk)"
                },
                "message": {
                    "type": "string",
                    "description": "Detailed action required from fulfillment team"
                }
            },
            "required": ["message"]
        }
    },
    {
        "name": "message_payments_team",
        "description": "Alert the finance or payments team regarding payment issues, chargebacks, fraud review, or refund approvals.",
        "parameters": {
            "type": "object",
            "properties": {
                "issue_type": {
                    "type": "string",
                    "enum": ["payment_failed", "fraud_check", "refund_request", "chargeback", "general"],
                    "description": "Category of payment discrepancy"
                },
                "amount": {
                    "type": "number",
                    "description": "Monetary amount involved in the transaction"
                },
                "message": {
                    "type": "string",
                    "description": "Specific investigation request or refund instruction"
                }
            },
            "required": ["issue_type", "message"]
        }
    },
    {
        "name": "message_logistics_team",
        "description": "Contact carrier dispatch or shipping logistics team to expedite, investigate delays, reroute, or request package tracking updates.",
        "parameters": {
            "type": "object",
            "properties": {
                "tracking_id": {
                    "type": "string",
                    "description": "Carrier tracking number or shipment ID"
                },
                "carrier": {
                    "type": "string",
                    "description": "Shipping carrier name (e.g. FedEx, UPS, DHL, USPS)"
                },
                "action_required": {
                    "type": "string",
                    "enum": ["expedite", "reroute", "investigate_delay", "address_correction", "status_check"],
                    "description": "Required action for the shipment"
                },
                "message": {
                    "type": "string",
                    "description": "Specific logistics action requested"
                }
            },
            "required": ["action_required", "message"]
        }
    },
    {
        "name": "message_customer",
        "description": "Send a professional, empathetic, and transparent status update or resolution message to the customer.",
        "parameters": {
            "type": "object",
            "properties": {
                "channel": {
                    "type": "string",
                    "enum": ["email", "sms", "whatsapp", "in_app"],
                    "description": "Communication channel"
                },
                "subject": {
                    "type": "string",
                    "description": "Message subject line"
                },
                "message": {
                    "type": "string",
                    "description": "Full customer-facing text"
                }
            },
            "required": ["subject", "message"]
        }
    },
    {
        "name": "create_internal_note",
        "description": "Record an internal observation, reasoning log, escalation notice, or risk warning for the order supervisor audit trail.",
        "parameters": {
            "type": "object",
            "properties": {
                "category": {
                    "type": "string",
                    "enum": ["observation", "decision", "escalation", "risk_warning", "general"],
                    "description": "Classification of the internal note"
                },
                "content": {
                    "type": "string",
                    "description": "Content of the internal note"
                }
            },
            "required": ["content"]
        }
    }
]
