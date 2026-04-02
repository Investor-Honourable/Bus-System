<?php
/**
 * Update Driver Credentials Script
 * Updates login credentials for existing driver accounts
 */

session_start();
require_once 'config/db.php';

// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Only POST method is allowed']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

// New credentials for both driver accounts
$driverUpdates = [
    [
        'old_email' => 'driver@camtransit.com',
        'new_username' => 'johndriver',
        'new_email' => 'john.driver@camtransit.com',
        'new_password' => 'driver1234'
    ],
    [
        'old_email' => 'marie.driver@camtransit.com',
        'new_username' => 'mariedriver',
        'new_email' => 'marie.driver@camtransit.com',
        'new_password' => 'driver1234'
    ]
];

$results = [];
$successCount = 0;
$errorCount = 0;

try {
    foreach ($driverUpdates as $update) {
        $old_email = $update['old_email'];
        $new_username = $update['new_username'];
        $new_email = $update['new_email'];
        $new_password = $update['new_password'];
        
        // Hash the new password
        $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
        
        // Check if user exists
        $stmt = $conn->prepare("SELECT id, name FROM users WHERE email = ? AND role = 'driver'");
        $stmt->bind_param("s", $old_email);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        
        if (!$user) {
            $results[] = [
                'email' => $old_email,
                'status' => 'error',
                'message' => 'Driver account not found'
            ];
            $errorCount++;
            continue;
        }
        
        // Update user credentials
        $stmt = $conn->prepare("UPDATE users SET username = ?, email = ?, password = ? WHERE id = ?");
        $stmt->bind_param("sssi", $new_username, $new_email, $hashed_password, $user['id']);
        
        if ($stmt->execute()) {
            $results[] = [
                'name' => $user['name'],
                'old_email' => $old_email,
                'new_username' => $new_username,
                'new_email' => $new_email,
                'status' => 'success',
                'message' => 'Credentials updated successfully'
            ];
            $successCount++;
        } else {
            $results[] = [
                'email' => $old_email,
                'status' => 'error',
                'message' => 'Failed to update credentials: ' . $stmt->error
            ];
            $errorCount++;
        }
    }
    
    echo json_encode([
        'status' => 'success',
        'message' => "Updated $successCount driver account(s), $errorCount error(s)",
        'results' => $results,
        'summary' => [
            'total' => count($driverUpdates),
            'success' => $successCount,
            'errors' => $errorCount
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Error updating driver credentials: ' . $e->getMessage()
    ]);
}
?>
