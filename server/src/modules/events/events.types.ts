export interface EventDepartment {
    id: string;
    name: string;
}

export interface EventDateDetails {
    id: string;
    start_time: Date;
    end_time: Date | null;
    rsvp_status:
        | "CONFIRMED"
        | "WAITLISTED"
        | null;
    confirmed_count?: number;
    waitlisted_count?: number;
    available_spots: number;
}

export interface EventDetailsResponse {
    id: string;
    title: string;
    description: string;
    status: string;
    capacity: number;
    created_at: Date;
    departments:
        EventDepartment[];
    upcoming_dates:
        EventDateDetails[];
    past_dates:
        EventDateDetails[];
}