from typing import Optional
from temporalio.client import Client
from backend.app.core.config import settings

_temporal_client: Optional[Client] = None


async def get_temporal_client() -> Client:
    """Returns a connected Temporal Client singleton."""
    global _temporal_client
    if _temporal_client is None:
        _temporal_client = await Client.connect(
            settings.TEMPORAL_HOST,
            namespace=settings.TEMPORAL_NAMESPACE
        )
    return _temporal_client


class TemporalClientManager:
    @staticmethod
    async def get_client() -> Client:
        return await get_temporal_client()