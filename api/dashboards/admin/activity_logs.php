<?php
/**
 * Admin Activity Logs API
 * Handles activity logging and audit trail for administrators
 */

session_start();
require_once '../../config/db.php';

// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// GET - Fetch activity logs
if ($method === 'GET') {
    try {
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 100;
        $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
        $type = isset($_GET['type']) ? $_GET['type'] : null;
        $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;
        $start_date = isset($_GET['start_date']) ? $_GET['start_date'] : null;
        $end_date = isset($_GET['end_date']) ? $_GET['end_date'] : null;
        
        $sql = "SELECT al.*, u.name as user_name, u.email as user_email 
                FROM activity_logs al 
                LEFT JOIN users u ON al.user_id = u.id 
                WHERE 1=1";
        $params = [];
        $types = "";
        
        if ($type) {
            $sql .= " AND al.activity_type = ?";
            $params[] = $type;
            $types .= "s";
        }
        
        if ($user_id) {
            $sql .= " AND al.user_id = ?";
            $params[] = $user_id;
            $types .= "i";
        }
        
        if ($start_date) {
            $sql .= " AND DATE(al.created_at) >= ?";
            $params[] = $start_date;
            $types .= "s";
        }
        
        if ($end_date) {
            $sql .= " AND DATE(al.created_at) <= ?";
            $params[] = $end_date;
            $types .= "s";
        }
        
        $sql .= " ORDER BY al.created_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        $types .= "ii";
        
        $stmt = $conn->prepare($sql);
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        
        $logs = [];
        while ($row = $result->fetch_assoc()) {
            $logs[] = $row;
        }
        
        // Get total count
        $countSql = "SELECT COUNT(*) as total FROM activity_logs al WHERE 1=1";
        $countParams = [];
        $countTypes = "";
        
        if ($type) {
            $countSql .= " AND al.activity_type = ?";
            $countParams[] = $type;
            $countTypes .= "s";
        }
        
        if ($user_id) {
            $countSql .= " AND al.user_id = ?";
            $countParams[] = $user_id;
            $countTypes .= "i";
        }
        
        if ($start_date) {
            $countSql .= " AND DATE(al.created_at) >= ?";
            $countParams[] = $start_date;
            $countTypes .= "s";
        }
        
        if ($end_date) {
            $countSql .= " AND DATE(al.created_at) <= ?";
            $countParams[] = $end_date;
            $countTypes .= "s";
        }
        
        $countStmt = $conn->prepare($countSql);
        if (!empty($countParams)) {
            $countStmt->bind_param($countTypes, ...$countParams);
        }
        $countStmt->execute();
        $countResult = $countStmt->get_result();
        $countRow = $countResult->fetch_assoc();
        
        echo json_encode([
            'status' => 'success',
            'logs' => $logs,
            'total' => $countRow['total'],
            'limit' => $limit,
            'offset' => $offset
        ]);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Failed to fetch activity logs: ' . $e->getMessage()]);
    }
    exit;
}

// POST - Create activity log
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $user_id = $data['user_id'] ?? null;
    $activity_type = $data['activity_type'] ?? '';
    $description = $data['description'] ?? '';
    $ip_address = $data['ip_address'] ?? $_SERVER['REMOTE_ADDR'];
    $user_agent = $data['user_agent'] ?? $_SERVER['HTTP_USER_AGENT'] ?? '';
    $metadata = $data['metadata'] ?? null;
    
    if (!$activity_type || !$description) {
        echo json_encode(['status' => 'error', 'message' => 'Activity type and description are required']);
        exit;
    }
    
    try {
        $metadata_json = $metadata ? json_encode($metadata) : null;
        
        $stmt = $conn->prepare("INSERT INTO activity_logs (user_id, activity_type, description, ip_address, user_agent, metadata) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("isssss", $user_id, $activity_type, $description, $ip_address, $user_agent, $metadata_json);
        
        if ($stmt->execute()) {
            echo json_encode(['status' => 'success', 'message' => 'Activity logged successfully', 'id' => $conn->insert_id]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to log activity']);
        }
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
    }
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Invalid method']);
$conn->close();
