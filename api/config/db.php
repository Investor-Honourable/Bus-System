<?php
/**
 * Database Configuration
 * Uses environment variables with fallback to defaults for local development
 */

// Get database credentials from environment variables
// In production, set these in your server's environment config
$db_host = getenv('DB_HOST') ?: 'localhost';
$db_name = getenv('DB_NAME') ?: 'bus_system';
$db_user = getenv('DB_USER') ?: 'root';
$db_pass = getenv('DB_PASS') ?: '';

// For additional security, you can also use these environment variables:
// DB_HOST, DB_NAME, DB_USER, DB_PASS
// Set these in your server configuration (Apache, Nginx, or PHP-FPM)

try {
    // First connect without database to create it if needed
    $conn = new mysqli($db_host, $db_user, $db_pass);
    
    // Check connection
    if ($conn->connect_error) {
        die(json_encode([
            'status' => 'error',
            'message' => 'Database connection failed: ' . $conn->connect_error
        ]));
    }
    
    // Create database if it doesn't exist (use backticks to escape database name)
    $db_name_escaped = "`" . str_replace("`", "``", $db_name) . "`";
    $conn->query("CREATE DATABASE IF NOT EXISTS " . $db_name_escaped);
    $conn->select_db($db_name);
    
    // Set charset
    $conn->set_charset("utf8mb4");
    
} catch (Exception $e) {
    die(json_encode([
        'status' => 'error',
        'message' => 'Database connection failed: ' . $e->getMessage()
    ]));
}

/**
 * SECURITY RECOMMENDATIONS:
 * 
 * 1. For production, create a dedicated database user with limited privileges:
 *    - Don't use 'root' user
 *    - Create a user specifically for the bus_system database
 * 
 * 2. Use strong passwords:
 *    - Generate a random password: openssl rand -base64 32
 * 
 * 3. Set environment variables on your server:
 *    - Apache: SetEnv DB_HOST "localhost"
 *    -        SetEnv DB_NAME "bus_system"
 *    -        SetEnv DB_USER "bus_system_user"
 *    -        SetEnv DB_PASS "your-strong-password"
 * 
 * 4. Or use a .env file with a library like vlucas/phpdotenv
 */
