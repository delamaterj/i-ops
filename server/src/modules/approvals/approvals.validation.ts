export function validateApprovalDecision(
    decision: "APPROVED" | "REJECTED",
    description?: string
) {

    if (
        decision === "REJECTED"
        &&
        !description?.trim()
    ) {
        throw new Error(
            "Rejection reason required"
        );
    }

}