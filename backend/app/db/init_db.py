import asyncio
from sqlalchemy import select
from backend.app.db.session import engine, Base, AsyncSessionLocal
from backend.app.models.supervisor import Supervisor
from backend.app.models.order_run import OrderRun
from backend.app.models.run_activity import RunActivity


DEFAULT_SUPERVISORS = [
    {
        "id": "11111111-1111-1111-1111-111111111111",
        "name": "Standard E-Commerce Guardian",
        "base_instruction": (
            "You are an AI order supervisor overseeing the end-to-end lifecycle of this order. "
            "Act swiftly when payment or shipment exceptions occur. Keep the customer and internal "
            "teams informed, maintain a concise memory snapshot, and sleep when the order is in healthy transit."
        ),
        "model": "gemini-1.5-flash",
        "aggressiveness": "balanced",
        "default_wakeup_interval_seconds": 7200,  # 2 hours
    },
    {
        "id": "22222222-2222-2222-2222-222222222222",
        "name": "VIP Escalation Specialist",
        "base_instruction": (
            "You are a VIP white-glove order supervisor. Prioritize customer satisfaction and lightning-fast "
            "logistics escalation. If any delay occurs, immediately notify logistics, message the customer with empathy, "
            "and create internal escalation notes."
        ),
        "model": "gemini-1.5-flash",
        "aggressiveness": "high",
        "default_wakeup_interval_seconds": 3600,  # 1 hour
    },
    {
        "id": "33333333-3333-3333-3333-333333333333",
        "name": "Cost-Optimized Silent Overseer",
        "base_instruction": (
            "You are a lean, low-touch supervisor. Sleep through routine automated transit events. "
            "Wake up and intervene ONLY when critical exceptions (payment_failed, refund_requested, severe delays) arise."
        ),
        "model": "gemini-1.5-flash",
        "aggressiveness": "low",
        "default_wakeup_interval_seconds": 14400,  # 4 hours
    },
]


async def init_db():
    """Initializes database schema and populates default supervisor templates."""
    print("[INIT] Initializing database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("[SUCCESS] Database tables created successfully.")

    async with AsyncSessionLocal() as session:
        for sup_data in DEFAULT_SUPERVISORS:
            result = await session.execute(
                select(Supervisor).where(Supervisor.id == sup_data["id"])
            )
            existing = result.scalar_one_or_none()
            if not existing:
                supervisor = Supervisor(**sup_data)
                session.add(supervisor)
                print(f"[SEEDED] Template: {sup_data['name']}")
        await session.commit()
    print("[DONE] Database initialization and seeding complete!")


if __name__ == "__main__":
    asyncio.run(init_db())
