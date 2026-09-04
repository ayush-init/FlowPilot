import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.app.agent.classifier import EventClassifier
from backend.app.agent.tools import TOOL_DEFINITIONS


@pytest.mark.asyncio
async def test_health_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "app" in data


@pytest.mark.asyncio
async def test_list_supervisors_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/supervisors")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert "name" in data[0]
        assert "aggressiveness" in data[0]


@pytest.mark.asyncio
async def test_simulator_event_templates_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/simulator/events")
        assert response.status_code == 200
        data = response.json()
        assert "templates" in data
        assert len(data["templates"]) >= 5


@pytest.mark.asyncio
async def test_event_classifier_policy():
    # Test critical event waking on low aggressiveness
    wake_crit, reason = await EventClassifier.evaluate_wake(
        event_type="payment_failed",
        payload={"reason": "Declined"},
        aggressiveness="low"
    )
    assert wake_crit is True

    # Test routine event sleeping on low aggressiveness
    wake_routine, reason = await EventClassifier.evaluate_wake(
        event_type="shipment_created",
        payload={"carrier": "FedEx"},
        aggressiveness="low"
    )
    assert wake_routine is False

    # Test high aggressiveness waking on routine event
    wake_high, reason = await EventClassifier.evaluate_wake(
        event_type="shipment_created",
        payload={"carrier": "FedEx"},
        aggressiveness="high"
    )
    assert wake_high is True


def test_tool_definitions_valid():
    assert len(TOOL_DEFINITIONS) == 5
    tool_names = [t["name"] for t in TOOL_DEFINITIONS]
    assert "message_fulfillment_team" in tool_names
    assert "message_payments_team" in tool_names
    assert "message_logistics_team" in tool_names
    assert "message_customer" in tool_names
    assert "create_internal_note" in tool_names
