#!/bin/bash
# EXPAIR Database Management Script
# This script helps with common database operations

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database configuration
DB_HOST="localhost"
DB_USER="postgres"
DB_NAME="expair_db"
DB_PASSWORD="admin"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE} $1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Function to check if PostgreSQL is running
check_postgres() {
    print_status "Checking PostgreSQL connection..."
    if pg_isready -h $DB_HOST -p 5432 -U $DB_USER > /dev/null 2>&1; then
        print_status "PostgreSQL is running and accessible"
        return 0
    else
        print_error "PostgreSQL is not running or not accessible"
        print_warning "Please start PostgreSQL service and try again"
        return 1
    fi
}

# Function to backup database
backup_database() {
    print_header "BACKING UP DATABASE"
    
    if ! check_postgres; then
        exit 1
    fi
    
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="database/backups/expair_backup_${TIMESTAMP}.sql"
    
    # Create backups directory if it doesn't exist
    mkdir -p database/backups
    
    print_status "Creating backup: $BACKUP_FILE"
    
    # Set password environment variable
    export PGPASSWORD=$DB_PASSWORD
    
    if pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > $BACKUP_FILE; then
        print_status "Backup completed successfully!"
        print_status "Backup file: $BACKUP_FILE"
        
        # Show file size
        FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        print_status "Backup size: $FILE_SIZE"
    else
        print_error "Backup failed!"
        exit 1
    fi
    
    unset PGPASSWORD
}

# Function to restore database
restore_database() {
    print_header "RESTORING DATABASE"
    
    if ! check_postgres; then
        exit 1
    fi
    
    # List available backup files
    if [ -d "database/backups" ]; then
        print_status "Available backup files:"
        ls -la database/backups/*.sql 2>/dev/null || print_warning "No backup files found"
    fi
    
    read -p "Enter backup file path: " BACKUP_FILE
    
    if [ ! -f "$BACKUP_FILE" ]; then
        print_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi
    
    print_warning "This will overwrite the current database!"
    read -p "Are you sure? (y/N): " CONFIRM
    
    if [[ $CONFIRM =~ ^[Yy]$ ]]; then
        print_status "Restoring from: $BACKUP_FILE"
        
        # Set password environment variable
        export PGPASSWORD=$DB_PASSWORD
        
        if psql -h $DB_HOST -U $DB_USER -d $DB_NAME < $BACKUP_FILE; then
            print_status "Restore completed successfully!"
        else
            print_error "Restore failed!"
            exit 1
        fi
        
        unset PGPASSWORD
    else
        print_status "Restore cancelled"
    fi
}

# Function to create fresh database from SQL files
create_fresh_database() {
    print_header "CREATING FRESH DATABASE"
    
    if ! check_postgres; then
        exit 1
    fi
    
    NEW_DB_NAME="expair_fresh_$(date +"%Y%m%d_%H%M%S")"
    
    print_warning "This will create a new database: $NEW_DB_NAME"
    read -p "Continue? (y/N): " CONFIRM
    
    if [[ $CONFIRM =~ ^[Yy]$ ]]; then
        # Set password environment variable
        export PGPASSWORD=$DB_PASSWORD
        
        # Create database
        print_status "Creating database: $NEW_DB_NAME"
        if createdb -h $DB_HOST -U $DB_USER $NEW_DB_NAME; then
            print_status "Database created successfully!"
        else
            print_error "Failed to create database"
            exit 1
        fi
        
        # Run schema
        print_status "Creating database schema..."
        if psql -h $DB_HOST -U $DB_USER -d $NEW_DB_NAME < database/sql/01_schema.sql; then
            print_status "Schema created successfully!"
        else
            print_error "Failed to create schema"
            exit 1
        fi
        
        # Run initial data
        print_status "Loading initial data..."
        if psql -h $DB_HOST -U $DB_USER -d $NEW_DB_NAME < database/sql/02_initial_data.sql; then
            print_status "Initial data loaded successfully!"
        else
            print_error "Failed to load initial data"
            exit 1
        fi
        
        print_status "Fresh database created: $NEW_DB_NAME"
        unset PGPASSWORD
    else
        print_status "Operation cancelled"
    fi
}

# Function to show database info
show_database_info() {
    print_header "DATABASE INFORMATION"
    
    if ! check_postgres; then
        exit 1
    fi
    
    # Set password environment variable
    export PGPASSWORD=$DB_PASSWORD
    
    print_status "Database: $DB_NAME"
    print_status "Host: $DB_HOST"
    print_status "User: $DB_USER"
    
    # Get database size
    DB_SIZE=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" | xargs)
    print_status "Database size: $DB_SIZE"
    
    # Get table count
    TABLE_COUNT=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
    print_status "Number of tables: $TABLE_COUNT"
    
    # Get user count
    USER_COUNT=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users_tbl;" 2>/dev/null | xargs || echo "0")
    print_status "Number of users: $USER_COUNT"
    
    # Get skills count
    SKILLS_COUNT=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM genskills_tbl;" 2>/dev/null | xargs || echo "0")
    print_status "Number of general skills: $SKILLS_COUNT"
    
    unset PGPASSWORD
}

# Function to show help
show_help() {
    print_header "EXPAIR DATABASE MANAGEMENT SCRIPT"
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  backup     - Create a backup of the database"
    echo "  restore    - Restore database from backup file"
    echo "  fresh      - Create a fresh database from SQL files"
    echo "  info       - Show database information"
    echo "  help       - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 backup"
    echo "  $0 restore"
    echo "  $0 fresh"
    echo "  $0 info"
}

# Main script logic
case "$1" in
    "backup")
        backup_database
        ;;
    "restore")
        restore_database
        ;;
    "fresh")
        create_fresh_database
        ;;
    "info")
        show_database_info
        ;;
    "help"|"--help"|"-h"|"")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
