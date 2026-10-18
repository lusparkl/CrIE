from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models import User
from ..schemas import DashboardResponse, WeaknessDetail
from ..services.analytics import dashboard_for_user, weakness_detail_for_user


router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardResponse)
def dashboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> DashboardResponse:
    return dashboard_for_user(db, user.id)


@router.get("/weaknesses/{category}", response_model=WeaknessDetail)
def weakness_detail(category: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> WeaknessDetail:
    detail = weakness_detail_for_user(db, user.id, category)
    if not detail:
        raise HTTPException(status_code=404, detail="No matching weakness was found in your essays")
    return detail
