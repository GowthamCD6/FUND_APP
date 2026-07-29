# FundApp Backend - Database Setup & Auto-Reconnection Guide

## Problem Solved
✅ **Database schema now persists** - Even after closing MySQL or restarting your computer, the database will be available the next day automatically.

## Why This Works
- Once the database schema is **created in MySQL**, it **persists permanently** in MySQL's data files
- When MySQL restarts, the database is automatically available
- The backend automatically reconnects to it

## Setup Instructions (ONE TIME ONLY)

### Step 1: Run the Setup Script
**Double-click this file:**
```
SETUP_DATABASE_ADMIN.bat
```

This will:
1. ✅ Request admin privileges (necessary to start MySQL service)
2. ✅ Start MySQL92 service
3. ✅ Create all database tables and schema
4. ✅ Verify everything is working

**Expected Output:**
```
╔════════════════════════════════════════════════════╗
║     FundApp - Complete Setup                       ║
║     Running with ADMIN privileges                 ║
╚════════════════════════════════════════════════════╝

📍 Step 1: Starting MySQL Service...
✅ MySQL92 service started successfully

📍 Step 2: Creating Database Schema...
  ✅ CREATE: fundapp
  ✅ CREATE: users
  ✅ CREATE: groups
  ... (more tables)
  
✅ Complete! Database schema is now created and will persist
```

### Step 2: Start the Backend
Open **PowerShell** or **CMD** and run:
```powershell
cd Backend
node server.js
```

You should see:
```
✅ Connected to MySQL database: fundapp@localhost:3306
✅ Server running on http://localhost:5000
```

### Step 3: Test Login
Open your mobile app and test the login - it should now work!

---

## Daily Usage (After Setup)

### What happens when you restart your computer?
1. ✅ **Database persists automatically** - MySQL files contain your data
2. ✅ **MySQL auto-starts** (or you can start it manually)
3. ✅ **Just run** `node server.js` and it connects

### To Start the Backend Each Day:
```powershell
cd Backend
node server.js
```

---

## If MySQL Doesn't Start Automatically

**Option 1: Start it manually**
1. Open **Services** (Windows key → type "services")
2. Find **MySQL92**
3. Right-click → **Start**

**Option 2: Use a PowerShell command**
```powershell
Start-Service MySQL92
```

**Option 3: Make MySQL auto-start**
```powershell
Set-Service MySQL92 -StartupType Automatic
```

---

## Troubleshooting

### "Database not found" error when starting backend?
**Solution:** Run `SETUP_DATABASE_ADMIN.bat` again to recreate it.

### "Cannot connect to MySQL" error?
1. Check if MySQL is running: `Get-Service MySQL92 | Select-Object Status`
2. If stopped, start it: `net start MySQL92` (as admin)
3. Try again

### Schema disappeared after restart?
This shouldn't happen! But if it does:
1. Run `SETUP_DATABASE_ADMIN.bat` again
2. The schema will be recreated (won't affect existing data if any)

---

## How Database Persistence Works

```
First Day:
  1. Run SETUP_DATABASE_ADMIN.bat
  2. Schema created in MySQL
  3. ✅ Database persists in MySQL files

Day 2+:
  1. MySQL service starts (auto or manually)
  2. Database is automatically loaded from files
  3. Backend connects: ✅ Connected to fundapp
  4. App works normally
```

---

## Files in This Setup

| File | Purpose |
|------|---------|
| `SETUP_DATABASE_ADMIN.bat` | **Main setup file - run this first** |
| `setup-database.js` | Creates tables in MySQL |
| `CREATE_FUNDAPP_DATABASE.sql` | Complete schema definition |
| `src/config/db.js` | Database connection pooling |
| `src/utils/dbHealthCheck.js` | Verifies database on startup |

---

## Questions?

**What if I need to reset the database?**
- Delete all data: Run `SETUP_DATABASE_ADMIN.bat` again
- It safely drops and recreates everything

**How do I know the database persisted?**
- After setup, open MySQL Workbench
- Connect to MySQL
- You should see a database named `fundapp` in the schema list
- It will be there even after restarting

---

**✅ Your database is now persistent and will work every day!**
