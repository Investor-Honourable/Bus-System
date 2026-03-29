<?php
/**
 * Settings API
 * Handles user settings management
 */

session_start();
require 'config/db.php';

// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, User-ID");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// GET - Get user settings
if ($method === 'GET') {
    $user_id = $_GET['user_id'] ?? 0;
    
    if (!$user_id) {
        echo json_encode(['status' => 'error', 'message' => 'User ID required']);
        exit;
    }
    
    try {
        $stmt = $conn->prepare("SELECT * FROM user_settings WHERE user_id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $settings = $result->fetch_assoc();
        
        if ($settings) {
            echo json_encode(['status' => 'success', 'settings' => $settings]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Settings not found']);
        }
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Failed to fetch settings: ' . $e->getMessage()]);
    }
    exit;
}

// POST - Update user settings
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $action = $data['action'] ?? '';
    $user_id = $data['user_id'] ?? 0;
    
    if (!$user_id) {
        echo json_encode(['status' => 'error', 'message' => 'User ID required']);
        exit;
    }
    
    // GET - Get user data, stats, settings, payment methods, login activity
    if ($action === 'get') {
        try {
            // Get user data
            $stmt = $conn->prepare("SELECT id, name, username, email, phone, gender, role, created_at FROM users WHERE id = ?");
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $user = $result->fetch_assoc();
            
            if (!$user) {
                echo json_encode(['status' => 'error', 'message' => 'User not found']);
                exit;
            }
            
            // Get stats
            $stats = [
                'active_tickets' => 0,
                'total_bookings' => 0,
                'total_spent' => 0,
                'completed_bookings' => 0
            ];
            
            // Get active tickets
            $stmt = $conn->prepare("SELECT COUNT(*) as count FROM tickets WHERE user_id = ? AND status = 'valid'");
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $row = $result->fetch_assoc();
            $stats['active_tickets'] = $row['count'] ?? 0;
            
            // Get total bookings
            $stmt = $conn->prepare("SELECT COUNT(*) as count FROM bookings WHERE user_id = ?");
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $row = $result->fetch_assoc();
            $stats['total_bookings'] = $row['count'] ?? 0;
            
            // Get total spent
            $stmt = $conn->prepare("SELECT COALESCE(SUM(total_price), 0) as total FROM bookings WHERE user_id = ? AND booking_status IN ('confirmed', 'completed')");
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $row = $result->fetch_assoc();
            $stats['total_spent'] = $row['total'] ?? 0;
            
            // Get completed bookings
            $stmt = $conn->prepare("SELECT COUNT(*) as count FROM bookings WHERE user_id = ? AND booking_status = 'completed'");
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $row = $result->fetch_assoc();
            $stats['completed_bookings'] = $row['count'] ?? 0;
            
            // Get settings
            $stmt = $conn->prepare("SELECT * FROM user_settings WHERE user_id = ?");
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $settings = $result->fetch_assoc();
            
            if (!$settings) {
                // Create default settings
                $stmt = $conn->prepare("INSERT INTO user_settings (user_id, email_notifications, sms_notifications, booking_confirmations, trip_reminders, promotions, two_factor_enabled, language, timezone) VALUES (?, 1, 1, 1, 1, 0, 0, 'en', 'Africa/Douala')");
                $stmt->bind_param("i", $user_id);
                $stmt->execute();
                
                $settings = [
                    'email_notifications' => 1,
                    'sms_notifications' => 1,
                    'booking_confirmations' => 1,
                    'trip_reminders' => 1,
                    'promotions' => 0,
                    'two_factor_enabled' => 0,
                    'language' => 'en',
                    'timezone' => 'Africa/Douala'
                ];
            }
            
            // Get payment methods
            $stmt = $conn->prepare("SELECT * FROM payment_methods WHERE user_id = ? AND is_active = 1 ORDER BY is_default DESC, created_at DESC");
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $payment_methods = [];
            while ($row = $result->fetch_assoc()) {
                $payment_methods[] = $row;
            }
            
            // Get login activity
            $stmt = $conn->prepare("SELECT * FROM login_activity WHERE user_id = ? ORDER BY login_at DESC LIMIT 10");
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $login_activity = [];
            while ($row = $result->fetch_assoc()) {
                $login_activity[] = $row;
            }
            
            echo json_encode([
                'status' => 'success',
                'data' => [
                    'user' => $user,
                    'stats' => $stats,
                    'settings' => $settings,
                    'payment_methods' => $payment_methods,
                    'login_activity' => $login_activity
                ]
            ]);
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => 'Failed to fetch data: ' . $e->getMessage()]);
        }
        exit;
    }
    
    // UPDATE_PROFILE - Update user profile
    if ($action === 'update_profile') {
        $name = $data['name'] ?? '';
        $email = $data['email'] ?? '';
        $phone = $data['phone'] ?? '';
        
        if (!$name || !$email) {
            echo json_encode(['status' => 'error', 'message' => 'Name and email are required']);
            exit;
        }
        
        try {
            $stmt = $conn->prepare("UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?");
            $stmt->bind_param("sssi", $name, $email, $phone, $user_id);
            
            if ($stmt->execute()) {
                echo json_encode(['status' => 'success', 'message' => 'Profile updated successfully']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Failed to update profile']);
            }
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
        }
        exit;
    }
    
    // CHANGE_PASSWORD - Change user password
    if ($action === 'change_password') {
        $current_password = $data['current_password'] ?? '';
        $new_password = $data['new_password'] ?? '';
        
        if (!$current_password || !$new_password) {
            echo json_encode(['status' => 'error', 'message' => 'Current password and new password are required']);
            exit;
        }
        
        try {
            // Get current password
            $stmt = $conn->prepare("SELECT password FROM users WHERE id = ?");
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $user = $result->fetch_assoc();
            
            if (!$user || !password_verify($current_password, $user['password'])) {
                echo json_encode(['status' => 'error', 'message' => 'Current password is incorrect']);
                exit;
            }
            
            // Update password
            $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
            $stmt = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
            $stmt->bind_param("si", $hashed_password, $user_id);
            
            if ($stmt->execute()) {
                echo json_encode(['status' => 'success', 'message' => 'Password changed successfully']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Failed to change password']);
            }
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
        }
        exit;
    }
    
    // UPDATE_NOTIFICATIONS - Update notification settings
    if ($action === 'update_notifications') {
        $email_notifications = $data['email_notifications'] ?? 1;
        $sms_notifications = $data['sms_notifications'] ?? 1;
        $booking_confirmations = $data['booking_confirmations'] ?? 1;
        $trip_reminders = $data['trip_reminders'] ?? 1;
        $promotions = $data['promotions'] ?? 0;
        
        try {
            $stmt = $conn->prepare("UPDATE user_settings SET email_notifications = ?, sms_notifications = ?, booking_confirmations = ?, trip_reminders = ?, promotions = ? WHERE user_id = ?");
            $stmt->bind_param("iiiiii", $email_notifications, $sms_notifications, $booking_confirmations, $trip_reminders, $promotions, $user_id);
            
            if ($stmt->execute()) {
                echo json_encode(['status' => 'success', 'message' => 'Notification settings updated']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Failed to update notification settings']);
            }
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
        }
        exit;
    }
    
    // UPDATE_SECURITY - Update security settings
    if ($action === 'update_security') {
        $two_factor_enabled = $data['two_factor_enabled'] ?? 0;
        
        try {
            $stmt = $conn->prepare("UPDATE user_settings SET two_factor_enabled = ? WHERE user_id = ?");
            $stmt->bind_param("ii", $two_factor_enabled, $user_id);
            
            if ($stmt->execute()) {
                echo json_encode(['status' => 'success', 'message' => 'Security settings updated']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Failed to update security settings']);
            }
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
        }
        exit;
    }
    
    // LOGOUT_ALL - Logout from all devices
    if ($action === 'logout_all') {
        try {
            // Delete all login activity for this user
            $stmt = $conn->prepare("DELETE FROM login_activity WHERE user_id = ?");
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            
            echo json_encode(['status' => 'success', 'message' => 'Logged out from all devices']);
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
        }
        exit;
    }
    
    // ADD_PAYMENT - Add payment method
    if ($action === 'add_payment') {
        $type = $data['type'] ?? 'mobile_money';
        $provider = $data['provider'] ?? '';
        $account_number = $data['account_number'] ?? '';
        
        if (!$provider || !$account_number) {
            echo json_encode(['status' => 'error', 'message' => 'Provider and account number are required']);
            exit;
        }
        
        try {
            // Check if this is the first payment method
            $stmt = $conn->prepare("SELECT COUNT(*) as count FROM payment_methods WHERE user_id = ?");
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $row = $result->fetch_assoc();
            $is_default = ($row['count'] == 0) ? 1 : 0;
            
            $stmt = $conn->prepare("INSERT INTO payment_methods (user_id, type, provider, account_number, is_default, is_active) VALUES (?, ?, ?, ?, ?, 1)");
            $stmt->bind_param("isssi", $user_id, $type, $provider, $account_number, $is_default);
            
            if ($stmt->execute()) {
                echo json_encode(['status' => 'success', 'message' => 'Payment method added successfully']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Failed to add payment method']);
            }
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
        }
        exit;
    }
    
    // REMOVE_PAYMENT - Remove payment method
    if ($action === 'remove_payment') {
        $payment_id = $data['payment_id'] ?? 0;
        
        if (!$payment_id) {
            echo json_encode(['status' => 'error', 'message' => 'Payment ID is required']);
            exit;
        }
        
        try {
            // Check if this is the default payment method
            $stmt = $conn->prepare("SELECT is_default FROM payment_methods WHERE id = ? AND user_id = ?");
            $stmt->bind_param("ii", $payment_id, $user_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $payment = $result->fetch_assoc();
            
            if (!$payment) {
                echo json_encode(['status' => 'error', 'message' => 'Payment method not found']);
                exit;
            }
            
            // Delete payment method
            $stmt = $conn->prepare("DELETE FROM payment_methods WHERE id = ? AND user_id = ?");
            $stmt->bind_param("ii", $payment_id, $user_id);
            
            if ($stmt->execute()) {
                // If this was the default, set another one as default
                if ($payment['is_default']) {
                    $stmt = $conn->prepare("SELECT id FROM payment_methods WHERE user_id = ? AND is_active = 1 LIMIT 1");
                    $stmt->bind_param("i", $user_id);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    $new_default = $result->fetch_assoc();
                    
                    if ($new_default) {
                        $stmt = $conn->prepare("UPDATE payment_methods SET is_default = 1 WHERE id = ?");
                        $stmt->bind_param("i", $new_default['id']);
                        $stmt->execute();
                    }
                }
                
                echo json_encode(['status' => 'success', 'message' => 'Payment method removed']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Failed to remove payment method']);
            }
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
        }
        exit;
    }
    
    // SET_DEFAULT_PAYMENT - Set default payment method
    if ($action === 'set_default_payment') {
        $payment_id = $data['payment_id'] ?? 0;
        
        if (!$payment_id) {
            echo json_encode(['status' => 'error', 'message' => 'Payment ID is required']);
            exit;
        }
        
        try {
            // Reset all payment methods to non-default
            $stmt = $conn->prepare("UPDATE payment_methods SET is_default = 0 WHERE user_id = ?");
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            
            // Set the selected payment method as default
            $stmt = $conn->prepare("UPDATE payment_methods SET is_default = 1 WHERE id = ? AND user_id = ?");
            $stmt->bind_param("ii", $payment_id, $user_id);
            
            if ($stmt->execute()) {
                echo json_encode(['status' => 'success', 'message' => 'Default payment method updated']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Failed to update default payment method']);
            }
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
        }
        exit;
    }
    
    // DELETE_ACCOUNT - Delete user account
    if ($action === 'delete_account') {
        try {
            // Delete all user data
            $stmt = $conn->prepare("DELETE FROM login_activity WHERE user_id = ?");
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            
            $stmt = $conn->prepare("DELETE FROM payment_methods WHERE user_id = ?");
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            
            $stmt = $conn->prepare("DELETE FROM user_settings WHERE user_id = ?");
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            
            $stmt = $conn->prepare("DELETE FROM notifications WHERE user_id = ?");
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            
            $stmt = $conn->prepare("DELETE FROM tickets WHERE user_id = ?");
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            
            $stmt = $conn->prepare("DELETE FROM bookings WHERE user_id = ?");
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            
            $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
            $stmt->bind_param("i", $user_id);
            
            if ($stmt->execute()) {
                echo json_encode(['status' => 'success', 'message' => 'Account deleted successfully']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Failed to delete account']);
            }
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
        }
        exit;
    }
    
    // Default: Update user settings
    $email_notifications = $data['email_notifications'] ?? 1;
    $sms_notifications = $data['sms_notifications'] ?? 1;
    $booking_confirmations = $data['booking_confirmations'] ?? 1;
    $trip_reminders = $data['trip_reminders'] ?? 1;
    $promotions = $data['promotions'] ?? 0;
    $two_factor_enabled = $data['two_factor_enabled'] ?? 0;
    $language = $data['language'] ?? 'en';
    $timezone = $data['timezone'] ?? 'Africa/Douala';
    
    try {
        $stmt = $conn->prepare("UPDATE user_settings SET email_notifications = ?, sms_notifications = ?, booking_confirmations = ?, trip_reminders = ?, promotions = ?, two_factor_enabled = ?, language = ?, timezone = ? WHERE user_id = ?");
        $stmt->bind_param("iiiiiissi", $email_notifications, $sms_notifications, $booking_confirmations, $trip_reminders, $promotions, $two_factor_enabled, $language, $timezone, $user_id);
        
        if ($stmt->execute()) {
            echo json_encode(['status' => 'success', 'message' => 'Settings updated successfully']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to update settings']);
        }
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
    }
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Invalid method']);
$conn->close();
