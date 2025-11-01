# Temple Volunteer Management System - Deployment Guide

This guide covers how to deploy the Temple Volunteer Management System in various environments.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Local Development Setup](#local-development-setup)
4. [Production Deployment](#production-deployment)
5. [Database Setup](#database-setup)
6. [Security Checklist](#security-checklist)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js**: Version 22+ (LTS)
- **pnpm**: Latest version (package manager)
- **MySQL**: Version 8.0+ or TiDB (compatible)
- **Git**: For version control

### System Requirements

- **Memory**: Minimum 2GB RAM (4GB+ recommended)
- **Storage**: Minimum 1GB free space
- **OS**: Linux, macOS, or Windows with WSL2

---

## Environment Configuration

### Understanding Environment Files

The project uses environment files for configuration:

- **`.env.example`** - Template with all required variables
- **`.env.development`** - Development defaults (committed to repo)
- **`.env`** - Your actual configuration (NOT committed, gitignored)
- **`.env.production`** - Production configuration (NOT committed)

### Required Environment Variables

#### Database
```bash
DATABASE_URL=mysql://username:password@host:port/database
```

#### Security Keys
```bash
# AES-256-CBC encryption (32 characters)
AES_KEY=your-32-character-encryption-key!!

# AES IV (16 characters)
AES_IV=your-16-char-iv!

# HMAC secret (32+ characters)
HMAC_SECRET=your-hmac-secret-minimum-32-characters-long
```

#### OAuth Configuration
```bash
# Backend OAuth
OAUTH_SERVER_URL=https://your-oauth-server.com
APP_ID=your-app-id

# Frontend OAuth (Vite)
VITE_OAUTH_PORTAL_URL=https://your-oauth-portal.com
VITE_APP_ID=your-app-id
```

#### Super Admin
```bash
OWNER_OPEN_ID=your-owner-openid
OWNER_NAME=Super Admin
```

#### Application Branding
```bash
VITE_APP_TITLE=Temple Volunteer Management
VITE_APP_LOGO=https://your-cdn.com/logo.png
```

---

## Local Development Setup

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd xianghai_volunteer_record
```

### Step 2: Install Dependencies

**Note**: The project currently doesn't have a `package.json`. You'll need to create one first or wait for it to be added.

```bash
pnpm install
```

### Step 3: Configure Environment

```bash
# Copy development environment file
cp .env.development .env

# Edit with your local settings
nano .env
```

### Step 4: Set Up Database

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE temple_volunteer_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run migrations
pnpm tsx create-all-tables.ts

# Seed sample data (optional)
pnpm tsx seed-sample-data.ts
```

### Step 5: Generate Security Keys

For development, you can use these commands to generate secure keys:

```bash
# Generate AES_KEY (32 characters / 16 bytes hex)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Generate AES_IV (16 characters / 8 bytes hex)
node -e "console.log(require('crypto').randomBytes(8).toString('hex'))"

# Generate HMAC_SECRET (64 characters / 32 bytes hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 6: Start Development Server

```bash
pnpm dev
```

The application should be available at `http://localhost:3000`

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Production database created and accessible
- [ ] Strong security keys generated (different from dev)
- [ ] OAuth configured for production domain
- [ ] SSL/TLS certificate obtained
- [ ] Firewall rules configured
- [ ] Backup strategy in place

### Step 1: Server Setup

**Recommended: Ubuntu 22.04 LTS**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install MySQL (if not using managed database)
sudo apt install -y mysql-server
```

### Step 2: Application Setup

```bash
# Create application user
sudo useradd -m -s /bin/bash temple-app
sudo su - temple-app

# Clone repository
git clone <repository-url>
cd xianghai_volunteer_record

# Install dependencies
pnpm install --prod
```

### Step 3: Configure Production Environment

```bash
# Create production environment file
cp .env.example .env.production

# Edit with production values
nano .env.production
```

**IMPORTANT**: Use strong, unique values for all security keys!

### Step 4: Database Setup

```bash
# Create production database
mysql -u root -p -e "CREATE DATABASE temple_volunteer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Create dedicated database user
mysql -u root -p -e "CREATE USER 'temple_user'@'localhost' IDENTIFIED BY 'strong-password';"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON temple_volunteer.* TO 'temple_user'@'localhost';"
mysql -u root -p -e "FLUSH PRIVILEGES;"

# Run migrations
NODE_ENV=production pnpm tsx create-all-tables.ts
```

### Step 5: Build Application

```bash
# Build for production
pnpm build
```

### Step 6: Set Up Process Manager

Using **PM2** (recommended):

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start ecosystem.config.js --env production

# Configure auto-restart on reboot
pm2 startup
pm2 save
```

### Step 7: Configure Reverse Proxy

**Using Nginx:**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Step 8: SSL/TLS Setup

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com
```

---

## Database Setup

### MySQL Configuration

**Recommended `my.cnf` settings:**

```ini
[mysqld]
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci
max_connections=200
innodb_buffer_pool_size=1G
innodb_log_file_size=256M
```

### Database Backup

**Automated Daily Backup Script:**

```bash
#!/bin/bash
# /usr/local/bin/backup-temple-db.sh

BACKUP_DIR="/var/backups/temple-volunteer"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="temple_volunteer"

mkdir -p $BACKUP_DIR
mysqldump -u temple_user -p$DB_PASSWORD $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
```

**Add to crontab:**
```bash
0 2 * * * /usr/local/bin/backup-temple-db.sh
```

---

## Security Checklist

### Before Production Launch

- [ ] **All default security keys replaced** with strong random values
- [ ] **`.env` file permissions** set to 600 (chmod 600 .env)
- [ ] **Database user** has minimal required privileges only
- [ ] **Firewall configured** to allow only necessary ports
- [ ] **SSL/TLS enabled** with valid certificate
- [ ] **Regular backups** configured and tested
- [ ] **Security headers** configured in reverse proxy
- [ ] **Rate limiting** implemented (if not already in code)
- [ ] **Audit logging** enabled and monitored
- [ ] **Database encryption at rest** enabled (if available)

### Security Headers (Nginx)

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' https:;" always;
```

### File Permissions

```bash
# Application files
chmod -R 755 /home/temple-app/xianghai_volunteer_record
chmod 600 /home/temple-app/xianghai_volunteer_record/.env*

# Logs directory
mkdir -p /var/log/temple-volunteer
chown -R temple-app:temple-app /var/log/temple-volunteer
chmod 750 /var/log/temple-volunteer
```

---

## Troubleshooting

### Common Issues

#### Database Connection Failed

**Error**: `Error: connect ECONNREFUSED`

**Solution**:
1. Check DATABASE_URL format
2. Verify MySQL is running: `systemctl status mysql`
3. Check firewall rules
4. Verify user permissions

#### AES Encryption Error

**Error**: `Error: Invalid key length`

**Solution**:
- AES_KEY must be exactly 32 characters
- AES_IV must be exactly 16 characters
- Check for trailing spaces in .env file

#### OAuth Login Not Working

**Error**: `OAuth server not configured`

**Solution**:
1. Verify OAUTH_SERVER_URL is set
2. Check APP_ID matches OAuth registration
3. Verify redirect URI is whitelisted in OAuth server
4. Check CORS configuration

#### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 pnpm dev
```

### Logs

**Application Logs:**
```bash
# PM2 logs
pm2 logs temple-volunteer

# Or check log files
tail -f /var/log/temple-volunteer/error.log
```

**Database Logs:**
```bash
# MySQL error log
sudo tail -f /var/log/mysql/error.log
```

### Performance Optimization

**Database Indexes:**
```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_user_openid ON users(openId);
CREATE INDEX idx_attendance_date ON attendance_daily(date);
CREATE INDEX idx_points_userid ON point_ledger(userId);
```

**Connection Pooling:**
```javascript
// In db.ts
const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  // ... other config
});
```

---

## Monitoring

### Health Checks

Create a health check endpoint:
```
GET /api/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-11-01T12:00:00Z"
}
```

### Monitoring Tools (Recommended)

- **Application**: PM2 monitoring, New Relic, or DataDog
- **Server**: Prometheus + Grafana
- **Uptime**: UptimeRobot or Pingdom
- **Logs**: ELK Stack or Papertrail
- **Errors**: Sentry

---

## Scaling Considerations

### Horizontal Scaling

1. **Load Balancer**: Use Nginx or HAProxy
2. **Database**: Read replicas for SELECT queries
3. **Session Storage**: Use Redis for session management
4. **File Storage**: Use S3 or equivalent for uploads

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database queries
- Enable caching (Redis, Memcached)
- Use CDN for static assets

---

## Support

For deployment issues:
1. Check this guide's troubleshooting section
2. Review application logs
3. Consult DEVELOPMENT.md for technical details
4. Contact: https://help.manus.im

---

**Last Updated**: November 1, 2025
