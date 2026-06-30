export function getNextEventStatus(
    decision:
        | "APPROVED"
        | "REJECTED"
) {
    switch (decision) {
        case "APPROVED":
            return "PUBLISHED";
        case "REJECTED":
            return "DRAFT";
        default:
            throw new Error("Invalid approval decision");
    }
}