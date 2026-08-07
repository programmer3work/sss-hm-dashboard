from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db

router = APIRouter()


# ===================== STUDENTS =====================
@router.get("/")
def get_students(db: Session = Depends(get_db)):
    query = """
        SELECT
            s.student_id,
            s.admission_no,
            s.name,
            c.class_name,
            s.section AS section_name,
            s.roll_number,
            COALESCE(
                p.full_name,
                s.parent_name,
                s.guardian_name,
                '-'
            ) AS parent_name,
            COALESCE(
                p.phone,
                s.parent_phone,
                s.guardian_phone,
                s.student_phone,
                '-'
            ) AS mobile_no,
            s.student_email AS email_id,
            s.record_status
        FROM sss_student_master s
        LEFT JOIN sss_class_master c
            ON s.class_id = c.class_id
        LEFT JOIN sss_parent_student_map spm
            ON s.student_id = spm.student_id
        LEFT JOIN sss_parent_master p
            ON spm.parent_id = p.parent_id
        WHERE s.record_status = 'Active'
        ORDER BY s.student_id;
    """

    try:
        result = db.execute(text(query)).mappings().all()
        return [dict(row) for row in result]

    except SQLAlchemyError as exc:
        db.rollback()
        print("Students database error:", exc)

        raise HTTPException(
            status_code=500,
            detail="Unable to load students data.",
        )


# ===================== PROGRESS =====================
@router.get("/progress")
def get_progress(db: Session = Depends(get_db)):
    query = """
        SELECT
            sm.marks_id,
            s.student_id,
            s.name AS full_name,
            c.class_name,
            c.section_name,
            sub.subject_name,
            e.exam_name,
            e.exam_type,
            sm.marks_obtained,
            sm.max_marks,
            ROUND(
                (
                    sm.marks_obtained::numeric /
                    NULLIF(sm.max_marks, 0)
                ) * 100,
                2
            ) AS percentage,
            sm.grade,
            sm.remarks,
            sm.record_status
        FROM sss_student_marks sm
        LEFT JOIN sss_student_master s
            ON sm.student_id = s.student_id
        LEFT JOIN sss_class_master c
            ON s.class_id = c.class_id
        LEFT JOIN sss_subject_master sub
            ON sm.subject_id = sub.subject_id
        LEFT JOIN sss_exam_master e
            ON sm.exam_id = e.exam_id
        WHERE sm.record_status = 'Active'
        ORDER BY sm.marks_id;
    """

    try:
        result = db.execute(text(query)).mappings().all()
        return [dict(row) for row in result]

    except SQLAlchemyError as exc:
        db.rollback()
        print("Student progress database error:", exc)

        raise HTTPException(
            status_code=500,
            detail="Unable to load student progress data.",
        )