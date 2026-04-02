<?php
/**
 * Admin Drivers API
 * Handles driver management for administrators
 */

session_start();
require_once '../../config/db.php';

// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// GET - Fetch all drivers
if ($method === 'GET') {
    try {
        $sql = "SELECT d.*, u.name, u.email, u.phone, u.gender,
                b.bus_number, b.bus_name as assigned_bus_name,
                r.route_code, r.origin, r.destination as assigned_route_name
                FROM drivers d
                JOIN users u ON d.user_id = u.id
                LEFT JOIN buses b ON d.assigned_bus_id = b.id
                LEFT JOIN routes r ON d.assigned_route_id = r.id
                ORDER BY u.name";
        
        $result = $conn->query($sql);
        $drivers = [];
        
        while ($row = $result->fetch_assoc()) {
            $drivers[] = $row;
        }
        
        echo json_encode(['status' => 'success', 'drivers' => $drivers]);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Failed to fetch drivers: ' . $e->getMessage()]);
    }
    exit;
}

// POST - Add new driver
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $name = $data['name'] ?? '';
    $email = $data['email'] ?? '';
    $phone = $data['phone'] ?? '';
    $gender = $data['gender'] ?? '';
    $password = $data['password'] ?? '';
    $license_number = $data['license_number'] ?? '';
    $license_expiry = $data['license_expiry'] ?? '';
    $license_type = $data['license_type'] ?? 'Class B';
    
    if (!$name || !$email || !$password || !$license_number || !$license_expiry) {
        echo json_encode(['status' => 'error', 'message' => 'All fields are required']);
        exit;
    }
    
    try {
        // Check if email exists
        $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            echo json_encode(['status' => 'error', 'message' => 'Email already registered']);
            exit;
        }
        
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);
        
        // Create user
        $stmt = $conn->prepare("INSERT INTO users (name, email, phone, gender, password, role) VALUES (?, ?, ?, ?, ?, 'driver')");
        $stmt->bind_param("sssss", $name, $email, $phone, $gender, $hashed_password);
        
        if ($stmt->execute()) {
            $user_id = $conn->insert_id;
            
            // Create driver record
            $stmt = $conn->prepare("INSERT INTO drivers (user_id, license_number, license_expiry, license_type, status) VALUES (?, ?, ?, ?, 'active')");
            $stmt->bind_param("isss", $user_id, $license_number, $license_expiry, $license_type);
            $stmt->execute();
            
            // Create user settings
            $stmt = $conn->prepare("INSERT INTO user_settings (user_id) VALUES (?)");
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            
            echo json_encode(['status' => 'success', 'message' => 'Driver added successfully', 'id' => $user_id]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to add driver: ' . $stmt->error]);
        }
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
    }
    exit;
}

// PUT - Update driver
if ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $id = $data['id'] ?? 0;
    $name = $data['name'] ?? '';
    $email = $data['email'] ?? '';
    $phone = $data['phone'] ?? '';
    $gender = $data['gender'] ?? '';
    $password = $data['password'] ?? '';
    $license_number = $data['license_number'] ?? '';
    $license_expiry = $data['license_expiry'] ?? '';
    $license_type = $data['license_type'] ?? 'Class B';
    $status = $data['status'] ?? 'active';
    $assigned_bus_id = $data['assigned_bus_id'] ?? null;
    $assigned_route_id = $data['assigned_route_id'] ?? null;
    
    if (!$id) {
        echo json_encode(['status' => 'error', 'message' => 'Driver ID required']);
        exit;
    }
    
    try {
        // Get user_id from driver
        $stmt = $conn->prepare("SELECT user_id FROM drivers WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $driver = $result->fetch_assoc();
        
        if (!$driver) {
            echo json_encode(['status' => 'error', 'message' => 'Driver not found']);
            exit;
        }
        
        // Update user
        if ($password) {
            $hashed_password = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $conn->prepare("UPDATE users SET name = ?, email = ?, phone = ?, gender = ?, password = ? WHERE id = ?");
            $stmt->bind_param("sssssi", $name, $email, $phone, $gender, $hashed_password, $driver['user_id']);
        } else {
            $stmt = $conn->prepare("UPDATE users SET name = ?, email = ?, phone = ?, gender = ? WHERE id = ?");
            $stmt->bind_param("ssssi", $name, $email, $phone, $gender, $driver['user_id']);
        }
        $stmt->execute();
        
        // Update driver
        $stmt = $conn->prepare("UPDATE drivers SET license_number = ?, license_expiry = ?, license_type = ?, status = ?, assigned_bus_id = ?, assigned_route_id = ? WHERE id = ?");
        $stmt->bind_param("sssiiii", $license_number, $license_expiry, $license_type, $status, $assigned_bus_id, $assigned_route_id, $id);
        
        if ($stmt->execute()) {
            echo json_encode(['status' => 'success', 'message' => 'Driver updated successfully']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to update driver: ' . $stmt->error]);
        }
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
    }
    exit;
}

// DELETE - Delete driver
if ($method === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? 0;
    
    if (!$id) {
        echo json_encode(['status' => 'error', 'message' => 'Driver ID required']);
        exit;
    }
    
    try {
        // Get user_id from driver
        $stmt = $conn->prepare("SELECT user_id FROM drivers WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $driver = $result->fetch_assoc();
        
        if (!$driver) {
            echo json_encode(['status' => 'error', 'message' => 'Driver not found']);
            exit;
        }
        
        // Check if driver has active trips
        $stmt = $conn->prepare("SELECT COUNT(*) as trip_count FROM trips WHERE driver_id = ? AND status IN ('scheduled', 'boarding', 'in_transit')");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        
        if ($row['trip_count'] > 0) {
            echo json_encode(['status' => 'error', 'message' => 'Cannot delete driver with active trips']);
            exit;
        }
        
        // Delete driver
        $stmt = $conn->prepare("DELETE FROM drivers WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        
        // Delete user
        $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
        $stmt->bind_param("i", $driver['user_id']);
        $stmt->execute();
        
        echo json_encode(['status' => 'success', 'message' => 'Driver deleted successfully']);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
    }
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Invalid method']);
$conn->close();
