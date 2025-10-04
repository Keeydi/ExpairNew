# EXPAIR Database Export Guide for pgAdmin

This guide will walk you through exporting your ExPair database for use with pgAdmin, both for backup purposes and for setting up a new database instance.

## Prerequisites

- PostgreSQL server running (local or remote)
- pgAdmin installed on your system
- Access to your ExPair database
- Basic knowledge of SQL and database concepts

## Method 1: Using pgAdmin GUI (Recommended for Beginners)

### Step 1: Connect to Your Database in pgAdmin

1. **Open pgAdmin** and connect to your PostgreSQL server
2. **Navigate to your database** (`expair_db` based on your settings)
3. **Right-click on your database** in the left panel
4. **Select "Backup..."** from the context menu

### Step 2: Configure Backup Settings

1. **Filename**: Choose where to save your backup file (e.g., `expair_backup.sql`)
2. **Format**: Select "Plain" for SQL format or "Custom" for compressed backup
3. **Encoding**: Leave as default (UTF8)
4. **Role name**: Leave blank (uses current user)

### Step 3: Advanced Options (Important!)

1. **Click "Advanced" tab**
2. **Select these options**:
   - ✅ **"Data"** - Include table data
   - ✅ **"Schema"** - Include table structure
   - ✅ **"Blobs"** - Include binary data (images, files)
   - ✅ **"Privilege"** - Include user permissions
   - ✅ **"Owner"** - Include ownership information
   - ✅ **"Tablespace"** - Include tablespace information

3. **Uncheck these options**:
   - ❌ **"Only schema"** - We want data too
   - ❌ **"Only data"** - We want schema too

### Step 4: Execute Backup

1. **Click "Backup"** button
2. **Wait for completion** - pgAdmin will show progress
3. **Check the log** for any errors
4. **Your backup file is ready!**

## Method 2: Using Command Line (Advanced Users)

### Step 1: Open Command Prompt/Terminal

Navigate to your PostgreSQL bin directory or ensure `pg_dump` is in your PATH.

### Step 2: Export Database Schema and Data

```bash
# Export everything (schema + data)
pg_dump -h localhost -U postgres -d expair_db > expair_complete_backup.sql

# Export only schema (structure)
pg_dump -h localhost -U postgres -d expair_db --schema-only > expair_schema_only.sql

# Export only data (no structure)
pg_dump -h localhost -U postgres -d expair_db --data-only > expair_data_only.sql

# Export with custom format (compressed)
pg_dump -h localhost -U postgres -d expair_db -Fc > expair_backup.dump
```

### Step 3: Export Specific Tables (Optional)

```bash
# Export specific tables only
pg_dump -h localhost -U postgres -d expair_db -t users_tbl -t genskills_tbl > specific_tables.sql
```

## Method 3: Using Django Management Commands

### Step 1: Navigate to Backend Directory

```bash
cd backend
```

### Step 2: Export Database Schema

```bash
# Generate SQL for all migrations
python manage.py sqlmigrate accounts 0001 > database/sql/03_django_migrations.sql

# Or dump the entire database
python manage.py dumpdata --natural-foreign --natural-primary > database/sql/04_django_data.json
```

## Importing Database into pgAdmin

### Method 1: Using pgAdmin GUI

1. **Create a new database** in pgAdmin
2. **Right-click on the new database**
3. **Select "Restore..."**
4. **Choose your backup file**
5. **Click "Restore"**

### Method 2: Using Command Line

```bash
# Restore from SQL file
psql -h localhost -U postgres -d new_database_name < expair_backup.sql

# Restore from custom format
pg_restore -h localhost -U postgres -d new_database_name expair_backup.dump
```

## Setting Up Fresh Database with Our SQL Files

### Step 1: Create New Database

```sql
-- In pgAdmin Query Tool or psql
CREATE DATABASE expair_new_db;
```

### Step 2: Run Our SQL Files in Order

1. **Run schema file**:
   ```bash
   psql -h localhost -U postgres -d expair_new_db < backend/database/sql/01_schema.sql
   ```

2. **Run initial data file**:
   ```bash
   psql -h localhost -U postgres -d expair_new_db < backend/database/sql/02_initial_data.sql
   ```

### Step 3: Verify Setup

```sql
-- Check tables were created
\dt

-- Check data was inserted
SELECT COUNT(*) FROM genskills_tbl;
SELECT COUNT(*) FROM specskills_tbl;

-- Check specific data
SELECT * FROM genskills_tbl LIMIT 5;
```

## Troubleshooting Common Issues

### Issue 1: Permission Denied
**Solution**: Ensure your PostgreSQL user has proper permissions:
```sql
GRANT ALL PRIVILEGES ON DATABASE expair_db TO your_username;
```

### Issue 2: Connection Refused
**Solution**: Check PostgreSQL service is running:
```bash
# Windows
net start postgresql-x64-14

# Linux/Mac
sudo systemctl start postgresql
```

### Issue 3: Database Not Found
**Solution**: Create the database first:
```sql
CREATE DATABASE expair_db;
```

### Issue 4: Large File Size
**Solution**: Use compressed format:
```bash
pg_dump -h localhost -U postgres -d expair_db -Fc -Z 9 > expair_compressed.dump
```

## Best Practices

1. **Regular Backups**: Schedule automatic backups
2. **Test Restores**: Periodically test your backup files
3. **Version Control**: Keep SQL files in version control
4. **Documentation**: Document your database structure
5. **Security**: Secure your backup files

## File Organization

```
backend/database/
├── sql/
│   ├── 01_schema.sql          # Complete database structure
│   ├── 02_initial_data.sql    # Skills and categories data
│   ├── 03_django_migrations.sql # Django-specific migrations
│   └── 04_django_data.json    # Django data dump
├── backups/
│   ├── expair_backup_YYYYMMDD.sql
│   └── expair_backup_YYYYMMDD.dump
└── README.md                  # This file
```

## Quick Commands Reference

```bash
# Export everything
pg_dump -h localhost -U postgres -d expair_db > backup.sql

# Import everything
psql -h localhost -U postgres -d new_db < backup.sql

# Export specific tables
pg_dump -h localhost -U postgres -d expair_db -t users_tbl -t genskills_tbl > tables.sql

# Check database size
SELECT pg_size_pretty(pg_database_size('expair_db'));

# List all tables
\dt

# Describe table structure
\d users_tbl
```

## Next Steps

1. **Set up automated backups** using cron jobs or Windows Task Scheduler
2. **Create development and production database configurations**
3. **Implement database migration strategies** for updates
4. **Set up monitoring** for database performance

---

**Note**: Always test your backup and restore procedures in a development environment before relying on them in production!
