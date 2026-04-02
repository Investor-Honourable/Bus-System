@echo off
REM =====================================================
REM Bus Management System - Database Recovery Script v6
REM Purpose: Recover crashed InnoDB tables from .frm and .ibd files
REM Creates tables first, then copies .ibd files and imports
REM =====================================================

echo ========================================
echo Bus Management System Database Recovery v6
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

echo Step 1: Creating recovery database and tables...
echo ========================================
"%MYSQL_BIN%\mysql.exe" -u %MYSQL_USER% < "%SCRIPT_DIR%database_recovery.sql"
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
