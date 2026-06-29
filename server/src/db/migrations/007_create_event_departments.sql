CREATE TABLE event_departments (
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, department_id)
);