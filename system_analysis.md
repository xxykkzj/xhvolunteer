# Volunteer Management System - Analysis Document

## Project Overview

This is a comprehensive **Volunteer Management + Time Bank + Multi-terminal Verification** system for a temple/monastery, with a focus on:

- **Primary Platform**: WeChat Mini Program (volunteers & verification)
- **Secondary Platform**: Web Admin Portal (configuration, payroll, audit reports)
- **Deployment**: Aliyun (RDS MySQL 8, ECS/SAE, OSS)

## Core Business Logic

### 1. Member Ranking System (Seven Levels - 七地菩萨)

Based on **cumulative points**, using left-closed right-open intervals:

- **Level 1 (欢喜地)**: [0, 100)
- **Level 2 (离垢地)**: [100, 200)
- **Level 3 (发光地)**: [200, 1000)
- **Level 4 (焰慧地)**: [1000, 2000)
- **Level 5 (难胜地)**: [2000, 6000)
- **Level 6 (现前地)**: [6000, 10000)
- **Level 7 (远行地)**: [10000, ∞)

### 2. "Joy Badge" (欢喜徽记)

- Automatically granted when **cumulative service hours ≥ 70**
- Independent from point-based ranking
- Required for certain premium rewards

### 3. Redemption Requirements (Must satisfy ALL)

1. User's level ≥ reward's `min_level_required`
2. User's available points ≥ reward's `points_cost`
3. If reward requires joy badge, user must have `joy_badge=true`

### 4. Two Types of Service Relationships

- **Short-term Volunteer** (`volunteer_shortterm`): Service period ≥ 14 days, no fixed position, earns service hours
- **Temple Worker** (`temple_worker`): Fixed position with salary; paid hours don't earn points by default (unless configured)

## Technical Architecture

### Backend Stack
- **Framework**: Node.js + NestJS + TypeORM
- **Database**: MySQL 8 (RDS)
- **Authentication**: JWT (HS256)
- **API Documentation**: OpenAPI/Swagger
- **Security**: AES-256-CBC for ID card encryption, RBAC, audit logs

### Frontend Stack
- **Mini Program**: Native WeChat Mini Program or Taro + Vant Weapp
- **Web Admin**: React + Ant Design
- **Theme**: Buddhist yellow/gold theme

### DevOps
- **Containerization**: docker-compose for local development
- **Cloud**: Aliyun deployment (RDS, ECS/SAE, OSS)
- **Testing**: Unit tests (≥6), E2E tests (≥2)

## Key Features

### 1. Scheduling & Attendance
- Daily scheduling by department
- Weekly rotation rules for temple workers
- End-of-day attendance confirmation by leaders/managers
- Side effects: update hours_ledger, point_ledger, user_rank_snapshot, joy badge

### 2. Department Rewards & Monthly Quota
- Managers can award bonus points within monthly quota
- Approval workflow: pending → manager_approved → admin_approved/rejected

### 3. Redemption & Verification
- Generate barcode/QR code with HMAC-SHA256 signature
- Format: `order_id|user_id|exp_ts|sig`
- Verification with idempotency and transaction safety

### 4. Temple Worker Payroll
- Track paid hours separately
- Monthly payroll cycles with approval workflow
- Export to CSV/Excel (stored in OSS)

### 5. Audit & Security
- All critical actions logged to audit_log
- ID card encryption (only admin/super-admin can view)
- Anti-replay protection for verification codes

## RBAC Roles

1. **volunteer**: View personal data, schedule, points/level/hours, generate redemption codes
2. **leader**: Confirm attendance for department, verify redemptions, suggest rewards
3. **manager**: Manage departments, approve rewards (within quota), view center reports
4. **admin**: Global data access, view ID cards, set quotas and rewards, final approval
5. **super-admin**: Highest privileges, adjust any quota/inventory, global configuration

## Database Schema Highlights

- **user**: Basic user info with role and status
- **user_sensitive**: Encrypted ID card data
- **engagement**: Service relationships (volunteer/worker)
- **schedule_day + schedule_assignment**: Daily scheduling
- **rota_rule**: Weekly rotation for temple workers
- **attendance_daily**: End-of-day attendance confirmation
- **hours_ledger + point_ledger**: Transaction logs
- **user_rank_snapshot**: Cached totals with level and joy badge
- **reward + redeem_order**: Rewards and redemption orders
- **payroll_cycle + payroll_item**: Payroll management
- **audit_log**: Security audit trail

## Critical Business Rules

### Short-term Volunteer Validation
```typescript
if (engagement.type === 'volunteer_shortterm') {
  const days = (end_date - start_date) / (1000 * 60 * 60 * 24);
  if (days < 14) throw new Error('Short-term volunteer must serve ≥14 days');
}
```

### Level Calculation
```typescript
function calculateLevel(totalPoints: number): number {
  if (totalPoints >= 10000) return 7;
  if (totalPoints >= 6000) return 6;
  if (totalPoints >= 2000) return 5;
  if (totalPoints >= 1000) return 4;
  if (totalPoints >= 200) return 3;
  if (totalPoints >= 100) return 2;
  return 1;
}
```

### Joy Badge Grant
```typescript
if (totalHours >= 70 && !user.joy_badge) {
  user.joy_badge = true;
  user.joy_granted_at = new Date();
}
```

### Redemption Validation
```typescript
function canRedeem(user, reward): boolean {
  const levelOk = user.rank_level >= reward.min_level_required;
  const pointsOk = user.total_points >= reward.points_cost;
  const joyOk = reward.require_joy_badge ? user.joy_badge : true;
  const stockOk = reward.stock === -1 || reward.stock > 0;
  const statusOk = reward.status === 'active';
  return levelOk && pointsOk && joyOk && stockOk && statusOk;
}
```

## API Endpoints Summary

- **Auth**: `/auth/wechatLogin`, `/me`
- **Engagement**: CRUD for volunteer/worker relationships
- **Scheduling**: `/rota/*`, `/schedule/*`
- **Attendance**: `/attendance/confirm`
- **Points**: `/points/summary`, `/points/ledger`, `/points/bonus/*`
- **Quota**: `/quota/*`
- **Rewards**: `/rewards/*`, `/redeem/*`, `/redeem/verify`
- **Payroll**: `/payroll/*`
- **Audit**: `/audit`

## Testing Requirements

### Unit Tests (≥6)
1. Short-term volunteer ≥14 days validation
2. Attendance confirmation updates hours_ledger and snapshot
3. Temple worker paid hours don't earn points (unless configured)
4. Joy badge auto-grant at 70 hours
5. Redemption eligibility check (level + points + joy badge)
6. Verification idempotency and signature validation

### E2E Tests (≥2)
1. Full workflow: Schedule → Attendance → Level/Joy → Redeem → Verify
2. Reward quota approval: Request → Approve → Points credited

## Deployment Strategy

1. **Database**: RDS MySQL 8 with TypeORM migrations
2. **Backend**: NestJS on ECS/SAE with health checks
3. **Storage**: OSS for reports and QR code images
4. **Mini Program**: Configure domain whitelist and deploy
5. **Local Dev**: docker-compose for one-click setup

## Seed Data

- **Departments**: Library, Welfare Center, Guest Services
- **Users**: One account for each role (volunteer/leader/manager/admin/super-admin)
- **Rewards**:
  - A "Buddhist Book" (100 points, Level 1, no joy badge required)
  - B "Meal Voucher" (300 points, Level 3, joy badge required)
  - C "Meditation Day" (800 points, Level 5, joy badge required)

## Development Priorities

### Phase 1: Core Backend (Current Focus)
- Database schema and migrations
- Authentication and RBAC
- Core business logic (attendance, points, levels, joy badge)
- API endpoints with validation

### Phase 2: Mini Program
- User interface with Buddhist theme
- Personal dashboard (level badge, points, hours, joy badge)
- Schedule viewing and attendance confirmation
- Reward browsing and redemption
- QR code generation and scanning

### Phase 3: Web Admin Portal
- Department and user management
- Quota configuration
- Payroll management
- Audit reports and exports

### Phase 4: Testing & Documentation
- Unit and E2E tests
- API documentation (Swagger)
- Deployment guides
- User manuals
