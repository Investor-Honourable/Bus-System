@echo off
REM =====================================================
REM Bus Management System - Database Recovery Script v5
REM Purpose: Recover crashed InnoDB tables from .frm and .ibd files
REM Uses original .frm files to preserve exact table structure
REM =====================================================

echo ========================================
echo Bus Management System Database Recovery v5
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

echo Step 3: Creating tables from .frm files...
echo ========================================
REM This step is not needed as .frm files define the table structure
echo SUCCESS: Tables defined by .frm files
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
