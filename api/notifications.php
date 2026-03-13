<?php
// Notifications API - Handle all notification operations

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database connection
$host = 'localhost';
$dbname = 'bus_system';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed']);
    exit();
}

// Get request method and action
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Get user from header or session (simplified - in production use proper auth)
$userId = isset($_SERVER['HTTP_USER_ID']) ? intval($_SERVER['HTTP_USER_ID']) : 0;

switch ($method) {
    case 'GET':
        handleGet($pdo, $action, $userId);
        break;
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        handlePost($pdo, $action, $userId, $input);
        break;
    case 'PUT':
        $input = json_decode(file_get_contents('php://input'), true);
        handlePut($pdo, $action, $userId, $input);
        break;
    default:
        echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
}

function handleGet($pdo, $action, $userId) {
    if ($action === 'list' || $action === '') {
        // Get notifications for user
        $stmt = $pdo->prepare("
            SELECT * FROM notifications 
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 50
        ");
        $stmt->execute([$userId]);
        $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get unread count
        $countStmt = $pdo->prepare("SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE");
        $countStmt->execute([$userId]);
        $unreadCount = $countStmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        echo json_encode([
            'status' => 'success',
            'notifications' => $notifications,
            'unread_count' => intval($unreadCount)
        ]);
    } elseif ($action === 'unread') {
        // Get only unread notifications
        $stmt = $pdo->prepare("
            SELECT * FROM notifications 
            WHERE user_id = ? AND is_read = FALSE
            ORDER BY created_at DESC
            LIMIT 20
        ");
        $stmt->execute([$userId]);
        $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'status' => 'success',
            'notifications' => $notifications
        ]);
    } elseif ($action === 'count') {
        // Get unread count only
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE");
        $stmt->execute([$userId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'status' => 'success',
            'count' => intval($result['count'])
        ]);
    } elseif ($action === 'all') {
        // Admin: Get all notifications (for all users)
        $stmt = $pdo->query("
            SELECT n.*, u.name as user_name, u.email as user_email
            FROM notifications n
            LEFT JOIN users u ON n.user_id = u.id
            ORDER BY n.created_at DESC
            LIMIT 100
        ");
        $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'status' => 'success',
            'notifications' => $notifications
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
    }
}

function handlePost($pdo, $action, $userId, $input) {
    if ($action === 'create' || $action === '') {
        // Create a new notification
        // Can be triggered by user actions (booking, cancellation) or admin
        
        $title = $input['title'] ?? 'Notification';
        $message = $input['message'] ?? '';
        $type = $input['type'] ?? 'system';
        $targetUserId = $input['user_id'] ?? $userId;
        $referenceType = $input['reference_type'] ?? null;
        $referenceId = $input['reference_id'] ?? null;
        
        $stmt = $pdo->prepare("
            INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        try {
            $stmt->execute([$targetUserId, $title, $message, $type, $referenceType, $referenceId]);
            $notificationId = $pdo->lastInsertId();
            
            echo json_encode([
                'status' => 'success',
                'message' => 'Notification created',
                'id' => $notificationId
            ]);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    } elseif ($action === 'send_to_all') {
        // Admin: Send notification to all users or specific role
        $title = $input['title'] ?? 'Notification';
        $message = $input['message'] ?? '';
        $type = $input['type'] ?? 'admin';
        $role = $input['role'] ?? null; // 'admin', 'driver', 'passenger', or null for all
        
        try {
            if ($role) {
                // Send to users with specific role
                $stmt = $pdo->prepare("SELECT id FROM users WHERE role = ?");
                $stmt->execute([$role]);
            } else {
                // Send to all users
                $stmt = $pdo->query("SELECT id FROM users");
            }
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $insertStmt = $pdo->prepare("
                INSERT INTO notifications (user_id, title, message, type)
                VALUES (?, ?, ?, ?)
            ");
            
            $count = 0;
            foreach ($users as $user) {
                $insertStmt->execute([$user['id'], $title, $message, $type]);
                $count++;
            }
            
            echo json_encode([
                'status' => 'success',
                'message' => "Notification sent to $count users",
                'count' => $count
            ]);
        } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
    }
}

function handlePut($pdo, $action, $userId, $input) {
    if ($action === 'mark_read' || $action === '') {
        // Mark a single notification as read
        $notificationId = $input['id'] ?? 0;
        
        $stmt = $pdo->prepare("
            UPDATE notifications 
            SET is_read = TRUE 
            WHERE id = ? AND user_id = ?
        ");
        $stmt->execute([$notificationId, $userId]);
        
        echo json_encode([
            'status' => 'success',
            'message' => 'Notification marked as read'
        ]);
    } elseif ($action === 'mark_all_read') {
        // Mark all notifications as read
        $stmt = $pdo->prepare("UPDATE notifications SET is_read = TRUE WHERE user_id = ?");
        $stmt->execute([$userId]);
        
        echo json_encode([
            'status' => 'success',
            'message' => 'All notifications marked as read'
        ]);
    } elseif ($action === 'delete') {
        // Delete a notification
        $notificationId = $input['id'] ?? 0;
        
        $stmt = $pdo->prepare("DELETE FROM notifications WHERE id = ? AND user_id = ?");
        $stmt->execute([$notificationId, $userId]);
        
        echo json_encode([
            'status' => 'success',
            'message' => 'Notification deleted'
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
    }
}
