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
├── otp/                  # OTP service (planned)
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
npm run dev:boilerplate     # or dev:site-banner
```

## Workspaces

| Workspace     | Status      | Description                                  |
|---------------|-------------|----------------------------------------------|
| `boilerplate` | ✅ Implemented | Starter template with Redis & MongoDB health endpoints |
| `site-banner` | ✅ Implemented | Site banner service                          |
| `otp`         | 🚧 Planned   | OTP generation & verification service        |
| `user`        | 🚧 Planned   | User management service                      |
| `queue`       | 🚧 Planned   | Background job queue service                 |
| `pubsub`      | 🚧 Planned   | Publish/subscribe messaging service          |
| `dashboard`   | 🚧 Planned   | Dashboard service                            |

## Available Scripts

| Command                    | Description                          |
|----------------------------|--------------------------------------|
| `npm run dev:boilerplate`  | Run the boilerplate service          |
| `npm run dev:site-banner`  | Run the site-banner service          |
| `npm run dev:otp`          | Run the OTP service (planned)        |
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

Current services (`boilerplate`, `site-banner`) expose:

| Endpoint | Method | Description                          | Response                          |
|----------|--------|--------------------------------------|-----------------------------------|
| `/redis` | GET    | Redis connectivity check (PING)      | `{ "redis": "PONG" }`             |
| `/mongo` | GET    | MongoDB connection check             | `{ "mongodb": "connected", "databse": "database_with_redis" }` |

## License

Private project — © Rahul Kumar.