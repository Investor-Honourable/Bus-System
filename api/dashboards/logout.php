<?php
/**
 * Logout API
 * Handles user logout
 */

session_start();

// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Destroy session
session_unset();
session_destroy();

echo json_encode([
    'status' => 'success',
    'message' => 'Logged out successfully'
]);
