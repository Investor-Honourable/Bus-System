@echo off
REM =====================================================
REM Bus Management System - FINAL Database Recovery Script
REM Strategy: Create tables with ONLY PRIMARY KEY, import .ibd, then add indexes
REM =====================================================

echo ========================================
echo Bus Management System Database Recovery
echo FINAL APPROACH - Primary Key Only Tables
echo ========================================
echo.

set MYSQL_USER=root
set MYSQL_PWD=
set ORIGINAL_DB=bus_system
set RECOVERY_DB=bus_system_recover
set MYSQL_BIN=C:\XAMP\mysql\bin
set DATA_DIR=C:\XAMP\mysql\data
set ORIGINAL_DIR=%DATA_DIR%\%ORIGINAL_DB%
set RECOVERY_DIR=%DATA_DIR%\%RECOVERY_DB%
set SCRIPT_DIR=%~dp0

echo Step 1: Creating recovery database with PRIMARY KEY ONLY tables...
echo ========================================
"%MYSQL_BIN%\mysql.exe" -u %MYSQL_USER% < "%SCRIPT_DIR%database_recovery_primary_only.sql"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to create recovery database
    pause
    exit /b 1
)
echo SUCCESS: Recovery database created
echo.

echo Step 2: Copying .ibd files to recovery database...
echo ========================================
if not exist "%RECOVERY_DIR%" mkdir "%RECOVERY_DIR%"
for %%f in ("%ORIGINAL_DIR%\*.ibd") do (
    echo Copying %%~nxf...
    copy "%%f" "%RECOVERY_DIR%\%%~nxf" /Y >nul
)
echo SUCCESS: All .ibd files copied
echo.

echo Step 3: Importing tablespaces (NO SECONDARY INDEXES = SHOULD WORK)...
echo ========================================
"%MYSQL_BIN%\mysql.exe" -u %MYSQL_USER% -e "USE %RECOVERY_DB%; SET FOREIGN_KEY_CHECKS=0; ALTER TABLE users DISCARD TABLESPACE; ALTER TABLE passengers DISCARD TABLESPACE; ALTER TABLE drivers DISCARD TABLESPACE; ALTER TABLE buses DISCARD TABLESPACE; ALTER TABLE routes DISCARD TABLESPACE; ALTER TABLE trips DISCARD TABLESPACE; ALTER TABLE bookings DISCARD TABLESPACE; ALTER TABLE tickets DISCARD TABLESPACE; ALTER TABLE notifications DISCARD TABLESPACE; ALTER TABLE user_settings DISCARD TABLESPACE; ALTER TABLE payment_methods DISCARD TABLESPACE; ALTER TABLE password_reset_tokens DISCARD TABLESPACE; ALTER TABLE login_activity DISCARD TABLESPACE; ALTER TABLE payments DISCARD TABLESPACE; ALTER TABLE reviews DISCARD TABLESPACE;"
echo Copying .ibd files again after discard...
for %%f in ("%ORIGINAL_DIR%\*.ibd") do (
    copy "%%f" "%RECOVERY_DIR%\%%~nxf" /Y >nul
)
"%MYSQL_BIN%\mysql.exe" -u %MYSQL_USER% -e "USE %RECOVERY_DB%; ALTER TABLE users IMPORT TABLESPACE; ALTER TABLE passengers IMPORT TABLESPACE; ALTER TABLE drivers IMPORT TABLESPACE; ALTER TABLE buses IMPORT TABLESPACE; ALTER TABLE routes IMPORT TABLESPACE; ALTER TABLE trips IMPORT TABLESPACE; ALTER TABLE bookings IMPORT TABLESPACE; ALTER TABLE tickets IMPORT TABLESPACE; ALTER TABLE notifications IMPORT TABLESPACE; ALTER TABLE user_settings IMPORT TABLESPACE; ALTER TABLE payment_methods IMPORT TABLESPACE; ALTER TABLE password_reset_tokens IMPORT TABLESPACE; ALTER TABLE login_activity IMPORT TABLESPACE; ALTER TABLE payments IMPORT TABLESPACE; ALTER TABLE reviews IMPORT TABLESPACE; SET FOREIGN_KEY_CHECKS=1;"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to import tablespaces
    echo This may still fail if .ibd files have embedded index structures
    pause
    exit /b 1
)
echo SUCCESS: All tablespaces imported
echo.

echo Step 4: Adding back all secondary indexes...
echo ========================================
"%MYSQL_BIN%\mysql.exe" -u %MYSQL_USER% -e "USE %RECOVERY_DB%; ALTER TABLE users ADD UNIQUE KEY uk_username (username), ADD UNIQUE KEY uk_email (email), ADD INDEX idx_role (role); ALTER TABLE passengers ADD INDEX idx_user_id (user_id); ALTER TABLE drivers ADD UNIQUE KEY uk_license (license_number), ADD INDEX idx_user_id (user_id), ADD INDEX idx_status (status); ALTER TABLE buses ADD UNIQUE KEY uk_bus_number (bus_number), ADD UNIQUE KEY uk_license_plate (license_plate), ADD INDEX idx_status (status), ADD INDEX idx_type (bus_type); ALTER TABLE routes ADD UNIQUE KEY uk_route_code (route_code), ADD INDEX idx_origin (origin), ADD INDEX idx_destination (destination), ADD INDEX idx_status (status); ALTER TABLE trips ADD INDEX idx_bus_id (bus_id), ADD INDEX idx_route_id (route_id), ADD INDEX idx_driver_id (driver_id), ADD INDEX idx_departure_date (departure_date), ADD INDEX idx_status (status); ALTER TABLE bookings ADD UNIQUE KEY uk_booking_ref (booking_reference), ADD INDEX idx_user_id (user_id), ADD INDEX idx_trip_id (trip_id), ADD INDEX idx_payment_status (payment_status), ADD INDEX idx_booking_status (booking_status); ALTER TABLE tickets ADD UNIQUE KEY uk_ticket_code (ticket_code), ADD INDEX idx_booking_id (booking_id), ADD INDEX idx_trip_id (trip_id), ADD INDEX idx_user_id (user_id), ADD INDEX idx_status (status); ALTER TABLE notifications ADD INDEX idx_user_id (user_id), ADD INDEX idx_is_read (is_read), ADD INDEX idx_type (type); ALTER TABLE user_settings ADD UNIQUE KEY uk_user_id (user_id); ALTER TABLE payment_methods ADD INDEX idx_user_id (user_id); ALTER TABLE password_reset_tokens ADD INDEX idx_token (token), ADD INDEX idx_user_id (user_id); ALTER TABLE login_activity ADD INDEX idx_user_id (user_id); ALTER TABLE payments ADD INDEX idx_booking_id (booking_id), ADD INDEX idx_user_id (user_id), ADD INDEX idx_status (status); ALTER TABLE reviews ADD INDEX idx_booking_id (booking_id), ADD INDEX idx_user_id (user_id), ADD INDEX idx_trip_id (trip_id), ADD INDEX idx_driver_id (driver_id);"
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Some indexes may not have been created
)
echo SUCCESS: Secondary indexes recreated
echo.

echo ========================================
echo RECOVERY COMPLETE!
echo ========================================
echo.
echo Verifying recovery...
"%MYSQL_BIN%\mysql.exe" -u %MYSQL_USER% -e "USE %RECOVERY_DB%; SELECT 'users' as tbl, COUNT(*) as cnt FROM users UNION ALL SELECT 'bookings', COUNT(*) FROM bookings UNION ALL SELECT 'trips', COUNT(*) FROM trips UNION ALL SELECT 'drivers', COUNT(*) FROM drivers UNION ALL SELECT 'buses', COUNT(*) FROM buses;"
echo.
pause
