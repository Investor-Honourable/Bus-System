<?php
/**
 * Forgot Password Controller
 * Handles password reset requests with email delivery
 */

session_start();
require_once __DIR__ . '/../config/db.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid method']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$email = $data['email'] ?? '';

if (!$email) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Email is required'
    ]);
    exit;
}

function sendPasswordResetEmail($toEmail, $toName, $resetUrl, $expiresIn) {
    $config = require_once __DIR__ . '/../config/smtp.php';
    require_once __DIR__ . '/../config/Mailer.php';
    
    if (!$config['enabled']) {
        error_log("SMTP disabled, cannot send email");
        return false;
    }
    
    $smtp = $config['smtp'];
    $subject = "CamTransit - Password Reset Request";
    
    $body = <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #2563eb; margin: 0;">CamTransit</h1>
            </div>
            
            <h2 style="color: #1f2937; margin-top: 0;">Password Reset Request</h2>
            
            <p style="color: #4b5563; line-height: 1.6;">
                Hello <strong>{$toName}</strong>,
            </p>
            
            <p style="color: #4b5563; line-height: 1.6;">
                We received a request to reset your CamTransit account password. 
                Click the button below to create a new password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{$resetUrl}" style="background: linear-gradient(135deg, #2563eb, #7c3aed); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; display: inline-block;">
                    Reset Password
                </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
                Or copy and paste this link in your browser:<br>
                <span style="color: #2563eb; word-break: break-all;">{$resetUrl}</span>
            </p>
            
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 0 4px 4px 0;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                    <strong>Important:</strong> This link expires in {$expiresIn}. 
                    If you didn't request a password reset, please ignore this email.
                </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                &copy; 2026 CamTransit. All rights reserved.<br>
                Cameroon, Central Africa
            </p>
        </div>
    </div>
</body>
</html>
HTML;

    try {
        $mailer = new Mailer();
        $result = $mailer->send($toEmail, $toName, $subject, $body);
        
        if (!$result) {
            error_log("Failed to send password reset email to: " . $toEmail);
        }
        
        return $result;
    } catch (Exception $e) {
        error_log("Email sending exception: " . $e->getMessage());
        return false;
    }
}

try {
    $stmt = $conn->prepare("SELECT id, name, email FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode([
            'status' => 'success',
            'message' => 'If your email is registered, you will receive a password reset link'
        ]);
        exit;
    }
    
    $user = $result->fetch_assoc();
    
    $token = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));
    
    $stmt = $conn->prepare("DELETE FROM password_reset_tokens WHERE user_id = ?");
    $stmt->bind_param("i", $user['id']);
    $stmt->execute();
    
    $stmt = $conn->prepare("INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)");
    $stmt->bind_param("iss", $user['id'], $token, $expiresAt);
    
    if ($stmt->execute()) {
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost:5173';
        $resetUrl = "{$protocol}://{$host}/reset-password?token=" . $token;
        
        $config = require __DIR__ . '/../config/smtp.php';
        $emailSent = false;
        if (!empty($config['enabled'])) {
            $emailSent = sendPasswordResetEmail($user['email'], $user['name'], $resetUrl, '1 hour');
            
            if (!$emailSent) {
                error_log("Email send failed, falling back to console");
            }
        }
        
        if ($emailSent) {
            echo json_encode([
                'status' => 'success',
                'message' => 'Password reset link sent to your email'
            ]);
        } else {
            echo json_encode([
                'status' => 'success',
                'message' => 'If your email is registered, you will receive a password reset link'
            ]);
        }
    } else {
        echo json_encode([
            'status' => 'error',
            'message' => 'Failed to generate reset token'
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

$conn->close();