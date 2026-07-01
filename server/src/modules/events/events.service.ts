import pool from "../../config/db";

export async function createEventService(payload: any, userId: string) {

    const client = await pool.connect();

    try {

        await client.query("BEGIN");

        //Create event
        const eventResult = await client.query(
                `
                INSERT INTO events (
                    id,
                    title,
                    description,
                    capacity,
                    status,
                    created_by
                )
                VALUES (
                    gen_random_uuid(),
                    $1,
                    $2,
                    $3,
                    'DRAFT',
                    $4
                )
                RETURNING id
                `,
                [
                    payload.title,
                    payload.description,
                    payload.capacity,
                    userId
                ]
            );

        const eventId = eventResult.rows[0].id;

        //Insert event_dates
        for (const date of payload.dates
        ) {
            await client.query(
                `
                INSERT INTO event_dates (
                    id,
                    event_id,
                    start_time,
                    end_time
                )
                VALUES (
                    gen_random_uuid(),
                    $1,
                    $2,
                    $3
                )
                `,
                [
                    eventId,
                    date.start_time,
                    date.end_time
                ]
            );

        }

        //Insert departments
        for (const deptId of payload.departments) {

            await client.query(
                `
                INSERT INTO event_departments (
                    event_id,
                    department_id
                )
                VALUES (
                    $1,
                    $2
                )
                `,
                [
                    eventId,
                    deptId
                ]
            );

        }

        //Create approval
        await client.query(
            `
            INSERT INTO approvals (
                id,
                event_id,
                submitted_by,
                status,
                description
            )
            VALUES (
                gen_random_uuid(),
                $1,
                $2,
                'PENDING',
                NULL
            )
            `,
            [
                eventId,
                userId
            ]
        );

        await client.query("COMMIT");

        return {eventId, status: "DRAFT"};
    }

    catch (err) {

        await client.query("ROLLBACK");
        throw err;
    }

    finally {
        client.release();
    }

}

export async function publishEventService(eventId: string, adminUserId: string) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        //Verify elgible event exists
        const eventResult = await client.query(
            `
            SELECT id, status
            FROM events
            WHERE id = $1
            FOR UPDATE
            `,
            [eventId]
        );

        if (eventResult.rowCount === 0) {
            throw new Error("Event not found");
        }

        const event = eventResult.rows[0];

        if (event.status !== "SUBMITTED" && event.status !== "DRAFT") {
            throw new Error("Event cannot be published");
        }

        //Check for approval
        const approvalResult = await client.query(
            `
            SELECT id
            FROM approvals
            WHERE event_id = $1
              AND status = 'APPROVED'
            ORDER BY updated_at DESC
            LIMIT 1
            `,
            [eventId]
        );

        if (approvalResult.rowCount === 0) {
            throw new Error("No approved approval found");
        }

        //Update event status (published)
        await client.query(
            `
            UPDATE events
            SET status = 'PUBLISHED',
                updated_at = NOW()
            WHERE id = $1
            `,
            [eventId]
        );

        await client.query("COMMIT");

        return {
            eventId,
            status: "PUBLISHED",
            message: "Event successfully published"
        };

    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

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

        //Main feed query
        const result =
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
                    ed.end_time,

                    r.status AS rsvp_status

                FROM events e

                JOIN event_dates ed
                    ON ed.event_id = e.id

                JOIN event_departments edp
                    ON edp.event_id = e.id

                LEFT JOIN rsvps r
                    ON r.event_date_id = ed.id
                    AND r.user_id = $1

                WHERE
                    e.status IN ('PUBLISHED', 'SUBMITTED')

                AND edp.department_id = ANY($2)

                ORDER BY ed.start_time ASC
                `,
                [userId, departments]
            );

        return result.rows;

    } finally {

        client.release();

    }

}

export async function getEventDetailsService(
    eventId: string,
    userId: string
) {

    const client =
        await pool.connect();

    try {

        const userDepartments = await client.query(
                `
                SELECT department_id
                FROM user_departments
                WHERE user_id=$1
                `,
                [userId]
            );

        const departments = userDepartments.rows.map(r => r.department_id);

        if (departments.length === 0) {

            return null;

        }

        const result = await client.query(
                `SELECT
                    e.id,
                    e.title,
                    e.description,
                    e.status,
                    e.capacity,
                    e.created_at,
                    d.id AS department_id,
                    d.name AS department_name,
                    ed.id AS event_date_id,
                    ed.start_time,
                    ed.end_time,
                    r.status AS rsvp_status,

                    COALESCE(rsvp.confirmed_count,0)
                    AS confirmed_count,

                    COALESCE(rsvp.waitlisted_count,0)
                    AS waitlisted_count

                FROM events e

                JOIN event_dates ed
                ON ed.event_id=e.id

                JOIN event_departments ep
                ON ep.event_id=e.id

                JOIN departments d
                ON d.id=ep.department_id

                LEFT JOIN rsvps r
                ON r.event_date_id=ed.id
                AND r.user_id=$2

                LEFT JOIN (

                    SELECT

                    event_date_id,

                    COUNT(*) FILTER (WHERE status='CONFIRMED')
                    AS confirmed_count,

                    COUNT(*) FILTER (WHERE status='WAITLISTED')
                    AS waitlisted_count

                    FROM rsvps

                    GROUP BY event_date_id

                )

                rsvp

                ON rsvp.event_date_id=ed.id
                WHERE
                e.id=$1
                AND ep.department_id=ANY($3)`,
                [
                    eventId,
                    userId,
                    departments
                ]
            );

        if (result.rowCount === 0) {

            return null;

        }

        const rows = result.rows;
        const departmentMap = new Map();
        const upcoming = [];
        const past = [];
        const dateMap = new Map();
        const now = new Date();

        for (const row of rows) {

            if (!departmentMap.has(row.department_id)) {

                departmentMap.set(row.department_id,
                    {
                        id:
                            row.department_id,

                        name:
                            row.department_name
                    }
                );

            }

            if (!dateMap.has(row.event_date_id)
            ) {
                const available = Math.max(0, row.capacity - Number(row.confirmed_count));

                const date = {

                    id:
                        row.event_date_id,

                    start_time:
                        row.start_time,

                    end_time:
                        row.end_time,

                    rsvp_status:
                        row.rsvp_status,

                    confirmed_count:
                        Number(row.confirmed_count),

                    waitlisted_count:
                        available === 0
                            ? Number(row.waitlisted_count)
                            : undefined,

                    available_spots:
                        available

                };

                dateMap.set(row.event_date_id,date);

                const effectiveEnd =
                    row.end_time
                    ??
                    row.start_time;

                if (new Date(effectiveEnd) >= now) {

                    upcoming.push(
                        date
                    );

                }

                else {

                    past.push(
                        date
                    );

                }

            }

        }

        if (upcoming.length + past.length === 0) {

            throw new Error("Invalid event state");

        }

        return {

            id:
                rows[0].id,

            title:
                rows[0].title,

            description:
                rows[0].description,

            status:
                rows[0].status,

            capacity:
                rows[0].capacity,

            created_at:
                rows[0].created_at,

            departments:
                [
                    ...departmentMap.values()
                ],

            upcoming_dates:
                upcoming,

            past_dates:
                past

        };

    }

    finally {

        client.release();

    }

}