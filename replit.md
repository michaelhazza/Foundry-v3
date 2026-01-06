# Foundry - AI Training Data Preparation Platform

## Overview
Foundry is a fullstack web application for preparing AI training data with PII detection and deidentification capabilities. It uses React for the frontend and Express for the backend with PostgreSQL as the database.

## Project Architecture

### Stack
- **Frontend**: React 18 with TypeScript, Vite, TailwindCSS, React Router v6
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based with cookies

### Directory Structure
```
├── src/
│   ├── client/         # React frontend
│   │   ├── src/
│   │   │   ├── components/  # UI components
│   │   │   ├── hooks/       # Custom React hooks
│   │   │   ├── lib/         # Utilities and API client
│   │   │   └── pages/       # Page components
│   │   └── index.html
│   └── server/         # Express backend
│       ├── config/     # Environment and database config
│       ├── db/         # Database connection and migrations
│       ├── lib/        # Utilities (crypto, jwt, logger, parsers, PII detection)
│       ├── middleware/ # Express middleware
│       ├── routes/     # API routes
│       └── services/   # Business logic
├── shared/             # Shared types and validators
│   ├── schema.ts       # Drizzle schema
│   ├── types.ts        # TypeScript types
│   └── validators.ts   # Zod validation schemas
└── docs/               # Documentation
```

### Ports
- Frontend (Vite): 5000 (host: 0.0.0.0)
- Backend (Express): 3001 (localhost)

## Development

### Commands
- `npm run dev` - Start development servers (frontend + backend)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push database schema changes
- `npm run db:generate` - Generate migrations
- `npm run db:studio` - Open Drizzle Studio

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (required)
- `JWT_SECRET` - Secret for JWT tokens (32+ chars)
- `ENCRYPTION_KEY` - Secret for encryption (32+ chars)
- `APP_URL` - Application URL for CORS in production
- `RESEND_API_KEY` - Optional, for email functionality

## Recent Changes
- 2026-01-06: Initial Replit setup
  - Configured Vite to allow all hosts for Replit proxy
  - Updated CORS settings for development
  - Added GET /api/auth/profile endpoint
  - Installed pino-pretty for development logging
  - Configured deployment for autoscale
