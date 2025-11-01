# Temple Volunteer Management System

A comprehensive web application for managing volunteer services at Buddhist temples, featuring a time bank system and seven-tier membership ranking based on the Bodhisattva grounds (七地菩萨会员体系).

## Features

### Core Functionality
- **Time Bank System**: Track volunteer service hours with automatic point accumulation
- **Seven-Tier Ranking**: Progressive membership levels from 欢喜地 (Joyful Ground) to 远行地 (Far-Reaching Ground)
- **Joy Badge**: Special achievement awarded at 70 service hours
- **Rewards System**: Redeem points for temple offerings, books, meditation sessions, and more
- **Dual Service Types**: Support for both short-term volunteers and paid temple workers
- **Complete Workflow**: Enrollment → Scheduling → Attendance → Points → Rewards → Verification

### Management Features
- **Department Management**: Organize volunteers by temple departments with 3-level hierarchy
- **Badge System**: Automatic badge granting based on service hours and engagement duration
- **Engagement Tracking**: Record volunteer and temple worker relationships with historical tracking
- **Attendance Tracking**: End-of-day confirmation with automatic hours/points recording
- **Role-Based Access**: Five-tier permission system (Volunteer, Leader, Manager, Admin, Super-Admin)
- **Redemption Verification**: HMAC-signed QR codes prevent fraud
- **Audit Trail**: Comprehensive logging of all system actions

## Technology Stack

**Frontend:**
- React 19 + TypeScript 5.9
- Tailwind CSS 4 with Buddhist-themed golden palette
- tRPC 11 for type-safe API calls
- shadcn/ui component library

**Backend:**
- Node.js 22 + Express 4
- tRPC 11 for end-to-end type safety
- Drizzle ORM with MySQL/TiDB
- AES-256-CBC encryption for sensitive data
- HMAC-SHA256 signatures for redemption codes

## Quick Start

### Prerequisites
- Node.js 22+
- MySQL or TiDB database
- pnpm package manager

### Installation

**Note**: This project does not yet have a `package.json` file. The build/run process and dependencies need to be set up.

For detailed installation and deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

**Quick Start (once package.json is created):**

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.development .env
# Or copy .env.example and customize

# Edit .env with your database credentials
nano .env

# Create database schema
pnpm tsx create-all-tables.ts

# Seed sample data (optional)
pnpm tsx seed-sample-data.ts

# Start development server
pnpm dev
```

The application will be available at `http://localhost:3000`

### Sample Accounts (after seeding)

| Role | OpenID | Name | Description |
|------|--------|------|-------------|
| Volunteer | volunteer001 | 张三 | Basic volunteer with sample points |
| Leader | leader001 | 李四 | Can confirm attendance |
| Manager | manager001 | 王五 | Can manage departments and engagements |
| Admin | admin001 | 赵六 | Can create rewards and manage users |
| Super-Admin | superadmin001 | 方丈助理 | Full system access |

## Database Schema

The system uses 18 interconnected tables:

- **User Management**: `users`, `user_sensitive`, `user_rank_snapshot`
- **Organization**: `departments` (with hierarchical structure), `user_departments`
- **Badge System**: `badges`, `user_badges`
- **Engagement**: `engagements` (with historical tracking), `rota_rules`
- **Scheduling**: `schedule_days`, `schedule_assignments`
- **Attendance**: `attendance_daily`, `hours_ledger`, `point_ledger`
- **Rewards**: `rewards` (with badge requirements), `redeem_orders`
- **Quota**: `dept_month_quota`, `dept_bonus_requests`
- **Audit**: `audit_logs`

**Note**: Payroll tables (`payroll_cycles`, `payroll_items`) are defined in the schema but **intentionally not implemented**. Payroll and compensation are managed separately by the temple's financial department, keeping the volunteer management system focused on service tracking and recognition.

## API Documentation

The system exposes a tRPC API for external integration. See [API.md](./API.md) for complete endpoint documentation.

**Base URL**: `https://your-domain.com/api/trpc`

**Key Endpoints:**
- `GET /auth.me` - Get current user
- `GET /points.summary` - Get user rank and points
- `GET /rewards.list` - List available rewards
- `POST /redeem.create` - Redeem a reward
- `POST /attendance.confirm` - Confirm volunteer attendance

## Development Documentation

For detailed technical documentation including architecture, business logic, security considerations, and potential issues, see [DEVELOPMENT.md](./DEVELOPMENT.md).

## User Guide

For end-user instructions on using the application, see [userGuide.md](./userGuide.md).

## Project Structure

**Current Status**: The codebase currently has a flat file structure with all files at the root level. A planned reorganization into organized directories is documented below but not yet implemented.

### Current Structure (As Implemented)
```
xianghai_volunteer_record/
├── *.tsx                  # 19 React component files (all at root)
│   ├── App.tsx, Home.tsx, Login.tsx, Register.tsx
│   ├── Profile.tsx, ChangePassword.tsx
│   ├── Departments.tsx, EngagementManagement.tsx
│   ├── Scheduling.tsx, BonusManagement.tsx
│   ├── BadgeManagement.tsx, UserManagement.tsx
│   ├── Shop.tsx, VerifyRedemption.tsx, etc.
├── *.ts                   # 35+ backend/database TypeScript files (all at root)
│   ├── db.ts, schema.ts, routers.ts (1014 lines)
│   ├── db-queries.ts, db-queries-bonus.ts
│   ├── rank.ts, signature.ts, encryption.ts, badges.ts
│   ├── engagements.ts, audit.ts, admin.ts, password.ts
│   ├── rbac.ts, oauth.ts, emailLogin.ts
│   ├── create-all-tables.ts, migrate-schema.ts
│   ├── seed-*.ts (multiple seed scripts)
│   ├── fix-*.ts (maintenance scripts)
│   └── qa-tests.ts, test-phase3.ts
├── index.css              # Global styles
├── *.md                   # 13 documentation files
└── package.json           # (Note: Not yet created, see Development section)
```

### Planned Structure (Future Reorganization)
```
temple-volunteer-system/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities and tRPC client
│   │   └── index.css      # Global styles
├── server/                # Backend Node.js application
│   ├── _core/             # Framework core (OAuth, tRPC)
│   ├── services/          # Business logic services
│   │   ├── encryption.ts  # AES-256-CBC encryption
│   │   ├── signature.ts   # HMAC-SHA256 signatures
│   │   └── rank.ts        # Rank calculation
│   ├── db.ts              # Database connection
│   ├── db-queries.ts      # Query helpers
│   └── routers.ts         # tRPC API routes
├── drizzle/               # Database schema
│   └── schema.ts          # Table definitions
├── shared/                # Shared code
│   └── constants.ts       # Business logic constants
├── scripts/               # Utility scripts
│   ├── create-all-tables.ts
│   ├── seed-data.ts
│   └── migrate-schema.ts
├── API.md                 # API documentation
├── DEVELOPMENT.md         # Technical documentation
└── userGuide.md           # User guide
```

## Security

- **Encryption**: Sensitive ID card data encrypted with AES-256-CBC
- **Signatures**: Redemption codes signed with HMAC-SHA256
- **Authentication**: JWT-based session management via Manus OAuth
- **RBAC**: Five-tier role-based access control
- **Audit Logging**: Comprehensive audit trail of all actions

**Important**: Before production deployment, set strong random values for:
- `AES_KEY` (32 bytes)
- `AES_IV` (16 bytes)
- `HMAC_SECRET` (strong random string)
- `JWT_SECRET` (strong random string)

## License

Copyright © 2025 Manus AI. All rights reserved.

## Support

For questions, issues, or feature requests, visit: https://help.manus.im

---

**Built with ❤️ by Manus AI**
