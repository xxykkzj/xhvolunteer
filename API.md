# Temple Volunteer System - API Documentation

**Version**: 1.0  
**Base URL**: `https://your-domain.com/api/trpc`  
**Protocol**: tRPC over HTTP

---

## Authentication

All API endpoints require authentication via session cookie or JWT token.

**Login URL**: Use the Manus OAuth portal to obtain a session  
**Session Cookie**: `manus_session` (HTTP-only, Secure)

---

## API Endpoints

### Authentication

#### Get Current User
```
GET /auth.me
```

**Response:**
```json
{
  "result": {
    "data": {
      "id": 1,
      "openId": "volunteer001",
      "name": "张三",
      "role": "volunteer",
      "phone": "13800138000",
      "avatarUrl": "https://...",
      "createdAt": "2025-11-01T00:00:00.000Z",
      "updatedAt": "2025-11-01T00:00:00.000Z"
    }
  }
}
```

#### Logout
```
POST /auth.logout
```

**Response:**
```json
{
  "result": {
    "data": {
      "success": true
    }
  }
}
```

---

### Departments

#### List All Departments
```
GET /departments.list
```

**Response:**
```json
{
  "result": {
    "data": [
      {
        "id": 1,
        "name": "图书馆",
        "centerId": null,
        "createdAt": "2025-11-01T00:00:00.000Z"
      }
    ]
  }
}
```

#### Create Department (Manager+)
```
POST /departments.create
Content-Type: application/json

{
  "name": "禅修中心",
  "centerId": 1
}
```

**Response:**
```json
{
  "result": {
    "data": {
      "success": true
    }
  }
}
```

---

### Engagements

#### Create Engagement (Manager+)
```
POST /engagements.create
Content-Type: application/json

{
  "userId": 1,
  "type": "volunteer_shortterm",
  "departmentId": 1,
  "title": "图书整理志愿者",
  "startDate": "2025-11-01T00:00:00.000Z",
  "endDate": "2025-11-15T00:00:00.000Z",
  "salaryScheme": "none"
}
```

**Parameters:**
- `type`: "volunteer_shortterm" | "temple_worker"
- `salaryScheme`: "hourly" | "fixed" | "none"
- `hourlyRate`: Number (for hourly scheme)
- `fixedMonthly`: Number (for fixed scheme)
- `allowPointsOnPaidHours`: Boolean

**Response:**
```json
{
  "result": {
    "data": {
      "success": true
    }
  }
}
```

#### List User Engagements
```
GET /engagements.listByUser?input={"userId":1}
```

**Response:**
```json
{
  "result": {
    "data": [
      {
        "id": 1,
        "userId": 1,
        "type": "volunteer_shortterm",
        "departmentId": 1,
        "title": "图书整理志愿者",
        "startDate": "2025-11-01T00:00:00.000Z",
        "endDate": "2025-11-15T00:00:00.000Z",
        "status": "active",
        "createdAt": "2025-11-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

### Schedules

#### Create Schedule Day (Leader+)
```
POST /schedules.create
Content-Type: application/json

{
  "theDate": "2025-11-01T00:00:00.000Z",
  "departmentId": 1,
  "note": "周末义工日"
}
```

**Response:**
```json
{
  "result": {
    "data": {
      "success": true
    }
  }
}
```

#### List Schedules by Date Range
```
GET /schedules.listByDateRange?input={"departmentId":1,"startDate":"2025-11-01T00:00:00.000Z","endDate":"2025-11-30T00:00:00.000Z"}
```

**Response:**
```json
{
  "result": {
    "data": [
      {
        "id": 1,
        "theDate": "2025-11-01T00:00:00.000Z",
        "departmentId": 1,
        "note": "周末义工日"
      }
    ]
  }
}
```

---

### Attendance

#### Confirm Attendance (Leader+)
```
POST /attendance.confirm
Content-Type: application/json

{
  "scheduleDayId": 1,
  "userId": 1,
  "engagementId": 1,
  "status": "present",
  "actualHours": 240,
  "paidFlag": false,
  "overtimeHours": 0,
  "comment": "表现优秀"
}
```

**Parameters:**
- `status`: "present" | "absent" | "late" | "leave" | "exception"
- `actualHours`: Number (in minutes)
- `paidFlag`: Boolean
- `overtimeHours`: Number (in minutes)

**Response:**
```json
{
  "result": {
    "data": {
      "success": true,
      "joyBadgeGranted": false,
      "newLevel": 3
    }
  }
}
```

---

### Points & Ranking

#### Get Points Summary
```
GET /points.summary?input={"userId":1}
```

**Response:**
```json
{
  "result": {
    "data": {
      "totalHours": 3000,
      "totalPoints": 500,
      "rankLevel": 3,
      "rankName": "发光地",
      "joyBadge": false,
      "joyGrantedAt": null
    }
  }
}
```

#### Get Points Ledger
```
GET /points.ledger?input={"userId":1,"limit":50}
```

**Response:**
```json
{
  "result": {
    "data": [
      {
        "id": 1,
        "userId": 1,
        "pointsDelta": 300,
        "reason": "attendance_eval",
        "refId": 1,
        "departmentId": null,
        "createdBy": 2,
        "createdAt": "2025-11-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

### Rewards

#### List Available Rewards
```
GET /rewards.list
```

**Response:**
```json
{
  "result": {
    "data": [
      {
        "id": 1,
        "title": "结缘书籍",
        "description": "精选佛学经典书籍一本",
        "imageUrl": null,
        "pointsCost": 100,
        "minLevelRequired": 1,
        "requireJoyBadge": false,
        "stock": -1,
        "status": "active",
        "canRedeem": true,
        "locked": false
      }
    ]
  }
}
```

#### Create Reward (Admin+)
```
POST /rewards.create
Content-Type: application/json

{
  "title": "禅茶体验",
  "description": "禅茶一味体验活动",
  "pointsCost": 200,
  "minLevelRequired": 2,
  "requireJoyBadge": false,
  "stock": 40
}
```

**Response:**
```json
{
  "result": {
    "data": {
      "success": true
    }
  }
}
```

---

### Redemption

#### Redeem Reward
```
POST /redeem.create
Content-Type: application/json

{
  "rewardId": 1
}
```

**Response:**
```json
{
  "result": {
    "data": {
      "success": true,
      "orderId": 1,
      "code": "1|1|0|a3f5b8c9d2e1f4a7b6c5d8e9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0"
    }
  }
}
```

**Code Format**: `order_id|user_id|expiry_timestamp|hmac_signature`

#### Verify Redemption Code (Leader+)
```
POST /redeem.verify
Content-Type: application/json

{
  "code": "1|1|0|a3f5b8c9d2e1f4a7b6c5d8e9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0"
}
```

**Response:**
```json
{
  "result": {
    "data": {
      "success": true,
      "order": {
        "id": 1,
        "userId": 1,
        "rewardId": 1,
        "pointsCost": 100,
        "status": "used",
        "usedBy": 2,
        "usedAt": "2025-11-01T12:00:00.000Z",
        "createdAt": "2025-11-01T10:00:00.000Z"
      }
    }
  }
}
```

#### Get My Redemption Orders
```
GET /redeem.myOrders
```

**Response:**
```json
{
  "result": {
    "data": [
      {
        "id": 1,
        "userId": 1,
        "rewardId": 1,
        "pointsCost": 100,
        "codePayload": "1|1|0",
        "codeQrSig": "a3f5b8c9...",
        "expiresAt": null,
        "status": "pending",
        "usedBy": null,
        "usedAt": null,
        "createdAt": "2025-11-01T10:00:00.000Z"
      }
    ]
  }
}
```

---

### Users

#### List All Users (Manager+)
```
GET /users.list
```

**Response:**
```json
{
  "result": {
    "data": [
      {
        "id": 1,
        "openId": "volunteer001",
        "name": "张三",
        "role": "volunteer",
        "phone": "13800138000",
        "avatarUrl": null,
        "createdAt": "2025-11-01T00:00:00.000Z",
        "updatedAt": "2025-11-01T00:00:00.000Z"
      }
    ]
  }
}
```

#### Update User Role (Admin+)
```
POST /users.updateRole
Content-Type: application/json

{
  "userId": 1,
  "role": "leader"
}
```

**Roles**: "volunteer" | "leader" | "manager" | "admin" | "super-admin"

**Response:**
```json
{
  "result": {
    "data": {
      "success": true
    }
  }
}
```

---

## Error Handling

All errors follow the tRPC error format:

```json
{
  "error": {
    "json": {
      "message": "Error description",
      "code": -32001,
      "data": {
        "code": "UNAUTHORIZED",
        "httpStatus": 401,
        "path": "departments.list"
      }
    }
  }
}
```

**Common Error Codes:**
- `UNAUTHORIZED` (401): Not logged in
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `BAD_REQUEST` (400): Invalid input
- `INTERNAL_SERVER_ERROR` (500): Server error

---

## Rate Limiting

**Current Status**: No rate limiting implemented

**Recommendation**: Implement rate limiting in production:
- 100 requests per minute per user
- 1000 requests per hour per IP address

---

## Webhooks (Future)

**Planned Events:**
- `user.rank_changed`: User's rank level changed
- `user.joy_badge_granted`: User received joy badge
- `reward.redeemed`: User redeemed a reward
- `attendance.confirmed`: Attendance was confirmed

**Webhook Format:**
```json
{
  "event": "user.rank_changed",
  "timestamp": "2025-11-01T12:00:00.000Z",
  "data": {
    "userId": 1,
    "oldLevel": 2,
    "newLevel": 3,
    "totalPoints": 500
  }
}
```

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './server/routers';

const client = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'https://your-domain.com/api/trpc',
      headers: {
        cookie: 'manus_session=...',
      },
    }),
  ],
});

// Get user points
const points = await client.points.summary.query({ userId: 1 });
console.log(points.totalPoints); // 500

// Redeem reward
const redemption = await client.redeem.create.mutate({ rewardId: 1 });
console.log(redemption.code); // "1|1|0|a3f5..."
```

### Python

```python
import requests

BASE_URL = "https://your-domain.com/api/trpc"
COOKIE = "manus_session=..."

# Get user points
response = requests.get(
    f"{BASE_URL}/points.summary",
    params={"input": '{"userId":1}'},
    headers={"Cookie": COOKIE}
)
data = response.json()
print(data["result"]["data"]["totalPoints"])  # 500

# Redeem reward
response = requests.post(
    f"{BASE_URL}/redeem.create",
    json={"rewardId": 1},
    headers={"Cookie": COOKIE}
)
data = response.json()
print(data["result"]["data"]["code"])  # "1|1|0|a3f5..."
```

### cURL

```bash
# Get user points
curl "https://your-domain.com/api/trpc/points.summary?input=%7B%22userId%22%3A1%7D" \
  -H "Cookie: manus_session=..."

# Redeem reward
curl -X POST "https://your-domain.com/api/trpc/redeem.create" \
  -H "Content-Type: application/json" \
  -H "Cookie: manus_session=..." \
  -d '{"rewardId":1}'
```

---

## Support

For API support and questions, visit: https://help.manus.im
