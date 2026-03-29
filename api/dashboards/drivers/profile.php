<?php
/**
 * Driver Profile API
 * Handles driver profile management
 */

session_start();
require_once '../../config/db.php';

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

// POST - Get or update driver profile
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $action = $data['action'] ?? 'get';
    $user_id = $data['user_id'] ?? 0;
    
    if (!$user_id) {
        echo json_encode(['status' => 'error', 'message' => 'User ID required']);
        exit;
    }
    
    // Get driver profile
    if ($action === 'get') {
        try {
            $sql = "SELECT d.*, u.name, u.email, u.phone, u.gender, u.avatar,
                    b.bus_number, b.bus_name as assigned_bus_name,
                    r.route_code, r.origin, r.destination as assigned_route_name
                    FROM drivers d
                    JOIN users u ON d.user_id = u.id
                    LEFT JOIN buses b ON d.assigned_bus_id = b.id
                    LEFT JOIN routes r ON d.assigned_route_id = r.id
                    WHERE d.user_id = ?";
            
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $driver = $result->fetch_assoc();
            
            if ($driver) {
                echo json_encode(['status' => 'success', 'driver' => $driver]);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Driver not found']);
            }
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => 'Failed to fetch profile: ' . $e->getMessage()]);
        }
        exit;
    }
    
    // Update driver profile
    if ($action === 'update') {
        $name = $data['name'] ?? '';
        $phone = $data['phone'] ?? '';
        $gender = $data['gender'] ?? '';
        $license_number = $data['license_number'] ?? '';
        $license_expiry = $data['license_expiry'] ?? '';
        $license_type = $data['license_type'] ?? 'Class B';
        
        if (!$name) {
            echo json_encode(['status' => 'error', 'message' => 'Name is required']);
            exit;
        }
        
        try {
            // Update user
            $stmt = $conn->prepare("UPDATE users SET name = ?, phone = ?, gender = ? WHERE id = ?");
            $stmt->bind_param("sssi", $name, $phone, $gender, $user_id);
            $stmt->execute();
            
            // Update driver
            $stmt = $conn->prepare("UPDATE drivers SET license_number = ?, license_expiry = ?, license_type = ? WHERE user_id = ?");
            $stmt->bind_param("sssi", $license_number, $license_expiry, $license_type, $user_id);
            
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
}

echo json_encode(['status' => 'error', 'message' => 'Invalid method']);
$conn->close();
