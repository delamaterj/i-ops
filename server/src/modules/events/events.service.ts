import pool from "../../config/db";
import { validateCreateEvent } from "./events.validation"

export async function createEventService(input: any, userId: string) {

    //Validate input
    validateCreateEvent(input);

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        //Insert event
        const eventResult = await client.query(
            `
            INSERT INTO events (
                id,
                title,
                description,
                created_by,
                status,
                created_at,
                updated_at
            )
            VALUES (
                gen_random_uuid(),
                $1,
                $2,
                $3,
                'DRAFT',
                NOW(),
                NOW()
            )
            RETURNING id
            `,
            [input.title, input.description ?? null, userId]
        );

        const eventId = eventResult.rows[0].id;

        //Insert event_dates
        for (const d of input.eventDates) {
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
                    d.start_time,
                    d.end_time ?? null
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
                created_at,
                updated_at
            )
            VALUES (
                gen_random_uuid(),
                $1,
                $2,
                'PENDING',
                NOW(),
                NOW()
            )
            `,
            [eventId, userId]
        );

        await client.query("COMMIT");

        return eventId;

    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
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

