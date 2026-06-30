import pool from "../../config/db";

export async function createRSVPService(
    eventDateId: string,
    userId: string
) {

    const client =
        await pool.connect();

    try {

        await client.query( "BEGIN");

        //Idenfity event date
        const result =
            await client.query(
                `
                SELECT
                    ed.id,
                    e.capacity
                FROM event_dates ed
                JOIN events e
                    ON e.id = ed.event_id
                WHERE ed.id=$1
                FOR UPDATE
                `,
                [eventDateId]
            );

        if (result.rowCount === 0) {
            throw new Error(
                "Event date not found"
            );
        }

        const capacity =
            result.rows[0]
                .capacity;

        const count =
            await client.query(
                `
                SELECT COUNT(*)
                FROM rsvps
                WHERE
                    event_date_id=$1
                    AND status='CONFIRMED'
                `,
                [eventDateId]
            );

        const confirmed =
            Number(
                count.rows[0]
                    .count
            );

        const status =
            confirmed
            < capacity
            ? "CONFIRMED"
            : "WAITLISTED";

        const insert =
            await client.query(
                `
                INSERT INTO rsvps (
                    id,
                    user_id,
                    event_date_id,
                    status
                )
                VALUES (
                    gen_random_uuid(),
                    $1,
                    $2,
                    $3
                )
                RETURNING id
                `,
                [
                    userId,
                    eventDateId,
                    status
                ]
            );

        await client.query("COMMIT");

        return {
            rsvpId:
                insert.rows[0]
                    .id,
            status
        };

    } catch (err) {
        
        await client.query("ROLLBACK");
        throw err;

    } finally {

        client.release();

    }

}