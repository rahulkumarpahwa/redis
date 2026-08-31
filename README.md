# Redis Monorepo

A monorepo of Redis-based microservices built with Node.js, Express, and MongoDB. This project demonstrates various Redis use cases — caching, queues, pub/sub, OTP, and more — organized as npm workspaces.

## Tech Stack

- **Node.js** (ESM modules)
- **Express 5** — web framework
- **ioredis 6** — Redis client
- **Mongoose 9** — MongoDB ODM
- **Docker Compose** — local infrastructure (Redis + MongoDB)
- **npm workspaces** — monorepo management

## Project Structure

```
Redis/
├── boilerplate/          # Starter template service
│   └── src/index.js
├── site-banner/          # Site banner service
│   └── src/index.js
├── otp/                  # OTP service
│   └── src/
│       ├── index.js      # Express app & routes
│       ├── utils.js      # Phone validation & OTP generation
│       └── conn.js       # MongoDB connection
├── user/                 # User service (Redis JSON & hash storage)
│   └── src/index.js
├── user-session/         # User session service (MongoDB auth + Redis cache)
│   └── src/
│       ├── index.js            # Express app & routes (signup, login, cache lookup)
│       ├── db/connection.js    # MongoDB connection
│       ├── validation/user.js  # Zod user validation (email + password)
│       └── schema/user.js      # Mongoose User schema
├── queue/                # Queue service
│   └── src/index.js
├── pubsub/               # Pub/Sub service (planned)
├── dashboard/            # Dashboard (planned)
├── docker-compose.yml    # Redis + MongoDB infrastructure
├── package.json          # Workspace root
├── postman/              # Postman collection for the services
└── README.md
```

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/)
- [Docker](https://www.docker.com/) & Docker Compose

## Getting Started

### 1. Install dependencies

```bash
npm install
```

This installs dependencies for all workspaces.

### 2. Start infrastructure (Redis + MongoDB)

```bash
docker compose up -d
```

This starts:

| Service  | Container | Port        | Persistence        |
|----------|-----------|-------------|--------------------|
| Redis    | `redis`   | `6379`      | AOF enabled, volume `redis_data` |
| MongoDB  | `mongodb` | `27018:27017` | Volume `mongodb_data`, initial DB `database_with_redis` |

### 3. Run a service

```bash
npm run dev:boilerplate     # or dev:site-banner, dev:otp
```

## Workspaces

| Workspace     | Status      | Description                                  |
|---------------|-------------|----------------------------------------------|
| `boilerplate` | ✅ Implemented | Starter template with Redis & MongoDB health endpoints |
| `site-banner` | ✅ Implemented | Site banner service                          |
| `otp`         | ✅ Implemented | OTP generation & verification service (30s expiry) |
| `user`        | ✅ Implemented | User data stored as Redis JSON strings & hashes |
| `user-session`| ✅ Implemented | User session & auth service (MongoDB + Redis caching)        |
| `queue`       | ✅ Implemented | Background job queue service                 |
| `pubsub`      | 🚧 Planned   | Publish/subscribe messaging service          |
| `dashboard`   | 🚧 Planned   | Dashboard service                            |

## Available Scripts

| Command                    | Description                          |
|----------------------------|--------------------------------------|
| `npm run dev:boilerplate`  | Run the boilerplate service          |
| `npm run dev:site-banner`  | Run the site-banner service          |
| `npm run dev:otp`          | Run the OTP service                  |
| `npm run dev:user`         | Run the user service                 |
| `npm run dev:user-session` | Run the user-session service         |
| `npm run dev:queue`        | Run the queue service                |
| `npm run dev:pubsub`       | Run the pub/sub service (planned)    |
| `npm run dev:dashboard`    | Run the dashboard (planned)          |

## Environment Variables

| Variable      | Default                          | Description                    |
|---------------|----------------------------------|--------------------------------|
| `REDIS_URL`   | `redis://localhost:6379`         | Redis connection URL           |
| `MONGODB_URL` | `mongodb://localhost:27018/database_with_redis` | MongoDB connection URL |
| `PORT`        | `5000`                           | HTTP server port               |

## API Endpoints

> All services default to port `5000` (`PORT` env var), so run one service at a time locally.

### Boilerplate (`boilerplate`)

| Endpoint | Method | Description                     | Response                                                       |
|----------|--------|---------------------------------|----------------------------------------------------------------|
| `/redis` | GET    | Redis connectivity check (PING) | `{ "redis": "PONG" }`                                          |
| `/mongo` | GET    | MongoDB connection check        | `{ "mongodb": "connected", "databse": "database_with_redis" }` |

### Site banner (`site-banner`)

Stores a single banner message at the Redis key `app:site-banner-key`. Every service also exposes `GET /redis` for a connectivity check.

| Endpoint         | Method | Description                         | Response                                                                      |
|------------------|--------|-------------------------------------|-------------------------------------------------------------------------------|
| `/banner`        | POST   | Set the banner message              | `201` → `{ "success": true, "message": "data setted in redis successfully!" }` |
| `/banner`        | GET    | Get the banner message              | `200` → `{ "success": true, "banner": "..." }`; `400` if no banner is set     |
| `/banner`        | DELETE | Delete the banner key               | `200` → `{ "success": true, "message": "deleted app:site-banner-key" }`       |
| `/banner/exists` | GET    | Check whether the banner key exists | `200` → `{ "exists": true, "exists_value": 1 }`                                |

```bash
curl -X POST http://localhost:5000/banner \
  -H "Content-Type: application/json" \
  -d '{"message": "Site under maintenance!"}'
```

### OTP service (`otp`)

| Endpoint                | Method | Description                                              | Response                                      |
|-------------------------|--------|----------------------------------------------------------|-----------------------------------------------|
| `/otp`                  | POST   | Generate & store OTP for an Indian mobile number (30s TTL) | `201` → `{ "message": "OTP sent", "otp": "12345" }` |
| `/otp/verify`           | POST   | Verify the OTP; deletes the key on success               | `200` → `{ "success": true, "message": "OTP verified successfully." }` |
| `/otp/:phone/ttl`       | GET    | Get remaining TTL (seconds) of the OTP key              | `200` → `{ "ttl": 25 }`                       |

Request examples:

```bash
# Generate OTP
curl -X POST http://localhost:5000/otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210"}'

# Verify OTP
curl -X POST http://localhost:5000/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210", "otp": "12345"}'
```

Notes:

- Phone numbers are validated as **Indian mobile numbers** (`validator` `en-IN` via `zod`).
- OTPs are stored in Redis under the key `otp:<phone>` with a **30-second expiry** (`EX 30`).
- On successful verification the OTP key is deleted.
- `GET /otp/:phone/ttl` returns `-2` if the key does not exist, `-1` if it exists without an expiry.

### User service (`user`)

Demonstrates storing the same user document in Redis in two formats — as a JSON string and as a hash.

| Endpoint         | Method | Description                               | Response                                                          |
|------------------|--------|-------------------------------------------|--------------------------------------------------------------------|
| `/user/:id/json` | POST   | Store the request body as a JSON string   | `201` → `{ "message": "User data set as json" }`                   |
| `/user/:id/json` | GET    | Read the stored JSON string               | `200` → `{ "success": true, "user": { ... } }` (`null` if unset)   |
| `/user/:id/hash` | POST   | Store the request body fields as a hash   | `201` → `{ "message": "User data set as hash" }`                   |
| `/user/:id/hash` | GET    | Read all fields of the stored hash        | `200` → `{ "message": "User data get as hash", "user": { ... } }`  |

Request examples:

```bash
# Set user as JSON
curl -X POST http://localhost:5000/user/1/json \
  -H "Content-Type: application/json" \
  -d '{"name": "Rahul Kumar", "email": "rahul@rahulkumarpahwa.me"}'

# Get user as JSON
curl http://localhost:5000/user/1/json

# Set user fields as a hash
curl -X POST http://localhost:5000/user/1/hash \
  -H "Content-Type: application/json" \
  -d '{"name": "Rahul Kumar", "email": "rahul@rahulkumarpahwa.me"}'

# Get user as hash
curl http://localhost:5000/user/1/hash
```

Notes:

- Both variants currently write to the same key namespace: `user:<id>:json`.
- The JSON variant uses `SET` / `GET` with `JSON.stringify` / `JSON.parse`; the hash variant uses `HSET` / `HGETALL`.
- No TTL is set on user keys — they persist until deleted.
- Every service also exposes `GET /redis` for a connectivity check (`{ "redis": "PONG" }`).

### User session (`user-session`)

Demonstrates a session/auth flow backed by MongoDB, with Redis used as a read cache (via the `user` service). On login the user document is written to Redis as a JSON string under `user:<id>:json`; subsequent lookups check Redis first and fall back to the database.

| Endpoint             | Method | Description                                                       | Response                                                                 |
|----------------------|--------|-------------------------------------------------------------------|--------------------------------------------------------------------------|
| `/user/signup`       | POST   | Validate & create a user (email + strong password) in MongoDB     | `200` → `{ "message": "user can be created successfully", "user": {...} }` |
| `/user/login`        | POST   | Verify credentials & cache the user in Redis                      | `200` → `{ "message": "user loggedin successfully", "user": {...} }`     |
| `/users/:id`         | GET    | Fetch a user (Redis cache first, MongoDB fallback)                | `200` → `{ "message": "...", "user": {...} }`; `400` if not found        |
| `/user/:id/json`     | POST   | Store request body as a JSON string in Redis                      | `201` → `{ "message": "User data set as json" }`                         |
| `/user/:id/json`     | GET    | Read the stored JSON string from Redis                            | `200` → `{ "success": true, "user": { ... } }` (`null` if unset)         |
| `/user/:id/json`     | DELETE | Delete the user JSON key from Redis                               | `200` → `{ "message": "User data deleted", "user": <deleted_count> }`    |
| `/user/:id/hash`     | POST   | Store the request body fields as a Redis hash                     | `201` → `{ "message": "User data set as hash" }`                         |
| `/user/:id/hash`     | GET    | Read all fields of the stored hash                                | `200` → `{ "message": "User data get as hash", "user": { ... } }`        |
| `/redis`             | GET    | Redis connectivity check (PING)                                   | `200` → `{ "redis": "PONG" }`                                            |

Request examples:

```bash
# Signup
curl -X POST http://localhost:5000/user/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "rahul@rahulkumarpahwa.me", "password": "Str0ngP@ssw0rd"}'

# Login (caches the user in Redis under user:<id>:json)
curl -X POST http://localhost:5000/user/login \
  -H "Content-Type: application/json" \
  -d '{"email": "rahul@rahulkumarpahwa.me", "password": "Str0ngP@ssw0rd"}'

# Fetch user (served from Redis if cached, otherwise from MongoDB)
curl http://localhost:5000/users/64f1a2b3c4d5e6f7a8b9c0d1

# Set / get user as JSON directly in Redis
curl -X POST http://localhost:5000/user/64f1a2b3c4d5e6f7a8b9c0d1/json \
  -H "Content-Type: application/json" \
  -d '{"name": "Rahul Kumar", "email": "rahul@rahulkumarpahwa.me"}'

curl http://localhost:5000/user/64f1a2b3c4d5e6f7a8b9c0d1/json

# Delete the cached user JSON key
curl -X DELETE http://localhost:5000/user/64f1a2b3c4d5e6f7a8b9c0d1/json
```

Notes:

- Passwords are validated with `validator.isEmail` (email) and `validator.isStrongPassword` (password) in the Mongoose schema, and with `zod` (`z.email()`, min 8 chars) in the request validation.
- On login the user object is stored in Redis at `user:<id>:json` via `SET` with `JSON.stringify`; `GET /users/:id` reads from Redis first (through the `user` service endpoints) and falls back to a MongoDB `findOne` on a cache miss.
- The service also re-uses the `user` service endpoints (`/user/:id/json`, `/user/:id/hash`) for direct Redis read/write.
- Passwords are stored and compared in plaintext in this demo — not for production use.
- Every service also exposes `GET /redis` for a connectivity check (`{ "redis": "PONG" }`).

### Queue service (`queue`)

Demonstrates a simple background job queue using Redis lists. Email jobs are pushed to the front of the list with `LPUSH` and consumed from the back with `RPOP`, implementing a FIFO queue. Jobs are stored as JSON strings under the Redis key `email:queue:key`.

| Endpoint              | Method | Description                                  | Response                                                                          |
|-----------------------|--------|----------------------------------------------|-----------------------------------------------------------------------------------|
| `/redis`              | GET    | Redis connectivity check (PING)            | `200` → `{ "redis": "PONG" }`                                                    |
| `/emails`             | POST   | Add a new email job to the queue (LPUSH)   | `200` → `{ "message": "new job is added to the queue", "job": {...} }`            |
| `/emails/length`      | GET    | Get the current queue length (LLEN)      | `200` → `{ "message": "queue length", "length": <n> }`                           |
| `/emails/process/one` | GET    | Process & remove the next job (RPOP)      | `200` → `{ "message": "email sent", "email": {...} }`; `400` if queue empty       |

Request examples:

```bash
# Add an email job to the queue
curl -X POST http://localhost:5000/emails \
  -H "Content-Type: application/json" \
  -d '{"from": "sender@example.com", "to": "recipient@example.com", "subject": "Welcome!", "body": "Your account has been created."}'

# Check queue length
curl http://localhost:5000/emails/length

# Process one job (pops from the queue)
curl http://localhost:5000/emails/process/one
```

Notes:

- Jobs are stored as JSON strings in a Redis list under the key `email:queue:key`.
- `LPUSH` + `RPOP` implements FIFO ordering (newest job pushed to head, oldest popped from tail).
- `GET /emails/process/one` returns a `400` error when the queue is empty ("no jobs left in queue.").
- Every service also exposes `GET /redis` for a connectivity check (`{ "redis": "PONG" }`).

## License

Private project — © Rahul Kumar.