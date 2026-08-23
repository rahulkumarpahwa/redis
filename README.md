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
├── user/                 # User service (planned)
├── queue/                # Queue service (planned)
├── pubsub/               # Pub/Sub service (planned)
├── dashboard/            # Dashboard (planned)
├── docker-compose.yml    # Redis + MongoDB infrastructure
├── package.json          # Workspace root
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
| `user`        | 🚧 Planned   | User management service                      |
| `queue`       | 🚧 Planned   | Background job queue service                 |
| `pubsub`      | 🚧 Planned   | Publish/subscribe messaging service          |
| `dashboard`   | 🚧 Planned   | Dashboard service                            |

## Available Scripts

| Command                    | Description                          |
|----------------------------|--------------------------------------|
| `npm run dev:boilerplate`  | Run the boilerplate service          |
| `npm run dev:site-banner`  | Run the site-banner service          |
| `npm run dev:otp`          | Run the OTP service                  |
| `npm run dev:user`         | Run the user service (planned)       |
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

Current services expose:

| Endpoint | Method | Description                          | Response                          |
|----------|--------|--------------------------------------|-----------------------------------|
| `/redis` | GET    | Redis connectivity check (PING)      | `{ "redis": "PONG" }`             |
| `/mongo` | GET    | MongoDB connection check             | `{ "mongodb": "connected", "databse": "database_with_redis" }` |

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

## License

Private project — © Rahul Kumar.