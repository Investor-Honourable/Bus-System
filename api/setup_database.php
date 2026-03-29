<?php
/**
 * Database Setup Script for CamTransit Bus Management System
 * This script creates the database and imports the schema
 * 
 * Usage: Run this script once to set up the database
 * Access via: http://localhost/Bus_system/api/setup_database.php
 */

// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Database configuration
$db_host = getenv('DB_HOST') ?: 'localhost';
$db_name = getenv('DB_NAME') ?: 'bus_system';
$db_user = getenv('DB_USER') ?: 'root';
$db_pass = getenv('DB_PASS') ?: '';

try {
    // Connect to MySQL
    $conn = new mysqli($db_host, $db_user, $db_pass);
    
    if ($conn->connect_error) {
        throw new Exception('Connection failed: ' . $conn->connect_error);
    }
    
    // Read the schema file
    $schema_file = __DIR__ . '/database_schema.sql';
    
    if (!file_exists($schema_file)) {
        throw new Exception('Schema file not found: ' . $schema_file);
    }
    
    $sql = file_get_contents($schema_file);
    
    // Split SQL into individual statements
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    $results = [];
    $success_count = 0;
    $error_count = 0;
    
    // Execute each statement
    foreach ($statements as $statement) {
        if (empty($statement) || strpos($statement, '--') === 0) {
            continue;
        }
        
        // Skip DELIMITER statements (for stored procedures)
        if (strpos($statement, 'DELIMITER') !== false) {
            continue;
        }
        
        if ($conn->query($statement)) {
            $success_count++;
        } else {
            $error_count++;
            $results[] = [
                'statement' => substr($statement, 0, 100) . '...',
                'error' => $conn->error
            ];
        }
    }
    
    // Close connection
    $conn->close();
    
    // Return success response
    echo json_encode([
        'status' => 'success',
        'message' => 'Database setup completed',
        'details' => [
            'database' => $db_name,
            'statements_executed' => $success_count,
            'errors' => $error_count,
            'error_details' => $results
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database setup failed: ' . $e->getMessage()
    ]);
}
