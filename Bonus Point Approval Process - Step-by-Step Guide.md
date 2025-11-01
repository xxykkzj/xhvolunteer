# Bonus Point Approval Process - Step-by-Step Guide

## Overview

The bonus point approval system allows department managers to request additional points for volunteers who demonstrate exceptional service, with administrators reviewing and approving these requests within monthly quota limits.

---

## Prerequisites

**Your Current Setup:**
- ✅ You are logged in as an admin (Aaron Lee)
- ✅ Demo data has been created:
  - Department: 图书馆 (Library, ID: 1)
  - Monthly quota: 1,000 points for October 2025
  - Pending request: 200 points for volunteer 张三 (User ID: 1)
  - Reason: "在图书整理工作中表现突出，主动加班完成紧急任务"

---

## Step-by-Step Process

### Step 1: Access the Bonus Management Page

**Option A: Direct URL**
Navigate to: `https://3000-i0twbwfbxjaxeta272yce-6c7b0d6e.manus-asia.computer/bonus`

**Option B: From Homepage (if navigation is added)**
1. Log in to the system
2. Click on "奖励积分管理" or "Bonus Management" in the navigation menu

---

### Step 2: View Pending Requests

Once on the bonus management page, you'll see:

**Request Card Display:**
```
┌─────────────────────────────────────────────────┐
│ 申请 200 积分                        [待审批]   │
│ 部门ID: 1 • 月份: 2025-10                      │
├─────────────────────────────────────────────────┤
│ 申请对象                                        │
│ 用户ID: 1                                       │
│                                                 │
│ 申请理由                                        │
│ 在图书整理工作中表现突出，主动加班完成紧急任务  │
│                                                 │
│ 申请人ID: 3 • 更新时间: 2025-10-31 19:43:00    │
│                                                 │
│ [✓ 批准]  [✗ 拒绝]                             │
└─────────────────────────────────────────────────┘
```

**Information Displayed:**
- **Points Requested**: 200 points
- **Department**: ID 1 (图书馆)
- **Month**: 2025-10
- **Beneficiary**: User ID 1 (张三, the volunteer)
- **Reason**: Outstanding performance in library organization work, proactive overtime
- **Requester**: User ID 3 (王五, the manager)
- **Status Badge**: Yellow "待审批" (Pending) badge

---

### Step 3: Review the Request

**Considerations Before Approval:**

1. **Check Quota Availability**
   - Monthly quota: 1,000 points
   - Already approved: 0 points (first request)
   - This request: 200 points
   - Remaining after approval: 800 points ✅

2. **Validate the Reason**
   - Is the reason legitimate and specific?
   - Does it align with temple values?
   - Is the point amount reasonable for the contribution?

3. **Verify the Beneficiary**
   - Is User ID 1 (张三) an active volunteer?
   - Do they have a good service record?

---

### Step 4: Approve the Request

**To Approve:**
1. Click the **"✓ 批准"** (Approve) button
2. A confirmation dialog will appear: "确认批准此奖励积分申请？"
3. Click **"确定"** (Confirm)

**What Happens Next:**
1. System validates quota availability
2. Request status changes to "admin_approved"
3. 200 points are added to User ID 1's point ledger
4. User's rank snapshot is recalculated
5. Success toast notification: "奖励积分申请已批准"
6. Request card updates to show green "已批准" badge
7. Approve/Reject buttons disappear (action complete)

**Backend Operations:**
```typescript
// 1. Update request status
UPDATE dept_bonus_requests 
SET status = 'admin_approved', updatedBy = <admin_id>
WHERE id = <request_id>

// 2. Award points
INSERT INTO point_ledger 
(userId, pointsDelta, reason, refId, departmentId, createdBy)
VALUES (1, 200, 'dept_bonus', <request_id>, 1, <admin_id>)

// 3. Recalculate rank
UPDATE user_rank_snapshot 
SET totalPoints = totalPoints + 200, rankLevel = <new_level>
WHERE userId = 1
```

---

### Step 5: Alternative - Reject the Request

**To Reject:**
1. Click the **"✗ 拒绝"** (Reject) button
2. A confirmation dialog will appear: "确认拒绝此奖励积分申请？"
3. Click **"确定"** (Confirm)

**What Happens Next:**
1. Request status changes to "rejected"
2. No points are awarded
3. Success toast notification: "奖励积分申请已拒绝"
4. Request card updates to show red "已拒绝" badge
5. Approve/Reject buttons disappear

---

## Verification

### Check Points Were Awarded

**Method 1: Query the Database**
```bash
cd /home/ubuntu/temple-volunteer-system
pnpm tsx -e "
import mysql from 'mysql2/promise';
const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute('SELECT * FROM point_ledger WHERE userId = 1 ORDER BY createdAt DESC LIMIT 5');
console.table(rows);
await conn.end();
"
```

**Method 2: Check User Rank Snapshot**
```bash
pnpm tsx -e "
import mysql from 'mysql2/promise';
const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute('SELECT * FROM user_rank_snapshot WHERE userId = 1');
console.table(rows);
await conn.end();
"
```

**Expected Results After Approval:**
- `point_ledger`: New entry with `pointsDelta = 200`, `reason = 'dept_bonus'`
- `user_rank_snapshot`: `totalPoints` increased from 500 to 700
- `rankLevel` may change from 3 to 4 (if 700 points crosses threshold)

---

## API Endpoints Used

### 1. List Pending Requests
```
GET /api/trpc/bonus.list
```

**Response:**
```json
{
  "result": {
    "data": [
      {
        "id": 1,
        "departmentId": 1,
        "yearMonth": "2025-10",
        "userId": 1,
        "points": 200,
        "reasonText": "在图书整理工作中表现突出，主动加班完成紧急任务",
        "status": "pending",
        "createdBy": 3,
        "updatedBy": 3,
        "updatedAt": "2025-10-31T19:43:00.000Z"
      }
    ]
  }
}
```

### 2. Approve Request
```
POST /api/trpc/bonus.approve
Content-Type: application/json

{
  "requestId": 1
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

### 3. Reject Request
```
POST /api/trpc/bonus.reject
Content-Type: application/json

{
  "requestId": 1
}
```

---

## Business Rules

### Quota Enforcement

**Monthly Quota System:**
- Each department has a monthly point quota (e.g., 1,000 points)
- Admins can only approve requests within available quota
- System calculates: `remaining = quota - sum(approved_requests)`

**Quota Check Example:**
```typescript
// If quota is 1,000 and 800 points already approved
// Attempting to approve 300 points will fail:
Error: "Approving would exceed monthly quota"
```

### Status Workflow

```
pending → admin_approved → (points awarded)
        ↘ rejected → (no points)
```

**Status Meanings:**
- `pending`: Awaiting admin review
- `admin_approved`: Approved, points awarded
- `rejected`: Denied, no points awarded
- `manager_approved`: (Reserved for future multi-tier approval)

### Point Ledger Immutability

- All point transactions are **immutable**
- Corrections require new offsetting entries
- Audit trail is preserved forever

---

## Common Scenarios

### Scenario 1: Quota Exceeded

**Situation:** Trying to approve 300 points when only 200 remain

**Error Message:** "Approving would exceed monthly quota"

**Solution:** 
- Reject some pending requests
- Increase monthly quota (if justified)
- Approve partial amount (requires request modification)

### Scenario 2: Request Already Processed

**Situation:** Clicking approve on an already-approved request

**Error Message:** "Request is already admin_approved"

**Solution:** Refresh the page to see current status

### Scenario 3: No Quota Set

**Situation:** Department has no quota for the month

**Error Message:** "No quota set for this department and month"

**Solution:** Admin must first set quota via `quota.set` endpoint:
```typescript
POST /api/trpc/quota.set
{
  "departmentId": 1,
  "yearMonth": "2025-10",
  "quotaPoints": 1000
}
```

---

## Testing the Full Workflow

### Create Additional Test Requests

```bash
cd /home/ubuntu/temple-volunteer-system
pnpm tsx -e "
import mysql from 'mysql2/promise';
const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Create another request
await conn.execute(\`
  INSERT INTO dept_bonus_requests 
  (departmentId, yearMonth, userId, points, reasonText, status, createdBy, updatedBy, updatedAt)
  VALUES (1, '2025-10', 2, 150, '协助组织大型法会，表现出色', 'pending', 3, 3, NOW())
\`);

console.log('✓ Additional test request created');
await conn.end();
"
```

### Verify Quota Limits

```bash
# Try to approve requests totaling more than 1,000 points
# The system should reject the excess
```

---

## Troubleshooting

### Issue: "Database not available"

**Cause:** Database connection failed

**Solution:** Check `DATABASE_URL` environment variable

### Issue: "Requires admin role or higher"

**Cause:** User lacks admin permissions

**Solution:** Verify user role in database:
```sql
SELECT id, name, role FROM users WHERE openId = 'RvYCcDAJZu3FFnGgYkKLNm';
```

### Issue: Page shows "暂无待审批的奖励积分申请"

**Cause:** No pending requests in database

**Solution:** Run seed script again:
```bash
pnpm tsx scripts/seed-bonus-demo.ts
```

---

## Summary

The bonus approval workflow provides a structured way for administrators to reward exceptional volunteer service while maintaining budget control through monthly quotas. The system ensures:

✅ **Accountability**: All requests are logged with requester and approver IDs  
✅ **Budget Control**: Monthly quotas prevent overspending  
✅ **Audit Trail**: Immutable ledger tracks all point transactions  
✅ **Transparency**: Clear status badges show request state  
✅ **Automation**: Rank recalculation happens automatically  

**Next Steps:**
1. Navigate to `/bonus` to see the pending request
2. Click "批准" to approve it
3. Verify points were awarded to the volunteer
4. Check the volunteer's updated rank level

---

**For questions or issues, contact: https://help.manus.im**
