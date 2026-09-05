from fastapi import APIRouter
from backend.app.api.supervisors import router as supervisors_router
from backend.app.api.runs import router as runs_router
from backend.app.api.simulator import router as simulator_router
from backend.app.api.system import router as system_router

api_router = APIRouter()

api_router.include_router(supervisors_router)
api_router.include_router(runs_router)
api_router.include_router(simulator_router)
api_router.include_router(system_router)
