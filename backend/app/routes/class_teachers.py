from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db

router = APIRouter()


@router.get("/")
def get_class_teachers(db: Session = Depends(get_db)):

    query = """
        SELECT
            c.class_id,
            c.class_name,
            c.section_name,
            c.academic_year,
            c.class_teacher_id,

            COALESCE(
                t.full_name,
                CONCAT_WS(' ', t.first_name, t.last_name),
                'Not Assigned'
            ) AS class_teacher_name,

            COALESCE(
                t.email_id,
                t.email,
                '-'
            ) AS teacher_email,

            COALESCE(
                t.phone,
                '-'
            ) AS teacher_mobile

        FROM sss_class_master c
        LEFT JOIN sss_teacher_master t
            ON c.class_teacher_id = t.teacher_id

        WHERE c.record_status = 'Active'
        ORDER BY c.class_id;
    """

    result = db.execute(text(query)).mappings().all()

    return [dict(row) for row in result]