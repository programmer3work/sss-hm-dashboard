import argparse
import random
import sys
from pathlib import Path
from uuid import uuid4

from faker import Faker
from sqlalchemy import text

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.database import engine


def parse_args():
    parser = argparse.ArgumentParser(
        description="Generate linked failed student assessment records."
    )
    parser.add_argument("--count", type=int, required=True)
    parser.add_argument("--max-marks", type=int, required=True)
    parser.add_argument("--fail-max", type=int, required=True)
    parser.add_argument("--class-id", type=int)
    parser.add_argument("--subject-id", type=int)
    parser.add_argument("--exam-id", type=int)
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


def get_context(connection, args):
    query = text(
        """
        SELECT c.class_id, c.class_name, c.section_name,
               s.subject_id, s.subject_name,
               e.exam_id, e.exam_name
        FROM sss_class_master c
        JOIN sss_subject_master s ON s.class_id = c.class_id
        JOIN sss_exam_master e ON e.record_status = 'Active'
        WHERE c.record_status = 'Active'
          AND (:class_id IS NULL OR c.class_id = :class_id)
          AND (:subject_id IS NULL OR s.subject_id = :subject_id)
          AND (:exam_id IS NULL OR e.exam_id = :exam_id)
        ORDER BY c.class_id, s.subject_id, e.exam_id DESC
        LIMIT 1
        """
    )
    context = connection.execute(
        query,
        {
            "class_id": args.class_id,
            "subject_id": args.subject_id,
            "exam_id": args.exam_id,
        },
    ).mappings().one_or_none()
    if not context:
        raise RuntimeError("No matching active class, subject, and exam context found.")
    return context


def seed_records(args):
    if args.count < 1:
        raise ValueError("--count must be greater than zero.")
    if args.max_marks < 1:
        raise ValueError("--max-marks must be greater than zero.")
    if args.fail_max < 0 or args.fail_max >= 33 or args.fail_max > args.max_marks:
        raise ValueError("--fail-max must be below 33 and no greater than --max-marks.")

    fake = Faker("en_IN")
    with engine.begin() as connection:
        context = get_context(connection, args)
        connection.execute(
            text(
                """
                SELECT setval(
                    pg_get_serial_sequence('sss_student_marks', 'marks_id'),
                    COALESCE((SELECT MAX(marks_id) FROM sss_student_marks), 0),
                    TRUE
                )
                """
            )
        )
        before = connection.execute(
            text(
                """
                SELECT COUNT(*)
                FROM sss_student_marks
                WHERE record_status = 'Active'
                  AND marks_obtained < 33
                """
            )
        ).scalar_one()

        if not args.dry_run:
            for _ in range(args.count):
                student_id = connection.execute(
                    text(
                        """
                        INSERT INTO sss_student_master (
                            name, roll_number, section,
                            class_id, admission_no, student_email,
                            is_active, record_status
                        )
                        VALUES (
                            :name, :roll_number, :section_name,
                            :class_id, :admission_no, NULL, TRUE, 'Active'
                        )
                        RETURNING student_id
                        """
                    ),
                    {
                        "name": fake.name(),
                        "roll_number": uuid4().hex[:10].upper(),
                        "section_name": context["section_name"],
                        "class_id": context["class_id"],
                        "admission_no": uuid4().hex,
                    },
                ).scalar_one()

                connection.execute(
                    text(
                        """
                        UPDATE sss_student_master
                        SET student_email = :student_email
                        WHERE student_id = :student_id
                        """
                    ),
                    {
                        "student_email": f"student-{student_id}@demo.invalid",
                        "student_id": student_id,
                    },
                )
                connection.execute(
                    text(
                        """
                        INSERT INTO sss_student_marks (
                            student_id, exam_id, subject_id,
                            marks_obtained, max_marks, grade,
                            remarks, record_status
                        )
                        VALUES (
                            :student_id, :exam_id, :subject_id,
                            :marks_obtained, :max_marks, 'F',
                            'Generated failed assessment record', 'Active'
                        )
                        """
                    ),
                    {
                        "student_id": student_id,
                        "exam_id": context["exam_id"],
                        "subject_id": context["subject_id"],
                        "marks_obtained": random.randint(0, args.fail_max),
                        "max_marks": args.max_marks,
                    },
                )

        after = before if args.dry_run else connection.execute(
            text(
                """
                SELECT COUNT(*)
                FROM sss_student_marks
                WHERE record_status = 'Active'
                  AND marks_obtained < 33
                """
            )
        ).scalar_one()

    print(f"Context: class={context['class_id']} subject={context['subject_id']} exam={context['exam_id']}")
    print(f"Failed marks before: {before}")
    print(f"Failed marks after: {after}")
    print(f"Inserted failed records: {after - before}")


if __name__ == "__main__":
    arguments = parse_args()
    seed_records(arguments)