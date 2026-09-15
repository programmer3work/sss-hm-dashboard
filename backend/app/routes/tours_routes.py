from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db

router = APIRouter()

@router.get("/")
def get_tours(db: Session = Depends(get_db)):

    query = """
        SELECT
            tour_id,
            tour_name,
            location_name,
            tour_date,
            incharge_name,
            students_count,
            status
        FROM sss_tour_master
        WHERE record_status = 'Active'
            AND NULLIF(BTRIM(tour_name), '') IS NOT NULL
            AND NULLIF(BTRIM(location_name), '') IS NOT NULL
            AND tour_date IS NOT NULL
            AND NULLIF(BTRIM(incharge_name), '') IS NOT NULL
            AND students_count IS NOT NULL
            AND NULLIF(BTRIM(status), '') IS NOT NULL
        ORDER BY tour_date DESC, tour_name ASC, tour_id DESC;
    """

    result = db.execute(text(query)).mappings().all()
    return [dict(r) for r in result]