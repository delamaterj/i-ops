import pool from "../../config/db";

export async function cancelRSVPService(
    eventDateId: string,
    userId: string
) {

    const client =
        await pool.connect();

    try {

        await client.query("BEGIN");

        //Delete RSVP
        const deleted =
            await client.query(
                `
                DELETE FROM rsvps
                WHERE
                    user_id = $1
                    AND event_date_id = $2
                RETURNING status
                `,
                [
                    userId,
                    eventDateId
                ]
            );

        if (
            deleted.rowCount === 0
        ) {
            throw new Error(
                "RSVP not found"
            );
        }

        //Update if there is an open spot
        const capacityResult =
            await client.query(
                `
                SELECT
                    e.capacity
                FROM event_dates ed
                JOIN events e
                    ON e.id = ed.event_id
                WHERE ed.id = $1
                `,
                [eventDateId]
            );

        const capacity = capacityResult.rows[0].capacity;

        const confirmedResult =
            await client.query(
                `
                SELECT COUNT(*)
                FROM rsvps
                WHERE
                    event_date_id = $1
                    AND status = 'CONFIRMED'
                `,
                [eventDateId]
            );

        const confirmed =
            Number(
                confirmedResult.rows[0]
                    .count
            );

        const available = capacity - confirmed;

        if (available > 0) {

            const waitlist =
                await client.query(
                    `
                    SELECT id
                    FROM rsvps
                    WHERE
                        event_date_id = $1
                        AND status = 'WAITLISTED'
                    ORDER BY created_at ASC
                    LIMIT $2
                    `,
                    [
                        eventDateId,
                        available
                    ]
                );

            if (waitlist.rows.length > 0) {

                const ids =
                    waitlist.rows.map(
                        r => r.id
                    );

                await client.query(
                    `
                    UPDATE rsvps
                    SET
                        status = 'CONFIRMED',
                        updated_at = NOW()
                    WHERE id = ANY($1)
                    `,
                    [ids]
                );

            }

        }

        await client.query("COMMIT");

        return {
            eventDateId,
            status: "CANCELLED"
        };

    } catch (err) {

        await client.query("ROLLBACK");

        throw err;

    } finally {

        client.release();

    }

}