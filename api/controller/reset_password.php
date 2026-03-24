<?php
/**
 * Reset Password API
 * Handles password reset token validation and password update
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Include database configuration
require_once __DIR__ . '/../config/db.php';

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Validate input
if (!isset($input['token']) || empty($input['token'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Reset token is required'
    ]);
    exit;
}

if (!isset($input['password']) || empty($input['password'])) {
    echo json_encode([
        'success' => false,
        'message' => 'New password is required'
    ]);
    exit;
}

if (strlen($input['password']) < 6) {
    echo json_encode([
        'success' => false,
        'message' => 'Password must be at least 6 characters'
    ]);
    exit;
}

$token = $input['token'];
$newPassword = $input['password'];

try {
    // Find valid token
    $stmt = $pdo->prepare("
        SELECT prt.user_id, u.email, u.name 
        FROM password_reset_tokens prt
        JOIN users u ON prt.user_id = u.id
        WHERE prt.token = ? AND prt.expires_at > NOW()
    ");
    $stmt->execute([$token]);
    $resetRequest = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$resetRequest) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid or expired reset token'
        ]);
        exit;
    }

    // Hash new password
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

    // Update user password
    $updateStmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
    $updateStmt->execute([$hashedPassword, $resetRequest['user_id']]);

    // Delete used token
    $deleteStmt = $pdo->prepare("DELETE FROM password_reset_tokens WHERE user_id = ?");
    $deleteStmt->execute([$resetRequest['user_id']]);

    // Log the password change
    $logMessage = "[" . date('Y-m-d H:i:s') . "] Password Reset Completed\n";
    $logMessage .= "Email: " . $resetRequest['email'] . "\n";
    $logMessage .= "User ID: " . $resetRequest['user_id'] . "\n";
    $logMessage .= "-------------------------------------------\n";
    
    file_put_contents(__DIR__ . '/../logs/password_reset.log', $logMessage, FILE_APPEND);

    echo json_encode([
        'success' => true,
        'message' => 'Password has been reset successfully'
    ]);

} catch (PDOException $e) {
    error_log("Reset password error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred. Please try again later.'
    ]);
}
