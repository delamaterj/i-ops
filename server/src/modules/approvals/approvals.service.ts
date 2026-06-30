import pool from "../../config/db";
import { validateApprovalDecision } from "./approvals.validation";
import { getNextEventStatus } from "./approvals.utils";

export async function resolveApprovalService(
    approvalId: string,
    adminUserId: string,
    decision: "APPROVED" | "REJECTED",
    description?: string
) {
    validateApprovalDecision(
        decision,
        description
    );

    const client = await pool.connect();

    try {
        //Authorization
        const adminResult =
            await client.query(
                `
                SELECT role
                FROM users
                WHERE id=$1
                `,
                [adminUserId]
            );

        if (adminResult.rowCount === 0) {
            throw new Error("User not found");
        }

        if (adminResult.rows[0].role !== "ADMIN") {
            throw new Error("Forbidden");
        }

        await client.query("BEGIN");

        //Lock approval
        const approvalResult =
            await client.query(
                `
                SELECT
                    id,
                    event_id,
                    status
                FROM approvals
                WHERE id=$1
                FOR UPDATE
                `,
                [approvalId]
            );

        if (approvalResult.rowCount === 0) {
            throw new Error("Approval not found");
        }

        const approval = approvalResult.rows[0];

        if (approval.status !== "PENDING") {
            throw new Error("Only pending approvals may be resolved");
        }

        // Resolve approval
        await client.query(
            `
            UPDATE approvals
            SET
                approved_by=$1,
                status=$2,
                description=$3,
                updated_at=NOW()
            WHERE id=$4
            `,
            [
                adminUserId,
                decision,
                description ?? null,
                approvalId
            ]
        );

        const nextStatus = getNextEventStatus(decision);

        // Update event
        await client.query(
            `
            UPDATE events
            SET
                status=$1,
                updated_at=NOW()
            WHERE id=$2
            `,
            [
                nextStatus,
                approval.event_id
            ]
        );

        await client.query("COMMIT");

        return {
            approvalId,
            eventId:
                approval.event_id,
            approvalStatus:
                decision,
            eventStatus:
                nextStatus
        };

    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}