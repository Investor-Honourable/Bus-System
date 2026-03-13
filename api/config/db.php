<?php
// Database configuration
$db_host = 'localhost';
$db_name = 'bus_system';
$db_user = 'root';
$db_pass = '';

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
    
    // Create database if it doesn't exist
    $conn->query("CREATE DATABASE IF NOT EXISTS $db_name");
    $conn->select_db($db_name);
    
    // Set charset
    $conn->set_charset("utf8mb4");
    
} catch (Exception $e) {
    die(json_encode([
        'status' => 'error',
        'message' => 'Database connection failed: ' . $e->getMessage()
    ]));
}
