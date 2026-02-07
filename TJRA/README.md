# Website Analytics Service

A high-performance backend for capturing and reporting website analytics events. The system follows a decoupled, queue-driven pattern inspired by classic distributed-systems architectures, enabling extremely fast ingestion and reliable background processing.

---

## 📦 System Components

The system is composed of several Dockerized services:

* **API Service (Services 1 & 3)**
  Node.js/Express server providing:

  * `POST /event` — event ingestion
  * `GET /stats` — analytics reporting

* **Processor Service (Service 2)**
  Background Node.js worker that consumes queued events and writes them to MongoDB.

* **Supporting Services**

  * **Redis** — message queue
  * **MongoDB** — persistent datastore

---

## 🏛️ Architecture

### Goals

* Make the `POST /event` endpoint extremely fast.
* Avoid blocking clients with database I/O.
* Provide accurate aggregated reporting.

### How It Works

* **Event Ingestion (`POST /event`):**

  * Validates JSON input.
  * Serializes and pushes the event to Redis using `LPUSH`.
  * Returns `202 Accepted` immediately.

* **Event Processing (Worker):**

  * Uses `BRPOP` to wait for new events.
  * Saves events to MongoDB in the background.

* **Analytics Reporting (`GET /stats`):**

  * Queries MongoDB using aggregation pipelines.
  * Provides totals, unique users, and top paths.

### Redis as the Queue

* In-memory speed for low-latency ingestion.
* Simple, lightweight setup compared to heavier brokers.
* Persistent across API restarts.

---

## 🗄️ Database Schema

**Database:** MongoDB
**Collection:** `events`

| Field        | Type   | Description                  | Index |
| ------------ | ------ | ---------------------------- | ----- |
| `site_id`    | String | Site identifier              | Yes   |
| `event_type` | String | Event type (e.g., page_view) | —     |
| `path`       | String | URL path                     | Yes   |
| `user_id`    | String | User identifier              | Yes   |
| `timestamp`  | Date   | ISO timestamp                | Yes   |

Indexes are created to support fast aggregation queries.

---

## 🚀 Setup Instructions

### Prerequisites

* Docker
* Docker Compose

### Start the System

```bash
docker-compose up --build
```

### Services

* API → `http://localhost:3000`
* MongoDB → port `27017`
* Redis → port `6379`
* Processor → runs automatically in the background

---

## ⚙️ API Usage

Use `curl` or any HTTP client to test endpoints.

---

### 1. `POST /event` — Ingestion

Returns `202 Accepted` immediately.

**Example:**

```bash
curl -X POST http://localhost:3000/event \
-H "Content-Type: application/json" \
-d '{
  "site_id": "site-abc-123",
  "event_type": "page_view",
  "path": "/pricing",
  "user_id": "user-xyz-789",
  "timestamp": "2025-11-12T19:30:01Z"
}'
```

More sample events:

```bash
curl -X POST http://localhost:3000/event -H "Content-Type: application/json" \
-d '{
  "site_id": "site-abc-123",
  "event_type": "page_view",
  "path": "/pricing",
  "user_id": "user-abc-111",
  "timestamp": "2025-11-12T19:32:00Z"
}'

curl -X POST http://localhost:3000/event -H "Content-Type: application/json" \
-d '{
  "site_id": "site-abc-123",
  "event_type": "page_view",
  "path": "/blog/post-1",
  "user_id": "user-xyz-789",
  "timestamp": "2025-11-12T19:33:00Z"
}'

curl -X POST http://localhost:3000/event -H "Content-Type: application/json" \
-d '{
  "site_id": "site-abc-123",
  "event_type": "page_view",
  "path": "/",
  "user_id": "user-xyz-789",
  "timestamp": "2025-11-13T10:00:00Z"
}'
```

---

### 2. `GET /stats` — Reporting

**Query Parameters:**

* `site_id` (required)
* `date` (optional, format: `YYYY-MM-DD`)

**Example (daily stats):**

```bash
curl "http://localhost:3000/stats?site_id=site-abc-123&date=2025-11-12"
```

**Expected Response:**

```json
{
  "site_id": "site-abc-123",
  "date": "2025-11-12",
  "total_views": 3,
  "unique_users": 2,
  "top_paths": [
    { "path": "/pricing", "views": 2 },
    { "path": "/blog/post-1", "views": 1 }
  ]
}
```

**Example (all-time stats):**

```bash
curl "http://localhost:3000/stats?site_id=site-abc-123"
```

**Expected Response:**

```json
{
  "site_id": "site-abc-123",
  "date": "all-time",
  "total_views": 4,
  "unique_users": 2,
  "top_paths": [
    { "path": "/pricing", "views": 2 },
    { "path": "/blog/post-1", "views": 1 },
    { "path": "/", "views": 1 }
  ]
}