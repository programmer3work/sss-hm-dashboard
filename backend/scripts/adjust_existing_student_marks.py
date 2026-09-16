import argparse
import sys
from pathlib import Path

from sqlalchemy import text

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.database import engine


def parse_args():
    parser = argparse.ArgumentParser(
        description="Adjust existing passing marks to a failing value."
    )
    parser.add_argument("--count", type=int, required=True)
    parser.add_argument("--fail-mark", type=int, required=True)
    parser.add_argument("--class-id", type=int)
    parser.add_argument("--subject-id", type=int)
    parser.add_argument("--exam-id", type=int)
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


def select_existing_marks(connection, args):
    return connection.execute(
        text(
            """
            SELECT m.marks_id, m.student_id, s.class_id, m.exam_id,
                   m.subject_id, m.marks_obtained, m.max_marks
            FROM sss_student_marks m
            JOIN sss_student_master s ON s.student_id = m.student_id
            WHERE m.record_status = 'Active'
              AND s.record_status = 'Active'
              AND m.marks_obtained >= 33
              AND m.max_marks IS NOT NULL
              AND m.max_marks > 0
              AND (:class_id IS NULL OR s.class_id = :class_id)
              AND (:subject_id IS NULL OR m.subject_id = :subject_id)
              AND (:exam_id IS NULL OR m.exam_id = :exam_id)
            ORDER BY m.marks_id
            LIMIT :count
            """
        ),
        {
            "class_id": args.class_id,
            "subject_id": args.subject_id,
            "exam_id": args.exam_id,
            "count": args.count,
        },
    ).mappings().all()


def adjust_marks(args):
    if args.count < 1:
        raise ValueError("--count must be greater than zero.")
    if args.fail_mark < 0 or args.fail_mark >= 33:
        raise ValueError("--fail-mark must be between 0 and 32.")

    with engine.begin() as connection:
        selected = select_existing_marks(connection, args)
        if len(selected) < args.count:
            raise RuntimeError(
                f"Only {len(selected)} eligible existing passing marks found; "
                f"cannot adjust {args.count}."
            )

        print("Selected existing marks:")
        for row in selected:
            print(
                f"  marks_id={row['marks_id']} student_id={row['student_id']} "
                f"class_id={row['class_id']} subject_id={row['subject_id']} "
                f"exam_id={row['exam_id']} current={row['marks_obtained']}"
            )

        if not args.dry_run:
            connection.execute(
                text(
                    """
                    UPDATE sss_student_marks
                    SET marks_obtained = :fail_mark
                    WHERE marks_id = ANY(:marks_ids)
                    """
                ),
                {
                    "fail_mark": args.fail_mark,
                    "marks_ids": [row["marks_id"] for row in selected],
                },
            )

        counts = connection.execute(
            text(
                """
                SELECT
                    COUNT(*) FILTER (
                        WHERE record_status = 'Active' AND marks_obtained >= 33
                    ) AS pass_count,
                    COUNT(*) FILTER (
                        WHERE record_status = 'Active' AND marks_obtained < 33
                    ) AS fail_count
                FROM sss_student_marks
                """
            )
        ).mappings().one()

    print(f"Pass count: {counts['pass_count']}")
    print(f"Fail count: {counts['fail_count']}")
    print(f"Updated existing records: {0 if args.dry_run else len(selected)}")


if __name__ == "__main__":
    adjust_marks(parse_args())