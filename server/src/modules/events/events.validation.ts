export function validateCreateEvent(input: any) {
    if (!input.title || input.title.trim().length === 0) {
        throw new Error("Title is required");
    }

    if (!Array.isArray(input.eventDates) || input.eventDates.length === 0) {
        throw new Error("At least one event date is required");
    }

    for (const d of input.eventDates) {
        if (!d.start_time) {
            throw new Error("start_time is required");
        }

        const start = new Date(d.start_time);
        const end = d.end_time ? new Date(d.end_time) : null;

        if (end && end < start) {
            throw new Error("end_time cannot be before start_time");
        }
    }
}