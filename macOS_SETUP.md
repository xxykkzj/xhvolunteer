# macOS Setup Guide - Temple Volunteer Management System

**For macOS Users** 🍎

This guide provides macOS-specific installation instructions.

---

## Prerequisites (Install These First)

### 1. Install Homebrew (if you don't have it)

Open Terminal and run:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Install Node.js 22

```bash
# Install Node.js via Homebrew
brew install node@22

# Verify installation
node --version  # Should show v22.x.x
```

### 3. Install pnpm

```bash
# Install pnpm globally
npm install -g pnpm

# Verify installation
pnpm --version  # Should show 9.x.x
```

---

## Database Setup (Choose ONE Option)

### Option A: MySQL via Homebrew (Recommended for macOS)

```bash
# Install MySQL
brew install mysql

# Start MySQL service
brew services start mysql

# Secure installation (set root password)
mysql_secure_installation

# Connect to MySQL
mysql -u root -p

# Create database (run this in MySQL prompt)
CREATE DATABASE temple_volunteer_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### Option B: Docker MySQL (Easier, No Native Install)

**First, install Docker Desktop for Mac**:
1. Download from: https://www.docker.com/products/docker-desktop/
2. Install and start Docker Desktop

**Then run MySQL container**:
```bash
docker run -d \
  --name temple-mysql \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=temple_volunteer_dev \
  -p 3306:3306 \
  mysql:8.0

# Verify it's running
docker ps
```

### Option C: TiDB Cloud (No Local Install)

1. Go to: https://tidbcloud.com
2. Sign up for free account
3. Create a serverless cluster
4. Get connection string
5. Update `.env` file with the connection string

---

## Project Setup

### Step 1: Navigate to Project Directory

```bash
cd /path/to/xianghai_volunteer_record
```

### Step 2: Install Dependencies

```bash
pnpm install
```

**Expected output**:
```
Packages: +XXX
Progress: resolved XXX, reused XXX, downloaded XX, added XXX
Done in XXs
```

**Time**: 2-5 minutes (depending on internet speed)

### Step 3: Configure Environment

Edit `.env` file (already created):

```bash
# Open in default text editor
open -e .env

# Or use nano
nano .env

# Or use VS Code (if installed)
code .env
```

**Update the DATABASE_URL**:
```bash
# For local MySQL
DATABASE_URL=mysql://root:your-password@localhost:3306/temple_volunteer_dev

# For Docker MySQL
DATABASE_URL=mysql://root:password@localhost:3306/temple_volunteer_dev

# For TiDB Cloud
DATABASE_URL=mysql://user:password@gateway.tidbcloud.com:4000/temple_volunteer_dev?ssl=true
```

### Step 4: Create Database Tables

```bash
pnpm db:migrate
```

**Expected output**:
```
Creating all tables...
✅ Created table: users
✅ Created table: departments
... (18 tables total)
✅ All tables created successfully!
```

### Step 5: Add Sample Data (Optional)

```bash
pnpm db:seed
```

**Expected output**:
```
Seeding sample data...
✅ Created 5 users
✅ Created 27 departments
✅ Created 5 badges
✅ Created 9 rewards
Done!
```

### Step 6: Start Development Server

```bash
pnpm dev
```

**Expected output**:
```
🚀 Server running on http://localhost:3000
📡 tRPC API: http://localhost:3000/api/trpc
🏥 Health check: http://localhost:3000/api/health
🌍 Environment: development
```

**Then Vite will start on port 5173**:
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Step 7: Open in Browser

```bash
# Open automatically
open http://localhost:5173

# Or manually go to: http://localhost:5173
```

---

## macOS-Specific Notes

### File Permissions
No changes needed - macOS permissions work fine for this project.

### M1/M2/M3 Chips (Apple Silicon)
Everything works natively! No Rosetta needed.

### Ports
If port 3000 or 5173 is already in use:

```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3001 pnpm dev
```

### MySQL Socket Location
macOS MySQL socket is typically at `/tmp/mysql.sock`

If connection fails, try:
```bash
DATABASE_URL=mysql://root:password@localhost:3306/temple_volunteer_dev?socketPath=/tmp/mysql.sock
```

---

## Quick Reference Commands

```bash
# Install everything
brew install node@22
npm install -g pnpm
brew install mysql
brew services start mysql

# Project setup
cd xianghai_volunteer_record
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev

# Open app
open http://localhost:5173
```

---

## Troubleshooting macOS-Specific Issues

### Issue: "command not found: pnpm"

**Solution**:
```bash
# Install pnpm globally
npm install -g pnpm

# Or use npx
npx pnpm install
```

### Issue: "MySQL connection refused"

**Solution**:
```bash
# Check if MySQL is running
brew services list

# Start MySQL if stopped
brew services start mysql

# Or restart it
brew services restart mysql
```

### Issue: "Port 3000 already in use"

**Solution**:
```bash
# Find process using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>
```

### Issue: "Cannot find module" errors

**Solution**:
```bash
# Clean install
rm -rf node_modules
pnpm install
```

### Issue: Permission denied on /usr/local

**Solution**:
```bash
# Fix Homebrew permissions
sudo chown -R $(whoami) /usr/local/bin /usr/local/lib
```

---

## Using Docker MySQL (Easiest)

If you don't want to install MySQL natively:

```bash
# Install Docker Desktop for Mac
# Download from: https://docker.com

# Start MySQL container
docker run -d \
  --name temple-mysql \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=temple_volunteer_dev \
  -p 3306:3306 \
  mysql:8.0

# Use this in .env
DATABASE_URL=mysql://root:password@localhost:3306/temple_volunteer_dev

# Manage container
docker start temple-mysql    # Start
docker stop temple-mysql     # Stop
docker ps                    # Check status
```

---

## Development Workflow (Daily Use)

### Start Working
```bash
# 1. Start database (if using Docker)
docker start temple-mysql

# 2. Start dev server
pnpm dev

# 3. Open browser
open http://localhost:5173
```

### Stop Working
```bash
# 1. Stop dev server (Ctrl+C in terminal)

# 2. Stop database (if using Docker)
docker stop temple-mysql
```

---

## Useful macOS Shortcuts

```bash
# Open project in VS Code
code .

# Open project folder in Finder
open .

# View logs in real-time
pnpm dev | tee dev.log

# Run in background
pnpm dev &
```

---

## Hardware Recommendations

### Minimum (Will Work)
- macOS 12+
- 8GB RAM
- 10GB free disk space

### Recommended (Better Performance)
- macOS 13+
- 16GB RAM
- 20GB free disk space
- SSD (not HDD)

---

## Complete Setup Script

Copy and paste this entire script to set everything up:

```bash
#!/bin/bash
# macOS Temple Volunteer System Setup

echo "🍎 Setting up Temple Volunteer Management System on macOS..."

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Install Node.js
echo "Installing Node.js 22..."
brew install node@22

# Install pnpm
echo "Installing pnpm..."
npm install -g pnpm

# Install MySQL (optional, comment out if using Docker)
# echo "Installing MySQL..."
# brew install mysql
# brew services start mysql

# Install project dependencies
echo "Installing project dependencies..."
pnpm install

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Set up MySQL database (see macOS_SETUP.md)"
echo "2. Run: pnpm db:migrate"
echo "3. Run: pnpm db:seed"
echo "4. Run: pnpm dev"
echo "5. Open: http://localhost:5173"
```

Save as `setup-macos.sh` and run:
```bash
chmod +x setup-macos.sh
./setup-macos.sh
```

---

## Summary: What's Different on macOS

✅ **No Changes**: Code works the same
✅ **Package.json**: Same file, no changes needed
✅ **Different**: Installation commands (use `brew` instead of `apt`)
✅ **Different**: MySQL location (use Homebrew or Docker)
✅ **Same**: All `pnpm` commands work identically

**The package.json I created works perfectly on macOS!** You just need to use macOS-specific tools (Homebrew, Docker Desktop) to install prerequisites.

---

**Ready to start? Run these commands:**

```bash
# 1. Install Node.js and pnpm
brew install node@22
npm install -g pnpm

# 2. Install dependencies
pnpm install

# 3. Set up database (Docker - easiest)
docker run -d --name temple-mysql \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=temple_volunteer_dev \
  -p 3306:3306 mysql:8.0

# 4. Create tables
pnpm db:migrate

# 5. Add sample data
pnpm db:seed

# 6. Start server
pnpm dev

# 7. Open in browser
open http://localhost:5173
```

**Total time**: 10-15 minutes ⏱️
