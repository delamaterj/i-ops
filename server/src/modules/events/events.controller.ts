import pool from "../../config/db";

export async function getEventFeedService(
    userId: string
) {

    const client = await pool.connect();

    try {

        //Get user departments
        const deptResult = await client.query(
                `
                SELECT department_id
                FROM user_departments
                WHERE user_id = $1
                `,
                [userId]
            );

        const departments = deptResult.rows.map(r => r.department_id);

        if (departments.length === 0) {
            return [];
        }

        //Main query
        const events =
            await client.query(
                `
                SELECT DISTINCT
                    e.id,
                    e.title,
                    e.description,
                    e.status,
                    e.capacity,
                    e.created_at,

                    ed.id AS event_date_id,
                    ed.start_time,
                    ed.end_time

                FROM events e

                JOIN event_dates ed
                    ON ed.event_id = e.id

                JOIN event_departments edp
                    ON edp.event_id = e.id

                WHERE
                    e.status IN ('PUBLISHED', 'SUBMITTED')

                AND edp.department_id = ANY($1)

                ORDER BY ed.start_time ASC
                `,
                [departments]
            );

        return events.rows;

    } finally {
        client.release();
    }
}