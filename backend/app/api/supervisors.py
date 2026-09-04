from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.db.session import get_db
from backend.app.models.supervisor import Supervisor
from backend.app.schemas.supervisor import SupervisorCreate, SupervisorUpdate, SupervisorResponse

router = APIRouter(prefix="/supervisors", tags=["Supervisors"])


@router.get("", response_model=List[SupervisorResponse])
async def list_supervisors(db: AsyncSession = Depends(get_db)):
    """Retrieve all available supervisor templates."""
    result = await db.execute(select(Supervisor).order_by(Supervisor.created_at))
    return list(result.scalars().all())


@router.post("", response_model=SupervisorResponse, status_code=201)
async def create_supervisor(supervisor_in: SupervisorCreate, db: AsyncSession = Depends(get_db)):
    """Create a new custom supervisor configuration."""
    supervisor = Supervisor(**supervisor_in.model_dump())
    db.add(supervisor)
    await db.commit()
    await db.refresh(supervisor)
    return supervisor


@router.get("/{supervisor_id}", response_model=SupervisorResponse)
async def get_supervisor(supervisor_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve a specific supervisor configuration by ID."""
    result = await db.execute(select(Supervisor).where(Supervisor.id == supervisor_id))
    supervisor = result.scalar_one_or_none()
    if not supervisor:
        raise HTTPException(status_code=404, detail="Supervisor not found.")
    return supervisor


@router.put("/{supervisor_id}", response_model=SupervisorResponse)
async def update_supervisor(
    supervisor_id: str,
    update_in: SupervisorUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update an existing supervisor configuration."""
    result = await db.execute(select(Supervisor).where(Supervisor.id == supervisor_id))
    supervisor = result.scalar_one_or_none()
    if not supervisor:
        raise HTTPException(status_code=404, detail="Supervisor not found.")

    update_data = update_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(supervisor, key, value)

    await db.commit()
    await db.refresh(supervisor)
    return supervisor


@router.delete("/{supervisor_id}")
async def delete_supervisor(supervisor_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a supervisor configuration."""
    result = await db.execute(select(Supervisor).where(Supervisor.id == supervisor_id))
    supervisor = result.scalar_one_or_none()
    if not supervisor:
        raise HTTPException(status_code=404, detail="Supervisor not found.")

    await db.delete(supervisor)
    await db.commit()
    return {"status": "deleted", "id": supervisor_id}
