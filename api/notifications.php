<?php
/**
 * Notifications API
 * Handles notification management
 */

session_start();
require 'config/db.php';

// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, User-ID");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function sendNotificationEmail($conn, $user_id, $title, $message) {
    $user_stmt = $conn->prepare("SELECT u.email, u.name, COALESCE(us.email_notifications, 1) as email_notifications_enabled 
                               FROM users u 
                               LEFT JOIN user_settings us ON u.id = us.user_id 
                               WHERE u.id = ?");
    $user_stmt->bind_param("i", $user_id);
    $user_stmt->execute();
    $user_result = $user_stmt->get_result();
    $user = $user_result->fetch_assoc();
    
    if (!$user || empty($user['email']) || !$user['email_notifications_enabled']) {
        return false;
    }
    
    $to = $user['email'];
    $user_name = $user['name'];
    $subject = "CamTransit Notification: $title";
    $headers = "From: noreply@camtransit.com\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    
    $email_body = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { padding: 10px; text-align: center; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h2>CamTransit</h2>
            </div>
            <div class='content'>
                <h3>$title</h3>
                <p>Hello $user_name,</p>
                <p>$message</p>
            </div>
            <div class='footer'>
                <p>This is an automated notification from CamTransit.</p>
                <p><a href='https://camtransit.com'>Visit CamTransit</a></p>
            </div>
        </div>
    </body>
    </html>
    ";
    
    return mail($to, $subject, $email_body, $headers);
}

$method = $_SERVER['REQUEST_METHOD'];

// GET - Get notifications
if ($method === 'GET') {
    $user_id = $_GET['user_id'] ?? 0;
    $action = $_GET['action'] ?? 'list';
    
    if (!$user_id) {
        echo json_encode(['status' => 'error', 'message' => 'User ID required']);
        exit;
    }
    
    // List notifications
    if ($action === 'list') {
        try {
            $stmt = $conn->prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50");
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $notifications = [];
            while ($row = $result->fetch_assoc()) {
                $notifications[] = $row;
            }
            
            // Get unread count
            $unread_stmt = $conn->prepare("SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE");
            $unread_stmt->bind_param("i", $user_id);
            $unread_stmt->execute();
            $unread_result = $unread_stmt->get_result();
            $unread_count = $unread_result->fetch_assoc()['count'];
            
            echo json_encode(['status' => 'success', 'notifications' => $notifications, 'unread_count' => (int)$unread_count]);
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => 'Failed to fetch notifications: ' . $e->getMessage()]);
        }
        exit;
    }
}

// POST - Create notification
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $action = $data['action'] ?? '';
    
    if ($action === 'create') {
        $user_id = $data['user_id'] ?? 0;
        $title = $data['title'] ?? '';
        $message = $data['message'] ?? '';
        $type = $data['type'] ?? 'system';
        $reference_type = $data['reference_type'] ?? null;
        $reference_id = $data['reference_id'] ?? null;
        $send_email = $data['send_email'] ?? false;
        
        if (!$user_id || !$title || !$message) {
            echo json_encode(['status' => 'error', 'message' => 'User ID, title, and message are required']);
            exit;
        }
        
        try {
            $stmt = $conn->prepare("INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id) VALUES (?, ?, ?, ?, ?, ?)");
            $refType = $reference_type ?? '';
            $refId = $reference_id ?? 0;
            $stmt->bind_param("isssii", $user_id, $title, $message, $type, $refType, $refId);
            
            if ($stmt->execute()) {
                $notification_id = $conn->insert_id;
                $email_sent = false;
                if ($send_email) {
                    $email_sent = sendNotificationEmail($conn, $user_id, $title, $message);
                }
                echo json_encode([
                    'status' => 'success', 
                    'message' => 'Notification created', 
                    'id' => $notification_id,
                    'email_sent' => $email_sent
                ]);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Failed to create notification']);
            }
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
        }
        exit;
    }
}

// PUT - Mark as read
if ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    $action = $data['action'] ?? '';
    
    if ($action === 'mark_read') {
        $notification_id = $data['notification_id'] ?? 0;
        $user_id = $data['user_id'] ?? 0;
        
        if (!$notification_id || !$user_id) {
            echo json_encode(['status' => 'error', 'message' => 'Notification ID and User ID required']);
            exit;
        }
        
        try {
            $stmt = $conn->prepare("UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?");
            $stmt->bind_param("ii", $notification_id, $user_id);
            
            if ($stmt->execute()) {
                echo json_encode(['status' => 'success', 'message' => 'Notification marked as read']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Failed to update notification']);
            }
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
        }
        exit;
    }
    
    if ($action === 'mark_all_read') {
        $user_id = $data['user_id'] ?? 0;
        
        if (!$user_id) {
            echo json_encode(['status' => 'error', 'message' => 'User ID required']);
            exit;
        }
        
        try {
            $stmt = $conn->prepare("UPDATE notifications SET is_read = TRUE WHERE user_id = ?");
            $stmt->bind_param("i", $user_id);
            
            if ($stmt->execute()) {
                echo json_encode(['status' => 'success', 'message' => 'All notifications marked as read']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Failed to update notifications']);
            }
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
        }
        exit;
    }
}

// DELETE - Delete notification
if ($method === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    $notification_id = $data['notification_id'] ?? 0;
    $user_id = $data['user_id'] ?? 0;
    
    if (!$notification_id || !$user_id) {
        echo json_encode(['status' => 'error', 'message' => 'Notification ID and User ID required']);
        exit;
    }
    
    try {
        $stmt = $conn->prepare("DELETE FROM notifications WHERE id = ? AND user_id = ?");
        $stmt->bind_param("ii", $notification_id, $user_id);
        
        if ($stmt->execute()) {
            echo json_encode(['status' => 'success', 'message' => 'Notification deleted']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to delete notification']);
        }
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
    }
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Invalid method']);
$conn->close();
