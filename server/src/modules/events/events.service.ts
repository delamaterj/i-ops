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

