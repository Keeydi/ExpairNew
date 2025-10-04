# EXPAIR Database Setup Summary

## What We've Created

### 📁 Database Folder Structure
```
backend/database/
├── sql/
│   ├── 01_schema.sql          # Complete database structure
│   └── 02_initial_data.sql    # Skills and categories data
├── backups/                   # Directory for backup files
├── manage_db.sh              # Linux/Mac database management script
├── manage_db.bat             # Windows database management script
└── README.md                 # Comprehensive guide
```

### 📄 SQL Files Created

#### 1. `01_schema.sql` - Complete Database Schema
- **15 tables** with proper relationships
- **Indexes** for performance optimization
- **Comments** for documentation
- **Constraints** and **foreign keys**
- **PostgreSQL-specific** features (JSONB, SERIAL, etc.)

#### 2. `02_initial_data.sql` - Initial Data
- **15 general skill categories**
- **75 specialized skills** across all categories
- **Sample data** for testing
- **Verification queries** included

### 🛠️ Management Scripts

#### Linux/Mac: `manage_db.sh`
```bash
# Make executable
chmod +x database/manage_db.sh

# Usage examples
./database/manage_db.sh backup
./database/manage_db.sh restore
./database/manage_db.sh fresh
./database/manage_db.sh info
```

#### Windows: `manage_db.bat`
```cmd
# Usage examples
database\manage_db.bat backup
database\manage_db.bat restore
database\manage_db.bat fresh
database\manage_db.bat info
```

## 🚀 Quick Start Guide

### Option 1: Use Our SQL Files (Recommended)
1. **Create new database** in pgAdmin
2. **Run schema file**: `01_schema.sql`
3. **Run data file**: `02_initial_data.sql`
4. **Verify setup** with verification queries

### Option 2: Export from Existing Database
1. **Use pgAdmin GUI** (easiest for beginners)
2. **Right-click database** → Backup
3. **Select all options** (Data, Schema, Blobs, etc.)
4. **Save backup file**

### Option 3: Use Management Scripts
1. **Run backup**: `./manage_db.sh backup`
2. **Create fresh DB**: `./manage_db.sh fresh`
3. **Check info**: `./manage_db.sh info`

## 📊 Database Schema Overview

### Core Tables
- **`users_tbl`** - User accounts and profiles
- **`genskills_tbl`** - General skill categories
- **`specskills_tbl`** - Specialized skills
- **`tradereq_tbl`** - Trade requests
- **`trade_details_tbl`** - Detailed trade information

### Supporting Tables
- **`evaluation_tbl`** - AI evaluations
- **`trade_interests_tbl`** - User interests
- **`tradehis_tbl`** - Trade history
- **`repsys_tbl`** - Reputation system
- **`conversations_tbl`** - Messaging system
- **`messages_tbl`** - Individual messages

### Utility Tables
- **`password_reset_token_tbl`** - Password reset tokens
- **`userinterests_tbl`** - User skill interests
- **`userskills_tbl`** - User skill assignments
- **`usercredentials_tbl`** - User credentials

## 🔧 Configuration

### Database Settings (from your `settings.py`)
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'expair_db',
        'USER': 'postgres', 
        'PASSWORD': 'admin',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

### Script Configuration
Update these variables in the management scripts:
- `DB_HOST="localhost"`
- `DB_USER="postgres"`
- `DB_NAME="expair_db"`
- `DB_PASSWORD="admin"`

## 📋 Next Steps

1. **Test the setup** with a fresh database
2. **Customize the scripts** for your environment
3. **Set up automated backups**
4. **Create development/staging databases**
5. **Document any custom modifications**

## 🆘 Troubleshooting

### Common Issues
- **Permission denied**: Check PostgreSQL user permissions
- **Connection refused**: Ensure PostgreSQL service is running
- **Database not found**: Create database first
- **Large file size**: Use compressed backup format

### Getting Help
- Check the `README.md` for detailed instructions
- Use the management scripts for common operations
- Verify your PostgreSQL installation and configuration

## 📈 Performance Tips

1. **Use indexes** (already included in schema)
2. **Regular maintenance** with VACUUM and ANALYZE
3. **Monitor database size** and performance
4. **Set up connection pooling** for production
5. **Regular backups** and test restores

---

**🎉 You now have a complete database setup for ExPair!**

Choose the method that works best for you:
- **Beginners**: Use pgAdmin GUI
- **Developers**: Use our SQL files
- **Power users**: Use the management scripts
