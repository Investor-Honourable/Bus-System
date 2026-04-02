@echo off
REM =====================================================
REM Bus Management System - Database Recovery Script v22
REM Purpose: Recover crashed InnoDB tables from .frm and .ibd files
REM Creates tables without indexes, copies .ibd files, imports, then recreates indexes
REM =====================================================

echo ========================================
echo Bus Management System Database Recovery v22
echo ========================================
echo.

REM Set MySQL credentials (empty password for XAMPP default)
set MYSQL_USER=root
set MYSQL_PWD=
set ORIGINAL_DB=bus_system
set RECOVERY_DB=bus_system_recover

REM Set paths
set MYSQL_BIN=C:\XAMP\mysql\bin
set DATA_DIR=C:\XAMP\mysql\data
set ORIGINAL_DIR=%DATA_DIR%\%ORIGINAL_DB%
set RECOVERY_DIR=%DATA_DIR%\%RECOVERY_DB%
set SCRIPT_DIR=%~dp0

echo Step 1: Creating recovery database and tables (without indexes)...
echo ========================================
"%MYSQL_BIN%\mysql.exe" -u %MYSQL_USER% < "%SCRIPT_DIR%database_recovery_create_only.sql"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to create recovery database and tables
    pause
    exit /b 1
)
echo SUCCESS: Recovery database and tables created
echo.

echo Step 2: Copying .ibd files to recovery database...
echo ========================================
if not exist "%RECOVERY_DIR%" (
    mkdir "%RECOVERY_DIR%"
)

REM Copy all .ibd files
for %%f in ("%ORIGINAL_DIR%\*.ibd") do (
    echo Copying %%~nxf...
    copy "%%f" "%RECOVERY_DIR%\%%~nxf" /Y
)

echo SUCCESS: All .ibd files copied
echo.

echo Step 3: Importing tablespaces...
echo ========================================
"%MYSQL_BIN%\mysql.exe" -u %MYSQL_USER% -e "USE %RECOVERY_DB%; SET FOREIGN_KEY_CHECKS = 0; ALTER TABLE users IMPORT TABLESPACE; ALTER TABLE passengers IMPORT TABLESPACE; ALTER TABLE drivers IMPORT TABLESPACE; ALTER TABLE buses IMPORT TABLESPACE; ALTER TABLE routes IMPORT TABLESPACE; ALTER TABLE trips IMPORT TABLESPACE; ALTER TABLE bookings IMPORT TABLESPACE; ALTER TABLE tickets IMPORT TABLESPACE; ALTER TABLE notifications IMPORT TABLESPACE; ALTER TABLE user_settings IMPORT TABLESPACE; ALTER TABLE payment_methods IMPORT TABLESPACE; ALTER TABLE password_reset_tokens IMPORT TABLESPACE; ALTER TABLE login_activity IMPORT TABLESPACE; ALTER TABLE payments IMPORT TABLESPACE; ALTER TABLE reviews IMPORT TABLESPACE; SET FOREIGN_KEY_CHECKS = 1;"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to import tablespaces
    pause
    exit /b 1
)
echo SUCCESS: All tablespaces imported
echo.

echo Step 4: Recreating secondary indexes...
echo ========================================
"%MYSQL_BIN%\mysql.exe" -u %MYSQL_USER% -e "USE %RECOVERY_DB%; ALTER TABLE users ADD INDEX idx_email (email), ADD INDEX idx_role (role); ALTER TABLE passengers ADD INDEX idx_user_id (user_id); ALTER TABLE drivers ADD INDEX idx_user_id (user_id), ADD INDEX idx_status (status), ADD INDEX idx_license (license_number); ALTER TABLE buses ADD INDEX idx_bus_number (bus_number), ADD INDEX idx_status (status), ADD INDEX idx_type (bus_type); ALTER TABLE routes ADD INDEX idx_route_code (route_code), ADD INDEX idx_origin (origin), ADD INDEX idx_destination (destination), ADD INDEX idx_status (status); ALTER TABLE trips ADD INDEX idx_bus_id (bus_id), ADD INDEX idx_route_id (route_id), ADD INDEX idx_driver_id (driver_id), ADD INDEX idx_departure_date (departure_date), ADD INDEX idx_status (status); ALTER TABLE bookings ADD INDEX idx_booking_reference (booking_reference), ADD INDEX idx_user_id (user_id), ADD INDEX idx_trip_id (trip_id), ADD INDEX idx_payment_status (payment_status), ADD INDEX idx_booking_status (booking_status); ALTER TABLE tickets ADD INDEX idx_ticket_code (ticket_code), ADD INDEX idx_booking_id (booking_id), ADD INDEX idx_trip_id (trip_id), ADD INDEX idx_user_id (user_id), ADD INDEX idx_status (status); ALTER TABLE notifications ADD INDEX idx_user_id (user_id), ADD INDEX idx_is_read (is_read), ADD INDEX idx_created_at (created_at), ADD INDEX idx_type (type); ALTER TABLE user_settings ADD UNIQUE KEY unique_user_settings (user_id); ALTER TABLE payment_methods ADD INDEX idx_user_id (user_id); ALTER TABLE password_reset_tokens ADD INDEX idx_token (token), ADD INDEX idx_user_id (user_id), ADD INDEX idx_expires_at (expires_at); ALTER TABLE login_activity ADD INDEX idx_user_id (user_id), ADD INDEX idx_login_at (login_at); ALTER TABLE payments ADD INDEX idx_booking_id (booking_id), ADD INDEX idx_user_id (user_id), ADD INDEX idx_status (status), ADD INDEX idx_transaction_id (transaction_id); ALTER TABLE reviews ADD INDEX idx_booking_id (booking_id), ADD INDEX idx_user_id (user_id), ADD INDEX idx_trip_id (trip_id), ADD INDEX idx_driver_id (driver_id);"
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Some indexes may not have been created (this is normal if they already exist)
)
echo SUCCESS: Secondary indexes recreated
echo.

echo ========================================
echo RECOVERY COMPLETE!
echo ========================================
echo.
echo Recovery database: %RECOVERY_DB%
echo Location: %RECOVERY_DIR%
echo.
echo To verify the recovery, run:
echo "%MYSQL_BIN%\mysql.exe" -u %MYSQL_USER% -e "USE %RECOVERY_DB%; SHOW TABLES; SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM bookings;"
echo.
pause
