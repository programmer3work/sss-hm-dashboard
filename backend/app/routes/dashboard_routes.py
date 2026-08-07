from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db

router = APIRouter()


# ================= OPTIMIZED QUERY =================
DASHBOARD_QUERY = """
WITH
summary AS (
    SELECT
        (
            SELECT COUNT(*)
            FROM sss_student_master
            WHERE record_status = 'Active'
        ) AS total_students,

        (
            SELECT COUNT(*)
            FROM sss_teacher_master
            WHERE is_active = TRUE
        ) AS total_teachers,

        (
            SELECT COUNT(*)
            FROM sss_class_master
            WHERE record_status = 'Active'
        ) AS total_classes,

        (
            SELECT ROUND(AVG(marks_obtained), 2)
            FROM sss_student_marks
            WHERE record_status = 'Active'
        ) AS average_marks,

        (
            SELECT ROUND(
                (
                    SUM(
                        CASE
                            WHEN marks_obtained >= 33 THEN 1
                            ELSE 0
                        END
                    )::numeric
                    / NULLIF(COUNT(*), 0)
                ) * 100,
                2
            )
            FROM sss_student_marks
            WHERE record_status = 'Active'
        ) AS pass_percentage
),

performance AS (
    SELECT COALESCE(json_agg(t), '[]'::json) AS data
    FROM (
        SELECT
            c.class_name,
            c.section_name,
            ROUND(
                AVG(
                    (m.marks_obtained / NULLIF(m.max_marks, 0)) * 100
                ),
                2
            ) AS percentage
        FROM sss_student_marks m
        JOIN sss_student_master s
            ON m.student_id = s.student_id
        JOIN sss_class_master c
            ON s.class_id = c.class_id
        WHERE m.record_status = 'Active'
        GROUP BY
            c.class_name,
            c.section_name
        ORDER BY
            c.class_name,
            c.section_name
    ) t
),

pass_fail AS (
    SELECT
        COALESCE(
            SUM(
                CASE
                    WHEN marks_obtained >= 33 THEN 1
                    ELSE 0
                END
            ),
            0
        ) AS pass_count,

        COALESCE(
            SUM(
                CASE
                    WHEN marks_obtained < 33 THEN 1
                    ELSE 0
                END
            ),
            0
        ) AS fail_count
    FROM sss_student_marks
    WHERE record_status = 'Active'
),

headmaster AS (
    SELECT json_build_object(
        'full_name', u.username,
        'role_name', u.role::text
    ) AS data
    FROM sss_users_master u
    WHERE LOWER(u.role::text) = 'headmaster'
      AND u.is_active = TRUE
    LIMIT 1
),

notifications AS (
    SELECT COUNT(*) AS unread_count
    FROM sss_notice_board
    WHERE is_read = FALSE
)

SELECT
    (SELECT row_to_json(summary) FROM summary) AS summary,
    (SELECT data FROM performance) AS performance,
    (SELECT row_to_json(pass_fail) FROM pass_fail) AS pass_fail,
    COALESCE(
        (SELECT data FROM headmaster),
        '{}'::json
    ) AS headmaster,
    (SELECT unread_count FROM notifications) AS unread_count;
"""


# ================= API =================
@router.get("/")
def dashboard_core(db: Session = Depends(get_db)):
    try:
        result = (
            db.execute(text(DASHBOARD_QUERY))
            .mappings()
            .fetchone()
        )

        if not result:
            return {
                "summary": {
                    "total_students": 0,
                    "total_teachers": 0,
                    "total_classes": 0,
                    "average_marks": 0,
                    "pass_percentage": 0,
                },
                "performance": [],
                "pass_fail": [
                    {"name": "Pass", "value": 0},
                    {"name": "Fail", "value": 0},
                ],
                "headmaster": {},
                "unread_count": 0,
            }

        row = dict(result)

        summary = row.get("summary") or {}
        pass_fail = row.get("pass_fail") or {}

        return {
            "summary": {
                "total_students": summary.get("total_students") or 0,
                "total_teachers": summary.get("total_teachers") or 0,
                "total_classes": summary.get("total_classes") or 0,
                "average_marks": summary.get("average_marks") or 0,
                "pass_percentage": summary.get("pass_percentage") or 0,
            },
            "performance": row.get("performance") or [],
            "pass_fail": [
                {
                    "name": "Pass",
                    "value": pass_fail.get("pass_count") or 0,
                },
                {
                    "name": "Fail",
                    "value": pass_fail.get("fail_count") or 0,
                },
            ],
            "headmaster": row.get("headmaster") or {},
            "unread_count": row.get("unread_count") or 0,
        }

    except SQLAlchemyError as exc:
        db.rollback()
        print("Dashboard database error:", exc)

        raise HTTPException(
            status_code=500,
            detail="Unable to load dashboard data from the database.",
        )