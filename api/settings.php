<?php
session_start();
require 'config/db.php';

// Enable CORS
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get JSON input
$data = json_decode(file_get_contents("php://input"), true);
$user_id = $data['user_id'] ?? 0;

// Check if user_id is provided
if (!$user_id) {
    echo json_encode([
        'status' => 'error',
        'message' => 'User not authenticated'
    ]);
    exit;
}

// Get action from GET or POST body
$action = $_GET['action'] ?? ($data['action'] ?? '');

// Get user data from users table
function getUserData($conn, $user_id) {
    $stmt = $conn->prepare("SELECT id, name, username, email, phone, gender, role, created_at, updated_at FROM users WHERE id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    $stmt->close();
    return $user;
}

// Get user settings
function getUserSettings($conn, $user_id) {
    $stmt = $conn->prepare("SELECT * FROM user_settings WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        // Create default settings if not exists
        $stmt2 = $conn->prepare("INSERT INTO user_settings (user_id) VALUES (?)");
        $stmt2->bind_param("i", $user_id);
        $stmt2->execute();
        $stmt2->close();
        
        // Fetch again
        $stmt->execute();
        $result = $stmt->get_result();
    }
    
    $settings = $result->fetch_assoc();
    $stmt->close();
    return $settings;
}

// Get payment methods
function getPaymentMethods($conn, $user_id) {
    $stmt = $conn->prepare("SELECT id, type, provider, account_number, is_default FROM payment_methods WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $methods = [];
    while ($row = $result->fetch_assoc()) {
        $methods[] = $row;
    }
    $stmt->close();
    return $methods;
}

// Get login activity
function getLoginActivity($conn, $user_id) {
    $stmt = $conn->prepare("SELECT device, location, ip_address, is_current, created_at FROM login_activity WHERE user_id = ? ORDER BY created_at DESC LIMIT 10");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $activities = [];
    while ($row = $result->fetch_assoc()) {
        $activities[] = $row;
    }
    $stmt->close();
    return $activities;
}

// GET requests
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    
    if ($action === 'get') {
        // Get all user data
        $user = getUserData($conn, $user_id);
        $settings = getUserSettings($conn, $user_id);
        $paymentMethods = getPaymentMethods($conn, $user_id);
        $loginActivity = getLoginActivity($conn, $user_id);
        
        // Get passenger statistics - use correct schema matching index.php
        // Schema: bookings table has user_id (not passenger_id), booking_status (not status)
        // bookings has trip_id (not schedule_id), and total_price column
        $statsStmt = $conn->prepare("
            SELECT 
                (SELECT COUNT(*) FROM bookings WHERE user_id = ? AND booking_status = 'confirmed') AS active_tickets,
                (SELECT COUNT(*) FROM bookings WHERE user_id = ?) AS total_bookings,
                (SELECT COALESCE(SUM(total_price), 0) FROM bookings WHERE user_id = ? AND booking_status = 'confirmed') AS total_spent,
                (SELECT COUNT(*) FROM bookings WHERE user_id = ? AND booking_status = 'completed') AS completed_bookings
        ");
        $statsStmt->bind_param("iiii", $user_id, $user_id, $user_id, $user_id);
        $statsStmt->execute();
        $statsResult = $statsStmt->get_result();
        $stats = $statsResult->fetch_assoc();
        $statsStmt->close();
        
        echo json_encode([
            'status' => 'success',
            'data' => [
                'user' => $user,
                'settings' => $settings,
                'payment_methods' => $paymentMethods,
                'login_activity' => $loginActivity,
                'stats' => $stats
            ]
        ]);
        exit;
    }
    
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid action'
    ]);
    exit;
}

// POST requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Handle 'get' action in POST as well
    if ($action === 'get') {
        $user = getUserData($conn, $user_id);
        $settings = getUserSettings($conn, $user_id);
        $paymentMethods = getPaymentMethods($conn, $user_id);
        $loginActivity = getLoginActivity($conn, $user_id);
        
        // Get passenger statistics - use correct schema matching index.php
        $statsStmt = $conn->prepare("
            SELECT 
                (SELECT COUNT(*) FROM bookings WHERE user_id = ? AND booking_status = 'confirmed') AS active_tickets,
                (SELECT COUNT(*) FROM bookings WHERE user_id = ?) AS total_bookings,
                (SELECT COALESCE(SUM(total_price), 0) FROM bookings WHERE user_id = ? AND booking_status = 'confirmed') AS total_spent,
                (SELECT COUNT(*) FROM bookings WHERE user_id = ? AND booking_status = 'completed') AS completed_bookings
        ");
        $statsStmt->bind_param("iiii", $user_id, $user_id, $user_id, $user_id);
        $statsStmt->execute();
        $statsResult = $statsStmt->get_result();
        $stats = $statsResult->fetch_assoc();
        $statsStmt->close();
        
        echo json_encode([
            'status' => 'success',
            'data' => [
                'user' => $user,
                'settings' => $settings,
                'payment_methods' => $paymentMethods,
                'login_activity' => $loginActivity,
                'stats' => $stats
            ]
        ]);
        exit;
    }
    
    // Update Profile
    if ($action === 'update_profile') {
        $name = $data['name'] ?? '';
        $email = $data['email'] ?? '';
        $phone = $data['phone'] ?? '';
        
        if (!$name || !$email) {
            echo json_encode([
                'status' => 'error',
                'message' => 'Name and email are required'
            ]);
            exit;
        }
        
        // Check if email is taken by another user
        $stmt = $conn->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
        $stmt->bind_param("si", $email, $user_id);
        $stmt->execute();
        $stmt->store_result();
        
        if ($stmt->num_rows > 0) {
            echo json_encode([
                'status' => 'error',
                'message' => 'Email already in use'
            ]);
            $stmt->close();
            exit;
        }
        $stmt->close();
        
        $stmt = $conn->prepare("UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?");
        $stmt->bind_param("sssi", $name, $email, $phone, $user_id);
        
        if ($stmt->execute()) {
            // Update session
            $_SESSION['user_name'] = $name;
            $_SESSION['user_email'] = $email;
            
            echo json_encode([
                'status' => 'success',
                'message' => 'Profile updated successfully'
            ]);
        } else {
            echo json_encode([
                'status' => 'error',
                'message' => 'Failed to update profile'
            ]);
        }
        $stmt->close();
        exit;
    }
    
    // Change Password
    if ($action === 'change_password') {
        $currentPassword = $data['current_password'] ?? '';
        $newPassword = $data['new_password'] ?? '';
        
        if (!$currentPassword || !$newPassword) {
            echo json_encode([
                'status' => 'error',
                'message' => 'Current and new password are required'
            ]);
            exit;
        }
        
        // Get current password hash
        $stmt = $conn->prepare("SELECT password FROM users WHERE id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        $stmt->close();
        
        if (!$user || !password_verify($currentPassword, $user['password'])) {
            echo json_encode([
                'status' => 'error',
                'message' => 'Current password is incorrect'
            ]);
            exit;
        }
        
        // Update password
        $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
        $stmt = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
        $stmt->bind_param("si", $newHash, $user_id);
        
        if ($stmt->execute()) {
            echo json_encode([
                'status' => 'success',
                'message' => 'Password changed successfully'
            ]);
        } else {
            echo json_encode([
                'status' => 'error',
                'message' => 'Failed to change password'
            ]);
        }
        $stmt->close();
        exit;
    }
    
    // Update Settings
    if ($action === 'update_settings') {
        $email_notifications = $data['email_notifications'] ?? 1;
        $sms_notifications = $data['sms_notifications'] ?? 1;
        $booking_confirmations = $data['booking_confirmations'] ?? 1;
        $trip_reminders = $data['trip_reminders'] ?? 1;
        $promotions = $data['promotions'] ?? 0;
        $two_factor_enabled = $data['two_factor_enabled'] ?? 0;
        $language = $data['language'] ?? 'en';
        
        $stmt = $conn->prepare("UPDATE user_settings SET email_notifications = ?, sms_notifications = ?, booking_confirmations = ?, trip_reminders = ?, promotions = ?, two_factor_enabled = ?, language = ? WHERE user_id = ?");
        $stmt->bind_param("iiiiissi", $email_notifications, $sms_notifications, $booking_confirmations, $trip_reminders, $promotions, $two_factor_enabled, $language, $user_id);
        
        if ($stmt->execute()) {
            echo json_encode([
                'status' => 'success',
                'message' => 'Settings updated successfully'
            ]);
        } else {
            echo json_encode([
                'status' => 'error',
                'message' => 'Failed to update settings'
            ]);
        }
        $stmt->close();
        exit;
    }
    
    // Update Language Only
    if ($action === 'update_language') {
        $language = $data['language'] ?? 'en';
        
        // Validate language code
        $allowed_languages = ['en', 'fr', 'es', 'ar', 'de', 'zh', 'ja', 'pt'];
        if (!in_array($language, $allowed_languages)) {
            $language = 'en';
        }
        
        // Check if user_settings exists, create if not
        $checkStmt = $conn->prepare("SELECT user_id FROM user_settings WHERE user_id = ?");
        $checkStmt->bind_param("i", $user_id);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        
        if ($checkResult->num_rows === 0) {
            // Create default settings
            $insertStmt = $conn->prepare("INSERT INTO user_settings (user_id, language) VALUES (?, ?)");
            $insertStmt->bind_param("is", $user_id, $language);
            $insertStmt->execute();
            $insertStmt->close();
        }
        $checkStmt->close();
        
        $stmt = $conn->prepare("UPDATE user_settings SET language = ? WHERE user_id = ?");
        $stmt->bind_param("si", $language, $user_id);
        
        if ($stmt->execute()) {
            echo json_encode([
                'status' => 'success',
                'message' => 'Language updated successfully',
                'language' => $language
            ]);
        } else {
            echo json_encode([
                'status' => 'error',
                'message' => 'Failed to update language'
            ]);
        }
        $stmt->close();
        exit;
    }
    
    // Add Payment Method
    if ($action === 'add_payment_method') {
        $type = $data['type'] ?? '';
        $provider = $data['provider'] ?? '';
        $account_number = $data['account_number'] ?? '';
        $is_default = $data['is_default'] ?? 0;
        
        if (!$type || !$account_number) {
            echo json_encode([
                'status' => 'error',
                'message' => 'Type and account number are required'
            ]);
            exit;
        }
        
        // If this is default, unset other defaults
        if ($is_default) {
            $stmt = $conn->prepare("UPDATE payment_methods SET is_default = 0 WHERE user_id = ?");
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            $stmt->close();
        }
        
        $stmt = $conn->prepare("INSERT INTO payment_methods (user_id, type, provider, account_number, is_default) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("isssi", $user_id, $type, $provider, $account_number, $is_default);
        
        if ($stmt->execute()) {
            echo json_encode([
                'status' => 'success',
                'message' => 'Payment method added successfully'
            ]);
        } else {
            echo json_encode([
                'status' => 'error',
                'message' => 'Failed to add payment method'
            ]);
        }
        $stmt->close();
        exit;
    }
    
    // Delete Payment Method
    if ($action === 'delete_payment_method') {
        $method_id = $data['method_id'] ?? 0;
        
        if (!$method_id) {
            echo json_encode([
                'status' => 'error',
                'message' => 'Payment method ID is required'
            ]);
            exit;
        }
        
        $stmt = $conn->prepare("DELETE FROM payment_methods WHERE id = ? AND user_id = ?");
        $stmt->bind_param("ii", $method_id, $user_id);
        
        if ($stmt->execute()) {
            echo json_encode([
                'status' => 'success',
                'message' => 'Payment method deleted successfully'
            ]);
        } else {
            echo json_encode([
                'status' => 'error',
                'message' => 'Failed to delete payment method'
            ]);
        }
        $stmt->close();
        exit;
    }
    
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid action'
    ]);
    exit;
}
?>
