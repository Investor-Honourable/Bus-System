<?php
/**
 * Forgot Password API
 * Shows reset link directly in browser
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

// Create password_reset_tokens table if it doesn't exist
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            token VARCHAR(64) NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ");
} catch (Exception $e) {
    // Table might not have users table - we'll handle that below
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Validate input
if (!isset($input['email']) || empty($input['email'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Email is required'
    ]);
    exit;
}

$email = filter_var($input['email'], FILTER_VALIDATE_EMAIL);

if (!$email) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid email format'
    ]);
    exit;
}

try {
    // Check if user exists
    $stmt = $pdo->prepare("SELECT id, name, email FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        // Don't reveal if user exists or not for security
        echo json_encode([
            'success' => true,
            'message' => 'If an account exists with this email, a reset link has been generated'
        ]);
        exit;
    }

    // Generate reset token
    $token = bin2hex(random_bytes(32));
    $expires = date('Y-m-d H:i:s', strtotime('+1 hour'));

    // Delete any existing tokens for this user
    $deleteStmt = $pdo->prepare("DELETE FROM password_reset_tokens WHERE user_id = ?");
    $deleteStmt->execute([$user['id']]);

    // Insert new token
    $insertStmt = $pdo->prepare("INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)");
    $insertStmt->execute([$user['id'], $token, $expires]);

    // Create reset link
    $resetLink = "http://localhost:5173/reset-password?token=" . $token;

    // Always return the link in browser
    echo json_encode([
        'success' => true,
        'message' => 'Password reset link generated!',
        'resetLink' => $resetLink
    ]);

} catch (PDOException $e) {
    error_log("Forgot password error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred. Please try again later.'
    ]);
}
