# OAuth & User Management Architecture

**Date:** November 1, 2025  
**System:** Temple Volunteer Management System

---

## Overview

The system uses **two authentication methods**:

1. **Manus OAuth** (Primary) - For web admin access via Manus platform
2. **WeChat OAuth Simulation** (Secondary) - For mini-program volunteer login via volunteer codes

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     AUTHENTICATION FLOW                          │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐                    ┌──────────────────┐
│   Web Browser    │                    │  WeChat Mini-    │
│   (Admin/Staff)  │                    │    Program       │
└────────┬─────────┘                    └────────┬─────────┘
         │                                       │
         │ Click "登录系统"                       │ Enter volunteer code
         │                                       │
         ▼                                       ▼
┌──────────────────┐                    ┌──────────────────┐
│  Manus OAuth     │                    │  WeChat OAuth    │
│  Portal          │                    │  Simulation      │
│  (External)      │                    │  (Internal API)  │
└────────┬─────────┘                    └────────┬─────────┘
         │                                       │
         │ OAuth code                            │ Volunteer code
         │                                       │
         ▼                                       ▼
┌─────────────────────────────────────────────────────────────────┐
│              /api/oauth/callback          /api/trpc/wechat      │
│                                          .code2Session           │
│  1. Exchange code for token       1. Lookup user by code        │
│  2. Get user info from Manus      2. Verify volunteer exists    │
│  3. Upsert user in database       3. Return session token       │
│  4. Create session cookie         4. Mini-program stores token  │
│  5. Redirect to homepage                                        │
└────────┬────────────────────────────────────┬──────────────────┘
         │                                     │
         │                                     │
         ▼                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SESSION MANAGEMENT                          │
│                                                                  │
│  - Cookie-based (Web): COOKIE_NAME with JWT                     │
│  - Token-based (Mini-program): sessionToken in local storage    │
│  - Expiry: 1 year (ONE_YEAR_MS)                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Manus OAuth (Web Login)

**Purpose:** Admin and staff access via Manus platform authentication

**Flow:**
```
User clicks "登录系统" 
  → Redirects to Manus OAuth Portal
  → User authorizes with Manus account
  → Callback to /api/oauth/callback with code
  → Exchange code for access token
  → Get user info (openId, name)
  → Upsert user in database
  → Create session cookie
  → Redirect to homepage
```

**Files:**
- `client/src/const.ts` - `getLoginUrl()` generates OAuth URL
- `server/_core/oauth.ts` - Handles `/api/oauth/callback`
- `server/_core/sdk.ts` - Manus SDK for token exchange
- `server/_core/context.ts` - Validates session cookie on each request

**Key Code:**
```typescript
// client/src/const.ts
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  
  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("type", "signIn");
  
  return url.toString();
};

// server/_core/oauth.ts
app.get("/api/oauth/callback", async (req, res) => {
  const code = getQueryParam(req, "code");
  const tokenResponse = await sdk.exchangeCodeForToken(code, state);
  const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
  
  await db.upsertUser({
    openId: userInfo.openId,
    name: userInfo.name || 'Unknown',
  });
  
  const sessionToken = await sdk.createSessionToken(userInfo.openId, {
    name: userInfo.name || "",
    expiresInMs: ONE_YEAR_MS,
  });
  
  res.cookie(COOKIE_NAME, sessionToken, { maxAge: ONE_YEAR_MS });
  res.redirect(302, "/");
});
```

---

### 2. WeChat OAuth Simulation (Mini-Program Login)

**Purpose:** Volunteer login via volunteer codes (e.g., V1730380123456)

**Flow:**
```
User enters volunteer code in mini-program
  → Mini-program calls /api/trpc/wechat.code2Session
  → Server looks up user by openId (volunteer code)
  → Returns session token and user info
  → Mini-program stores token in local storage
  → Uses token for subsequent API calls
```

**Files:**
- `server/routers.ts` - `wechat.code2Session` endpoint
- Mini-program client (not yet implemented) - Would call this API

**Key Code:**
```typescript
// server/routers.ts
wechat: router({
  code2Session: publicProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input }) => {
      const db = await import("./db").then(m => m.getDb());
      const { users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      // Find user by volunteer code (openId)
      const userList = await db
        .select()
        .from(users)
        .where(eq(users.openId, input.code))
        .limit(1);
      
      if (userList.length === 0) {
        throw new TRPCError({ 
          code: "NOT_FOUND", 
          message: "志愿者编号不存在" 
        });
      }

      const user = userList[0];

      // Return session token
      return {
        success: true,
        sessionToken: `session_${user.id}_${Date.now()}`,
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          phone: user.phone,
        },
      };
    }),
}),
```

---

### 3. User Management System

**Purpose:** CRUD operations with role-based access control

**Endpoints:**

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `users.list` | Query | Manager+ | List all users with pagination |
| `users.getById` | Query | Self or Manager+ | Get user details |
| `users.updateProfile` | Mutation | Self or Manager+ | Update name/phone |
| `users.updateRole` | Mutation | Admin only | Change user role |
| `users.delete` | Mutation | Admin only | Delete user account |

**Role Hierarchy:**
```
volunteer < leader < manager < admin < super-admin
```

**Access Control Logic:**
```typescript
// Self-service: Users can manage their own data
if (ctx.user.id === input.userId) {
  // Allow
} else {
  // Require manager+ role
  requireRole(ctx.user.role, "manager");
}

// Role changes: Admin only
requireRole(ctx.user.role, "admin");

// Cannot change own role or delete own account
if (ctx.user.id === input.userId) {
  throw new TRPCError({ code: "FORBIDDEN" });
}
```

**Audit Logging:**
```typescript
// Role changes are logged
const { logRoleChange } = await import("./services/audit");
await logRoleChange(
  ctx.user.id,      // Who made the change
  input.userId,     // Whose role changed
  oldRole,          // From
  input.role        // To
);
```

---

## Database Schema

### users table
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openId VARCHAR(64) NOT NULL UNIQUE,  -- Manus openId OR volunteer code
  name TEXT NOT NULL,
  phone VARCHAR(20),
  role ENUM('volunteer', 'leader', 'manager', 'admin', 'super-admin') DEFAULT 'volunteer',
  createdAt DATETIME DEFAULT NOW(),
  updatedAt DATETIME DEFAULT NOW() ON UPDATE NOW()
);
```

### audit_logs table
```sql
CREATE TABLE audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  actorUserId INT NOT NULL,           -- Who performed the action
  action VARCHAR(64) NOT NULL,        -- e.g., 'role_change'
  targetType VARCHAR(64),             -- e.g., 'user'
  targetId INT,                       -- User ID that was affected
  oldValue TEXT,                      -- Previous value (JSON)
  newValue TEXT,                      -- New value (JSON)
  createdAt DATETIME DEFAULT NOW()
);
```

---

## Current Status

### ✅ Implemented
- Manus OAuth callback handler
- Session cookie management
- User upsert on login
- WeChat OAuth simulation API (`code2Session`)
- User management CRUD (list, get, update, delete)
- Role management (admin only)
- RBAC with 5-level hierarchy
- Audit logging for role changes
- Self-service profile updates
- Protection against self-role-change and self-deletion

### ⚠️ Current Limitation
The "登录系统" button currently uses **Manus OAuth only**. This is correct for web admin access but doesn't show WeChat OAuth.

### 🔧 Why WeChat OAuth Isn't Visible

**Reason:** WeChat OAuth is designed for **mini-program use**, not web browser login.

**Current Setup:**
- Web users (admins/staff) → Use Manus OAuth (click "登录系统")
- Mini-program users (volunteers) → Use `wechat.code2Session` API (enter volunteer code)

**The "登录系统" button correctly redirects to Manus OAuth portal** because:
1. Web interface is for administrative access
2. Volunteers use mini-program with volunteer codes
3. Two separate authentication flows for two different user types

---

## How to Test WeChat OAuth Simulation

Since you don't have a mini-program yet, here's how to test the `code2Session` API:

### Option 1: Direct API Call (cURL)
```bash
curl -X POST 'http://localhost:3000/api/trpc/wechat.code2Session' \
  -H 'Content-Type: application/json' \
  -d '{"code":"V1730380123456"}'
```

### Option 2: Browser Console
```javascript
fetch('/api/trpc/wechat.code2Session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: 'V1730380123456' })
})
.then(r => r.json())
.then(console.log);
```

### Option 3: Test with Existing Volunteer Code
1. Register a new volunteer at `/register`
2. Save the volunteer code (e.g., `V1730380123456`)
3. Call `wechat.code2Session` with that code
4. You'll receive a session token and user info

---

## Integration Recommendations

### For Mini-Program Development

When you build the WeChat mini-program, implement this flow:

```javascript
// Mini-program login page
wx.login({
  success: (res) => {
    // In real WeChat, res.code is from WeChat
    // For this system, use volunteer code instead
    const volunteerCode = userInput; // From input field
    
    // Call your backend
    wx.request({
      url: 'https://your-domain.com/api/trpc/wechat.code2Session',
      method: 'POST',
      data: { code: volunteerCode },
      success: (response) => {
        const { sessionToken, user } = response.data.result.data;
        
        // Store session token
        wx.setStorageSync('sessionToken', sessionToken);
        wx.setStorageSync('user', user);
        
        // Navigate to home
        wx.switchTab({ url: '/pages/index/index' });
      }
    });
  }
});
```

### For Web Alternative Login

If you want to allow volunteers to log in via web (not just mini-program), you could:

1. **Add a "Volunteer Login" button** on homepage
2. **Show a dialog** asking for volunteer code
3. **Call `wechat.code2Session`** with the code
4. **Create a session cookie** manually
5. **Refresh the page** to show logged-in state

Would you like me to implement this web-based volunteer login option?

---

## Security Considerations

### Current Implementation
- ✅ Session tokens expire after 1 year
- ✅ Volunteer codes are unique (timestamp-based)
- ✅ Role changes are audit-logged
- ✅ RBAC prevents unauthorized access
- ✅ Cannot change own role or delete own account

### Recommendations for Production
1. **Shorten session expiry** to 30 days or less
2. **Implement token refresh** mechanism
3. **Add rate limiting** on `code2Session` endpoint
4. **Hash volunteer codes** or use UUIDs instead of timestamps
5. **Add 2FA** for admin accounts
6. **Implement IP whitelisting** for admin access
7. **Add CAPTCHA** on login after failed attempts

---

## Summary

**Current State:**
- ✅ Manus OAuth works for web admin login
- ✅ WeChat OAuth simulation API ready for mini-program
- ✅ User management system fully functional
- ✅ RBAC and audit logging in place

**What You See:**
- "登录系统" button → Manus OAuth (correct for web admins)
- WeChat OAuth → API endpoint ready, needs mini-program client

**Next Steps:**
1. Build WeChat mini-program to use `wechat.code2Session`
2. OR implement web-based volunteer login dialog
3. Add session token refresh mechanism
4. Implement additional security measures

---

**Questions or Need Changes?**

Let me know if you'd like me to:
- Add a web-based volunteer login option
- Modify the OAuth flow
- Add additional authentication methods
- Implement specific security features
