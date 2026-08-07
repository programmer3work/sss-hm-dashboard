from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db

router = APIRouter()


@router.get("/")
def get_teachers(db: Session = Depends(get_db)):
    query = """
        SELECT
            t.teacher_id,
            t.full_name,
            t.subject_name,
            t.class_id,
            c.class_name,
            c.section_name,
            t.section_1,
            t.role,
            t.email_id,
            t.section_2,
            t.phone,
            t.is_active
        FROM sss_teacher_master t
        LEFT JOIN sss_class_master c
            ON t.class_id = c.class_id
        WHERE t.is_active = TRUE
        ORDER BY t.teacher_id;
    """

    try:
        result = db.execute(text(query)).mappings().all()
        return [dict(row) for row in result]

    except SQLAlchemyError as exc:
        db.rollback()
        print("Teachers database error:", exc)

        raise HTTPException(
            status_code=500,
            detail="Unable to load teachers data.",
        )