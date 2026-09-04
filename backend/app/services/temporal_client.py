from typing import Optional
from temporalio.client import Client
from backend.app.core.config import settings

_temporal_client: Optional[Client] = None


async def get_temporal_client() -> Client:
    """
    Returns a connected Temporal Client singleton.
    """
    global _temporal_client
    if _temporal_client is None:
        try:
            _temporal_client = await Client.connect(
                settings.TEMPORAL_HOST,
                namespace=settings.TEMPORAL_NAMESPACE
            )
        except Exception as e:
            raise ConnectionError(
                f"Failed to connect to Temporal server at '{settings.TEMPORAL_HOST}'. "
                f"Please ensure Temporal server is running. Error: {e}"
            )
    return _temporal_client
