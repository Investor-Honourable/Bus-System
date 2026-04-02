@echo off
REM =====================================================
REM Bus Management System - Database Recovery Script v4
REM Purpose: Recover crashed InnoDB tables from .frm and .ibd files
REM Handles missing .cfg files by dropping secondary indexes before import
REM =====================================================

echo ========================================
echo Bus Management System Database Recovery v4
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

echo Step 1: Creating recovery database...
echo ========================================
"%MYSQL_BIN%\mysql.exe" -u %MYSQL_USER% -e "DROP DATABASE IF EXISTS %RECOVERY_DB%; CREATE DATABASE %RECOVERY_DB%;"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to create recovery database
    pause
    exit /b 1
)
echo SUCCESS: Recovery database created
echo.

echo Step 2: Copying .frm and .ibd files to recovery database...
echo ========================================
if not exist "%RECOVERY_DIR%" (
    mkdir "%RECOVERY_DIR%"
)

REM Copy all .frm files
for %%f in ("%ORIGINAL_DIR%\*.frm") do (
    echo Copying %%~nxf...
    copy "%%f" "%RECOVERY_DIR%\%%~nxf" /Y
)

REM Copy all .ibd files
for %%f in ("%ORIGINAL_DIR%\*.ibd") do (
    echo Copying %%~nxf...
    copy "%%f" "%RECOVERY_DIR%\%%~nxf" /Y
)

echo SUCCESS: All .frm and .ibd files copied
echo.

echo Step 3: Dropping all secondary indexes before import...
echo ========================================
"%MYSQL_BIN%\mysql.exe" -u %MYSQL_USER% -e "USE %RECOVERY_DB%; SET FOREIGN_KEY_CHECKS = 0; ALTER TABLE users DROP INDEX idx_email, DROP INDEX idx_role; ALTER TABLE passengers DROP INDEX idx_user_id; ALTER TABLE drivers DROP INDEX idx_user_id, DROP INDEX idx_status, DROP INDEX idx_license; ALTER TABLE buses DROP INDEX idx_bus_number, DROP INDEX idx_status, DROP INDEX idx_type; ALTER TABLE routes DROP INDEX idx_route_code, DROP INDEX idx_origin, DROP INDEX idx_destination, DROP INDEX idx_status; ALTER TABLE trips DROP INDEX idx_bus_id, DROP INDEX idx_route_id, DROP INDEX idx_driver_id, DROP INDEX idx_departure_date, DROP INDEX idx_status; ALTER TABLE bookings DROP INDEX idx_booking_reference, DROP INDEX idx_user_id, DROP INDEX idx_trip_id, DROP INDEX idx_payment_status, DROP INDEX idx_booking_status; ALTER TABLE tickets DROP INDEX idx_ticket_code, DROP INDEX idx_booking_id, DROP INDEX idx_trip_id, DROP INDEX idx_user_id, DROP INDEX idx_status; ALTER TABLE notifications DROP INDEX idx_user_id, DROP INDEX idx_is_read, DROP INDEX idx_created_at, DROP INDEX idx_type; ALTER TABLE user_settings DROP INDEX unique_user_settings; ALTER TABLE payment_methods DROP INDEX idx_user_id; ALTER TABLE password_reset_tokens DROP INDEX idx_token, DROP INDEX idx_user_id, DROP INDEX idx_expires_at; ALTER TABLE login_activity DROP INDEX idx_user_id, DROP INDEX idx_login_at; ALTER TABLE payments DROP INDEX idx_booking_id, DROP INDEX idx_user_id, DROP INDEX idx_status, DROP INDEX idx_transaction_id; ALTER TABLE reviews DROP INDEX idx_booking_id, DROP INDEX idx_user_id, DROP INDEX idx_trip_id, DROP INDEX idx_driver_id; SET FOREIGN_KEY_CHECKS = 1;"
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Some indexes may not have been dropped (this is normal if they don't exist)
)
echo SUCCESS: Secondary indexes dropped
echo.

echo Step 4: Discarding tablespaces...
echo ========================================
"%MYSQL_BIN%\mysql.exe" -u %MYSQL_USER% -e "USE %RECOVERY_DB%; SET FOREIGN_KEY_CHECKS = 0; ALTER TABLE users DISCARD TABLESPACE; ALTER TABLE passengers DISCARD TABLESPACE; ALTER TABLE drivers DISCARD TABLESPACE; ALTER TABLE buses DISCARD TABLESPACE; ALTER TABLE routes DISCARD TABLESPACE; ALTER TABLE trips DISCARD TABLESPACE; ALTER TABLE bookings DISCARD TABLESPACE; ALTER TABLE tickets DISCARD TABLESPACE; ALTER TABLE notifications DISCARD TABLESPACE; ALTER TABLE user_settings DISCARD TABLESPACE; ALTER TABLE payment_methods DISCARD TABLESPACE; ALTER TABLE password_reset_tokens DISCARD TABLESPACE; ALTER TABLE login_activity DISCARD TABLESPACE; ALTER TABLE payments DISCARD TABLESPACE; ALTER TABLE reviews DISCARD TABLESPACE; SET FOREIGN_KEY_CHECKS = 1;"
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Some tablespaces may not have been discarded (this is normal if tables don't exist yet)
)
echo SUCCESS: Tablespaces discarded
echo.

echo Step 5: Importing tablespaces...
echo ========================================
"%MYSQL_BIN%\mysql.exe" -u %MYSQL_USER% -e "USE %RECOVERY_DB%; SET FOREIGN_KEY_CHECKS = 0; ALTER TABLE users IMPORT TABLESPACE; ALTER TABLE passengers IMPORT TABLESPACE; ALTER TABLE drivers IMPORT TABLESPACE; ALTER TABLE buses IMPORT TABLESPACE; ALTER TABLE routes IMPORT TABLESPACE; ALTER TABLE trips IMPORT TABLESPACE; ALTER TABLE bookings IMPORT TABLESPACE; ALTER TABLE tickets IMPORT TABLESPACE; ALTER TABLE notifications IMPORT TABLESPACE; ALTER TABLE user_settings IMPORT TABLESPACE; ALTER TABLE payment_methods IMPORT TABLESPACE; ALTER TABLE password_reset_tokens IMPORT TABLESPACE; ALTER TABLE login_activity IMPORT TABLESPACE; ALTER TABLE payments IMPORT TABLESPACE; ALTER TABLE reviews IMPORT TABLESPACE; SET FOREIGN_KEY_CHECKS = 1;"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to import tablespaces
    pause
    exit /b 1
)
echo SUCCESS: All tablespaces imported
echo.

echo Step 6: Recreating secondary indexes...
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
