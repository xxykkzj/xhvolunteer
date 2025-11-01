# Temple Volunteer Management System - Development Roadmap

**Last Updated**: November 1, 2025
**Current Status**: MVP Ready (Core Features 85% Complete)
**Version**: 0.8

---

## 🎯 Quick Overview

**What's Done**: ✅ Authentication, User Management, Departments, Scheduling, Attendance, Points, Rewards, Badges, Engagement Tracking
**What's Next**: 🚀 Project Setup, Testing, UI Polish, Reports, Production Deployment

**Current Completion**: ~65% overall, 85% core features

---

## 📦 Phase 1: Project Setup & Configuration (HIGH PRIORITY)

**Status**: 🔴 **BLOCKED** - Required for all development
**Time Estimate**: 2-4 hours

### 1.1 Create package.json
- [ ] Define all dependencies (React 19, TypeScript 5.9, tRPC 11, Drizzle ORM, etc.)
- [ ] Add build scripts (dev, build, preview, lint)
- [ ] Add database scripts (migrate, seed, reset)
- [ ] Add test scripts (test, test:watch, coverage)
- [ ] Configure TypeScript, ESLint, Prettier

### 1.2 Build Configuration
- [ ] Set up Vite configuration
- [ ] Configure build output directories
- [ ] Set up path aliases (@shared, @server, @client)
- [ ] Configure environment variable handling

### 1.3 Development Environment
- [ ] Create .env from .env.development
- [ ] Set up local MySQL database
- [ ] Run database migrations (create-all-tables.ts)
- [ ] Seed sample data
- [ ] Verify server starts successfully

**Acceptance Criteria**:
- `pnpm install` works
- `pnpm dev` starts the development server
- `pnpm build` creates production build
- Database migrations run successfully

---

## 🧪 Phase 2: Testing Infrastructure (HIGH PRIORITY)

**Status**: 🔴 **MISSING** - Critical for production readiness
**Time Estimate**: 8-12 hours

### 2.1 Unit Testing Setup
- [ ] Install Jest/Vitest + @testing-library
- [ ] Configure test environment
- [ ] Create test utilities (mocks, fixtures)
- [ ] Set up coverage reporting (target: 70%+)

### 2.2 Critical Path Tests
- [ ] **Rank Calculation**: Test 7-tier system logic
- [ ] **Joy Badge**: Test 70-hour auto-grant
- [ ] **Points Calculation**: Test 1 hour = 10 points
- [ ] **HMAC Signatures**: Test redemption code generation/verification
- [ ] **Encryption**: Test AES-256-CBC ID card encryption
- [ ] **RBAC**: Test role hierarchy enforcement

### 2.3 Component Tests
- [ ] Authentication flows (Login, Register)
- [ ] Badge display component
- [ ] Department tree view
- [ ] Schedule calendar

### 2.4 E2E Tests (Optional)
- [ ] Install Playwright
- [ ] Test complete redemption flow (browse → redeem → verify)
- [ ] Test attendance confirmation flow

**Acceptance Criteria**:
- All critical business logic covered
- 70%+ code coverage on services
- CI/CD pipeline runs tests automatically

---

## 📁 Phase 3: Code Organization (MEDIUM PRIORITY)

**Status**: 🟡 **NEEDED** - Improves maintainability
**Time Estimate**: 6-8 hours

### 3.1 File Reorganization
- [ ] Create client/ directory → Move all .tsx files
- [ ] Create server/ directory → Move all backend .ts files
- [ ] Create shared/ directory → Move constants.ts, types
- [ ] Create scripts/ directory → Move all seed/migration scripts
- [ ] Update all import paths

### 3.2 Split Large Files
- [ ] **routers.ts (1014 lines)** → Split into feature routers:
  - [ ] auth.router.ts
  - [ ] departments.router.ts
  - [ ] schedules.router.ts
  - [ ] attendance.router.ts
  - [ ] points.router.ts
  - [ ] rewards.router.ts
  - [ ] badges.router.ts
  - [ ] engagements.router.ts
  - [ ] admin.router.ts
- [ ] **db-queries.ts (469 lines)** → Split by domain
- [ ] **schema.ts (502 lines)** → Group by domain (keep in one file is OK)

### 3.3 Component Organization
- [ ] Create client/components/ for reusable components
- [ ] Create client/pages/ for page components
- [ ] Create client/lib/ for utilities

**Acceptance Criteria**:
- No file exceeds 300 lines (except schema.ts)
- Clear separation of concerns (client/server/shared)
- All imports updated and working

---

## 🎨 Phase 4: UI/UX Improvements (MEDIUM PRIORITY)

**Status**: 🟡 **PARTIAL** - Core functionality works, needs polish
**Time Estimate**: 8-12 hours

### 4.1 Department Management
- [ ] **Replace flat list with tree view** (high priority)
- [ ] Use shadcn/ui Tree component or similar
- [ ] Show hierarchy visually (indentation, icons)
- [ ] Drag-and-drop to reorganize (optional)
- [ ] Department selector component for forms

### 4.2 Volunteer Dashboard
- [ ] **Create "My Schedule" page** (`/my-schedules`)
- [ ] Show upcoming schedules (next 7 days)
- [ ] Show past schedules (last 30 days)
- [ ] Calendar view with assigned dates highlighted
- [ ] Quick stats: hours this week/month

### 4.3 Admin Dashboard
- [ ] Create admin home page with statistics
- [ ] Total users, total hours, active volunteers
- [ ] Recent activities (new users, redemptions)
- [ ] Quick actions (create user, approve bonus)
- [ ] Charts (optional): Hours over time, redemptions by reward

### 4.4 Mobile Responsiveness
- [ ] Audit all pages on mobile breakpoints
- [ ] Fix navigation for mobile (hamburger menu?)
- [ ] Ensure forms are usable on mobile
- [ ] Test redemption QR code display on mobile

### 4.5 User Experience
- [ ] Loading states (skeletons, spinners)
- [ ] Error messages (user-friendly, actionable)
- [ ] Success confirmations (toasts, modals)
- [ ] Empty states (no schedules, no badges, etc.)
- [ ] Confirmation dialogs for destructive actions

**Acceptance Criteria**:
- Department tree view working
- Volunteers can see their schedules
- Admins have a useful dashboard
- Mobile experience is acceptable

---

## 📊 Phase 5: Reports & Analytics (LOW PRIORITY)

**Status**: 🟢 **FUTURE** - Nice to have
**Time Estimate**: 10-15 hours

### 5.1 Volunteer Reports
- [ ] Service hours by volunteer (table, chart)
- [ ] Points earned by volunteer
- [ ] Badge achievements timeline
- [ ] Export to CSV/Excel

### 5.2 Department Reports
- [ ] Hours by department
- [ ] Active volunteers by department
- [ ] Bonus points distributed by department
- [ ] Export to CSV/Excel

### 5.3 System Reports
- [ ] Redemption statistics (most popular rewards)
- [ ] New registrations over time
- [ ] Attendance rate trends
- [ ] Points velocity (earned vs redeemed)

### 5.4 Export Functionality
- [ ] Install exceljs or csv-writer
- [ ] Create export service
- [ ] Add export buttons to report pages

**Acceptance Criteria**:
- Admins can generate monthly reports
- Data can be exported for external analysis

---

## 🔧 Phase 6: Infrastructure & DevOps (MEDIUM-HIGH PRIORITY)

**Status**: 🟡 **PARTIAL** - Docs ready, implementation needed
**Time Estimate**: 6-10 hours

### 6.1 Production Environment
- [ ] Set up production server (Ubuntu 22.04 recommended)
- [ ] Install Node.js 22, MySQL, Nginx
- [ ] Configure production .env (strong keys!)
- [ ] Set up PM2 for process management
- [ ] Configure Nginx reverse proxy
- [ ] Set up SSL with Let's Encrypt

### 6.2 Database
- [ ] Create production database
- [ ] Run migrations in production
- [ ] Set up automated daily backups
- [ ] Configure connection pooling
- [ ] Add indexes for performance

### 6.3 Monitoring
- [ ] Set up error tracking (Sentry or similar)
- [ ] Configure application logging (Winston/Pino)
- [ ] Set up uptime monitoring (UptimeRobot)
- [ ] Create health check endpoint
- [ ] Configure PM2 monitoring

### 6.4 Security Hardening
- [ ] Replace all default keys with strong random values
- [ ] Implement rate limiting (express-rate-limit)
- [ ] Add CSRF protection
- [ ] Configure security headers (helmet)
- [ ] Set up firewall rules (ufw)
- [ ] File permissions (chmod 600 .env)

**Acceptance Criteria**:
- Production server running and accessible
- SSL certificate valid
- All security checklist items completed
- Monitoring and logging active

---

## 🐛 Phase 7: Bug Fixes & Polish (ONGOING)

**Status**: 🟢 **CONTINUOUS**
**Priority**: As discovered

### Known Issues
- [ ] OAuth login redirect flow (needs user testing)
- [ ] Department UI showing flat list instead of tree
- [ ] Missing error handling in some API endpoints

### Testing Needed
- [ ] Complete manual testing of all workflows
- [ ] Test with multiple users simultaneously
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile devices (iOS, Android)
- [ ] Load testing (100+ concurrent users)

**Acceptance Criteria**:
- No critical bugs in production
- All user-facing features tested
- Error handling graceful

---

## 🚀 Phase 8: Future Enhancements (LOW PRIORITY)

**Status**: 🟢 **FUTURE** - Beyond MVP
**Time Estimate**: TBD

### Advanced Features
- [ ] Rotation rules for temple workers (auto-generate monthly schedules)
- [ ] Email notifications (schedule reminders, badge achievements)
- [ ] SMS notifications (optional)
- [ ] WeChat Mini Program integration
- [ ] Multi-language support (English/Chinese)
- [ ] Advanced search and filters
- [ ] Batch operations (bulk user import)

### Performance Optimization
- [ ] Implement Redis caching
- [ ] Database query optimization
- [ ] CDN for static assets
- [ ] Image optimization
- [ ] Code splitting and lazy loading

### Admin Tools
- [ ] Reward management UI (currently database-only)
- [ ] Audit log viewer with filtering
- [ ] User impersonation (for support)
- [ ] Data import/export tools
- [ ] System configuration UI

**Acceptance Criteria**:
- Features implemented based on user feedback
- No performance degradation

---

## 📋 Priority Matrix

### Do First (Next Sprint)
1. ✅ **Create package.json** (Phase 1.1) - CRITICAL
2. ✅ **Set up testing** (Phase 2.1-2.2) - CRITICAL
3. ✅ **Department tree view** (Phase 4.1) - HIGH IMPACT
4. ✅ **My Schedule page** (Phase 4.2) - HIGH IMPACT

### Do Next (Following Sprint)
5. **Split large files** (Phase 3.2) - MAINTAINABILITY
6. **Admin dashboard** (Phase 4.3) - NICE TO HAVE
7. **Production deployment** (Phase 6) - LAUNCH BLOCKER

### Do Later (Backlog)
8. Reports & Analytics (Phase 5)
9. Future Enhancements (Phase 8)

---

## 🎯 Sprint Planning Suggestion

### Sprint 1: Foundation (1 week)
- Create package.json and build config
- Set up testing infrastructure
- Write critical path tests
- Fix department tree view UI

**Goal**: Development environment ready, tests passing

### Sprint 2: Polish (1 week)
- Create "My Schedule" page
- Create admin dashboard
- Mobile responsiveness audit
- Bug fixes from testing

**Goal**: All core features user-friendly

### Sprint 3: Production (1 week)
- Code reorganization (split large files)
- Production server setup
- Security hardening
- Deploy to production

**Goal**: Live production system

### Sprint 4+: Iterate
- Reports and analytics
- Future enhancements based on user feedback

---

## 📝 Notes

### What's Intentionally Excluded
- **Payroll System**: Managed by financial department separately
- **Complex rotation scheduling**: Manual scheduling sufficient for now
- **Integration with external systems**: Not needed for MVP

### Technical Debt
- Flat file structure (will fix in Phase 3)
- Large monolithic files (will fix in Phase 3)
- Missing tests (will fix in Phase 2)
- No package.json yet (will fix in Phase 1)

### Estimated Timeline to Production
- **Minimum**: 3 weeks (Sprints 1-3)
- **Recommended**: 4-6 weeks (includes testing and polish)

---

## 🔗 Related Documentation

- [CODEBASE_AUDIT_2025-11-01.md](./CODEBASE_AUDIT_2025-11-01.md) - Detailed audit report
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment instructions
- [API.md](./API.md) - API reference
- [README.md](./README.md) - Project overview
- [docs/archive/](./docs/archive/) - Historical documentation

---

**For questions or to propose changes to this roadmap, update this file and commit your changes.**

**Last Review**: November 1, 2025
