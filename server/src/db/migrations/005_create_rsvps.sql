CREATE TABLE rsvps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_date_id UUID NOT NULL REFERENCES event_dates(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL
        CHECK (status IN ('CONFIRMED', 'WAITLISTED', 'CANCELLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, event_date_id)
);