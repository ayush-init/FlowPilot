from typing import Optional, Literal
from pydantic import BaseModel, Field


class MessageFulfillmentTeamAction(BaseModel):
    priority: Literal["low", "medium", "high", "urgent"] = Field(
        default="medium",
        description="Urgency of fulfillment request"
    )
    department: str = Field(
        default="Warehouse Operations",
        description="Target warehouse or fulfillment center"
    )
    message: str = Field(
        ...,
        description="Specific instructions or inquiry for the fulfillment team"
    )


class MessagePaymentsTeamAction(BaseModel):
    issue_type: Literal["payment_failed", "fraud_check", "refund_request", "chargeback", "general"] = Field(
        ...,
        description="Category of payment issue"
    )
    amount: Optional[float] = Field(
        default=None,
        description="Transaction amount involved if applicable"
    )
    message: str = Field(
        ...,
        description="Details regarding the payment discrepancy or refund approval"
    )


class MessageLogisticsTeamAction(BaseModel):
    tracking_id: Optional[str] = Field(
        default=None,
        description="Carrier tracking number or shipment ID"
    )
    carrier: Optional[str] = Field(
        default="FedEx / UPS / DHL",
        description="Shipping carrier name"
    )
    action_required: Literal["expedite", "reroute", "investigate_delay", "address_correction", "status_check"] = Field(
        ...,
        description="Required action from logistics"
    )
    message: str = Field(
        ...,
        description="Instructions or inquiries for the carrier/logistics team"
    )


class MessageCustomerAction(BaseModel):
    channel: Literal["email", "sms", "whatsapp", "in_app"] = Field(
        default="email",
        description="Communication channel"
    )
    subject: str = Field(
        ...,
        description="Email/Notification subject line"
    )
    message: str = Field(
        ...,
        description="Polite, transparent customer notification message"
    )


class CreateInternalNoteAction(BaseModel):
    category: Literal["observation", "decision", "escalation", "risk_warning", "general"] = Field(
        default="observation",
        description="Classification of internal note"
    )
    content: str = Field(
        ...,
        description="Detailed notes for human operators and audit trail"
    )
