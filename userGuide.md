# Temple Volunteer Management System - User Guide

**Purpose**: Manage temple volunteer services with a time bank system and seven-tier membership ranking.  
**Access**: Login required via Manus OAuth

---

## Powered by Manus

The Temple Volunteer Management System is built with cutting-edge web technologies to deliver a seamless and reliable experience for temple administrators and volunteers.

**Frontend**: React 19 with TypeScript provides a type-safe, responsive interface. The UI is styled with Tailwind CSS 4 featuring a custom Buddhist-themed golden color palette. Components from shadcn/ui ensure accessibility and consistency across the application.

**Backend**: Node.js 22 with Express 4 powers the server, while tRPC 11 provides end-to-end type safety between frontend and backend, eliminating API contract errors. Drizzle ORM manages database interactions with MySQL/TiDB for reliable data storage.

**Security**: AES-256-CBC encryption protects sensitive ID card data. HMAC-SHA256 signatures secure redemption codes against forgery. JWT-based session management ensures authenticated access.

**Deployment**: Auto-scaling infrastructure with global CDN ensures fast loading times and high availability for users worldwide.

---

## Using Your Website

### Viewing Your Dashboard

After logging in, you'll see your volunteer dashboard displaying your current membership level, accumulated points, and service hours. The dashboard shows your position in the seven-tier ranking system (七地菩萨会员体系), from "欢喜地" (Joyful Ground) at Level 1 to "远行地" (Far-Reaching Ground) at Level 7. Your total service hours are displayed prominently, with progress toward the 70-hour "欢喜徽记" (Joy Badge) milestone clearly indicated.

### Earning Points and Hours

Points are earned through volunteer service. When a team leader confirms your attendance, the system automatically records your service hours and awards points at a rate of 10 points per hour. If you reach 70 total service hours, you'll automatically receive the Joy Badge, which unlocks premium rewards. Your membership level increases as you accumulate points, with each level requiring progressively more points.

### Redeeming Rewards

Click "可兑换奖励" (Available Rewards) to browse items you can redeem with your points. Each reward shows its point cost, required membership level, and whether it needs the Joy Badge. Rewards marked "可兑换" (Available) can be redeemed immediately by clicking the reward card. After redemption, you'll receive a QR code that temple staff can scan to verify and fulfill your reward.

---

## Managing Your Website

### Settings Panel

Access the Settings panel from the Management UI to configure your website name and logo. Update the "VITE_APP_TITLE" field to change the system name displayed throughout the application. Upload a new logo by updating "VITE_APP_LOGO" with an image URL.

### Database Panel

The Database panel provides a visual interface to view and manage all system data. You can browse users, departments, engagements, schedules, attendance records, points transactions, rewards, and redemption orders. Use the CRUD interface to add, edit, or delete records directly. Connection details for external database tools are available in the bottom-left settings menu.

### Dashboard Panel

Monitor system usage and website visibility from the Dashboard panel. View analytics showing unique visitors (UV) and page views (PV) for your published site. Toggle visibility settings to control whether your website is publicly accessible or restricted to authenticated users only.

---

## Next Steps

Talk to Manus AI anytime to request changes or add features. The system is designed to grow with your temple's needs, whether you want to add new reward categories, implement advanced scheduling features, or integrate with other temple management systems. The modular architecture makes it easy to extend functionality while maintaining the core time bank and ranking features that motivate volunteers to serve with dedication and joy.
