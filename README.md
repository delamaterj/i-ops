# Intelligent Event Operations Platform (I-OPS)

A full-stack event management system designed to simulate real-world internal company event workflows, including event creation, department-based visibility, RSVP management with capacity + waitlisting, and an approval-based event publishing system.

---

## Project Overview

This system models a real organizational event pipeline where:

- Users create events (initially in **DRAFT** state)
- Events must be approved before being published
- Events are visible based on **department membership**
- Users can RSVP to event dates with **capacity + waitlist logic**
- Admins manage event approvals and publishing

The goal of this project is to demonstrate **production-style backend architecture**, including:
- relational database design
- transactional integrity
- role-based access control
- service-layer architecture
- query optimization for read-heavy systems

---

## Architecture

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL
- JWT Authentication
- Service-layer architecture

### Database
PostgreSQL schema includes:

- `events`
- `event_dates`
- `event_departments`
- `departments`
- `rsvps`
- `approvals`
- `users` (external dependency assumed)

---

## Core Features

### 1. Event Lifecycle
Events follow a structured lifecycle:


DRAFT → SUBMITTED → APPROVED → PUBLISHED


- Events are created as `DRAFT`
- Admins submit approvals
- Approved events become `PUBLISHED`
- Rejected events can return to editable state

---

### 2. Department-Based Visibility

Events are only visible to users if:

- The user belongs to at least one department assigned to the event

This enables:
- internal-only events
- department-specific events
- cross-department collaboration events

---

### 3. Event Dates System

Each event supports multiple scheduled occurrences:

- Start and end times per event date
- Each date has independent RSVP tracking
- Events are grouped into:
  - Upcoming dates
  - Past dates

---

### 4. RSVP System

RSVPs support:

- CONFIRMED attendance
- WAITLISTED status when capacity is full
- FIFO-style waitlist promotion (future enhancement)

Rules:
- Each user can RSVP once per event date
- Capacity is enforced per event date
- Cancelling RSVPs updates waitlist automatically (planned enhancement)

---

### 5. Approval System

- Every event requires an approval record
- Approvals support:
  - PENDING
  - APPROVED
  - REJECTED

- Approvals are historical (never deleted)
- Latest approval determines event state

---

## Authentication & Authorization

- JWT-based authentication
- Middleware protects all event-related routes
- Only authenticated users can:
  - create events
  - RSVP
- Admin-only endpoints control approval flow (planned/expanding)

---

## API Overview

### Auth


POST /auth/register
POST /auth/login


---

### Events


POST /events → Create event (DRAFT)
GET /events/feed → Department-filtered event feed
GET /events/:id → Full event details (aggregated)


---

### RSVP (planned/expanding)


POST /rsvps
DELETE /rsvps/:id


---

### Approvals


POST /approvals/:eventId/approve
POST /approvals/:eventId/reject


---

## Key Design Decisions

### 1. Normalized relational design
Avoids duplication and supports scalable querying.

### 2. Transaction-safe event creation
Event creation is atomic across:
- events
- event_dates
- event_departments
- approvals

### 3. Read/write separation mindset
- Write operations → services (transactions)
- Read operations → optimized JOIN queries

### 4. Aggregated API responses
Event details endpoint returns structured JSON:

```json
{
"event":{},
"departments": [],
"upcoming_dates": [],
"past_dates": []
}
```
Tech Stack
Node.js
Express
TypeScript
PostgreSQL
pgAdmin
JWT
Postman (testing)
Testing

You can test the API using Postman:

Register or login a user
Copy JWT token
Add to headers:
Authorization: Bearer <token>
Use /events endpoints
Current Status
Completed Sprints
Sprint 1: Core Event System
Event creation
Event feed (department filtered)
Event details (aggregated)
RSVP system (capacity + waitlist)
Approval system design
Upcoming Work
Admin approval workflow service
Role-based access control (ADMIN vs USER)
RSVP cancellation + queue promotion
Event edit constraints (DRAFT-only editing)
Aggregated RSVP analytics
Pagination for event feed
Future Improvements
Redis caching for event feed
WebSocket notifications (RSVP updates)
Event recommendation system
Audit logs for approvals
Rate limiting on RSVP endpoints
License

This project is for educational and portfolio purposes.


Built as a full-stack backend systems practice project focusing on:

scalable API design
relational database modeling
production-grade backend architecture
