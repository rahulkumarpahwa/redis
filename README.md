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
├── queue/                # Queue service (planned)
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
| `queue`       | 🚧 Planned   | Background job queue service                 |
| `pubsub`      | 🚧 Planned   | Publish/subscribe messaging service          |
| `dashboard`   | 🚧 Planned   | Dashboard service                            |

## Available Scripts

| Command                    | Description                          |
|----------------------------|--------------------------------------|
| `npm run dev:boilerplate`  | Run the boilerplate service          |
| `npm run dev:site-banner`  | Run the site-banner service          |
| `npm run dev:otp`          | Run the OTP service                  |
| `npm run dev:user`         | Run the user service                 |
| `npm run dev:queue`        | Run the queue service (planned)      |
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

## License

Private project — © Rahul Kumar.