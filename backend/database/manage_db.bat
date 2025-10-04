@echo off
REM EXPAIR Database Management Script for Windows
REM This script helps with common database operations

setlocal enabledelayedexpansion

REM Database configuration
set DB_HOST=localhost
set DB_USER=postgres
set DB_NAME=expair_db
set DB_PASSWORD=admin

REM Function to print colored output (simplified for Windows)
:print_status
echo [INFO] %~1
goto :eof

:print_warning
echo [WARNING] %~1
goto :eof

:print_error
echo [ERROR] %~1
goto :eof

:print_header
echo ================================
echo %~1
echo ================================
goto :eof

REM Function to check if PostgreSQL is running
:check_postgres
call :print_status "Checking PostgreSQL connection..."
set PGPASSWORD=%DB_PASSWORD%
pg_isready -h %DB_HOST% -p 5432 -U %DB_USER% >nul 2>&1
if %errorlevel% equ 0 (
    call :print_status "PostgreSQL is running and accessible"
    set PGPASSWORD=
    exit /b 0
) else (
    call :print_error "PostgreSQL is not running or not accessible"
    call :print_warning "Please start PostgreSQL service and try again"
    set PGPASSWORD=
    exit /b 1
)

REM Function to backup database
:backup_database
call :print_header "BACKING UP DATABASE"

call :check_postgres
if %errorlevel% neq 0 exit /b 1

REM Create timestamp
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "timestamp=%YYYY%%MM%%DD%_%HH%%Min%%Sec%"

set BACKUP_FILE=database\backups\expair_backup_%timestamp%.sql

REM Create backups directory if it doesn't exist
if not exist "database\backups" mkdir "database\backups"

call :print_status "Creating backup: %BACKUP_FILE%"

REM Set password environment variable
set PGPASSWORD=%DB_PASSWORD%

pg_dump -h %DB_HOST% -U %DB_USER% -d %DB_NAME% > "%BACKUP_FILE%"
if %errorlevel% equ 0 (
    call :print_status "Backup completed successfully!"
    call :print_status "Backup file: %BACKUP_FILE%"
    
    REM Show file size
    for %%A in ("%BACKUP_FILE%") do call :print_status "Backup size: %%~zA bytes"
) else (
    call :print_error "Backup failed!"
    set PGPASSWORD=
    exit /b 1
)

set PGPASSWORD=
goto :eof

REM Function to restore database
:restore_database
call :print_header "RESTORING DATABASE"

call :check_postgres
if %errorlevel% neq 0 exit /b 1

REM List available backup files
if exist "database\backups" (
    call :print_status "Available backup files:"
    dir /b database\backups\*.sql 2>nul || call :print_warning "No backup files found"
)

set /p BACKUP_FILE="Enter backup file path: "

if not exist "%BACKUP_FILE%" (
    call :print_error "Backup file not found: %BACKUP_FILE%"
    exit /b 1
)

call :print_warning "This will overwrite the current database!"
set /p CONFIRM="Are you sure? (y/N): "

if /i "%CONFIRM%"=="y" (
    call :print_status "Restoring from: %BACKUP_FILE%"
    
    REM Set password environment variable
    set PGPASSWORD=%DB_PASSWORD%
    
    psql -h %DB_HOST% -U %DB_USER% -d %DB_NAME% < "%BACKUP_FILE%"
    if %errorlevel% equ 0 (
        call :print_status "Restore completed successfully!"
    ) else (
        call :print_error "Restore failed!"
        set PGPASSWORD=
        exit /b 1
    )
    
    set PGPASSWORD=
) else (
    call :print_status "Restore cancelled"
)
goto :eof

REM Function to create fresh database from SQL files
:create_fresh_database
call :print_header "CREATING FRESH DATABASE"

call :check_postgres
if %errorlevel% neq 0 exit /b 1

REM Create timestamp for new database name
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "timestamp=%YYYY%%MM%%DD%_%HH%%Min%%Sec%"

set NEW_DB_NAME=expair_fresh_%timestamp%

call :print_warning "This will create a new database: %NEW_DB_NAME%"
set /p CONFIRM="Continue? (y/N): "

if /i "%CONFIRM%"=="y" (
    REM Set password environment variable
    set PGPASSWORD=%DB_PASSWORD%
    
    REM Create database
    call :print_status "Creating database: %NEW_DB_NAME%"
    createdb -h %DB_HOST% -U %DB_USER% %NEW_DB_NAME%
    if %errorlevel% equ 0 (
        call :print_status "Database created successfully!"
    ) else (
        call :print_error "Failed to create database"
        set PGPASSWORD=
        exit /b 1
    )
    
    REM Run schema
    call :print_status "Creating database schema..."
    psql -h %DB_HOST% -U %DB_USER% -d %NEW_DB_NAME% < database\sql\01_schema.sql
    if %errorlevel% equ 0 (
        call :print_status "Schema created successfully!"
    ) else (
        call :print_error "Failed to create schema"
        set PGPASSWORD=
        exit /b 1
    )
    
    REM Run initial data
    call :print_status "Loading initial data..."
    psql -h %DB_HOST% -U %DB_USER% -d %NEW_DB_NAME% < database\sql\02_initial_data.sql
    if %errorlevel% equ 0 (
        call :print_status "Initial data loaded successfully!"
    ) else (
        call :print_error "Failed to load initial data"
        set PGPASSWORD=
        exit /b 1
    )
    
    call :print_status "Fresh database created: %NEW_DB_NAME%"
    set PGPASSWORD=
) else (
    call :print_status "Operation cancelled"
)
goto :eof

REM Function to show database info
:show_database_info
call :print_header "DATABASE INFORMATION"

call :check_postgres
if %errorlevel% neq 0 exit /b 1

REM Set password environment variable
set PGPASSWORD=%DB_PASSWORD%

call :print_status "Database: %DB_NAME%"
call :print_status "Host: %DB_HOST%"
call :print_status "User: %DB_USER%"

REM Get database size
for /f %%i in ('psql -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -t -c "SELECT pg_size_pretty(pg_database_size('%DB_NAME%'));"') do set DB_SIZE=%%i
call :print_status "Database size: %DB_SIZE%"

REM Get table count
for /f %%i in ('psql -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"') do set TABLE_COUNT=%%i
call :print_status "Number of tables: %TABLE_COUNT%"

REM Get user count (with error handling)
for /f %%i in ('psql -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -t -c "SELECT COUNT(*) FROM users_tbl;" 2^>nul') do set USER_COUNT=%%i
if "%USER_COUNT%"=="" set USER_COUNT=0
call :print_status "Number of users: %USER_COUNT%"

REM Get skills count (with error handling)
for /f %%i in ('psql -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -t -c "SELECT COUNT(*) FROM genskills_tbl;" 2^>nul') do set SKILLS_COUNT=%%i
if "%SKILLS_COUNT%"=="" set SKILLS_COUNT=0
call :print_status "Number of general skills: %SKILLS_COUNT%"

set PGPASSWORD=
goto :eof

REM Function to show help
:show_help
call :print_header "EXPAIR DATABASE MANAGEMENT SCRIPT"
echo Usage: %0 [COMMAND]
echo.
echo Commands:
echo   backup     - Create a backup of the database
echo   restore    - Restore database from backup file
echo   fresh      - Create a fresh database from SQL files
echo   info       - Show database information
echo   help       - Show this help message
echo.
echo Examples:
echo   %0 backup
echo   %0 restore
echo   %0 fresh
echo   %0 info
goto :eof

REM Main script logic
if "%1"=="backup" (
    call :backup_database
) else if "%1"=="restore" (
    call :restore_database
) else if "%1"=="fresh" (
    call :create_fresh_database
) else if "%1"=="info" (
    call :show_database_info
) else if "%1"=="help" (
    call :show_help
) else if "%1"=="--help" (
    call :show_help
) else if "%1"=="-h" (
    call :show_help
) else if "%1"=="" (
    call :show_help
) else (
    call :print_error "Unknown command: %1"
    call :show_help
    exit /b 1
)

endlocal
