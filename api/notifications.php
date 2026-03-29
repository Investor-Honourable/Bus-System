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
            
            echo json_encode(['status' => 'success', 'notifications' => $notifications]);
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
                echo json_encode(['status' => 'success', 'message' => 'Notification created', 'id' => $conn->insert_id]);
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
