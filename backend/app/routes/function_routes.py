from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db

router = APIRouter()


@router.get("/")
def get_functions(db: Session = Depends(get_db)):
    query = """
        SELECT
            function_id,
            function_name,
            function_date,
            coordinator_name,
            participants_count,
            status
        FROM sss_function_master
        WHERE record_status = 'Active'
        ORDER BY function_id DESC;
    """

    try:
        result = db.execute(text(query)).mappings().all()
        return [dict(row) for row in result]

    except SQLAlchemyError as exc:
        db.rollback()
        print("Functions database error:", exc)

        raise HTTPException(
            status_code=500,
            detail="Unable to load functions data.",
        )