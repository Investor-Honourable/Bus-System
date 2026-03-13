<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(200); exit; }

require_once __DIR__ . '/../../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Get all drivers with user information
    $query = "
        SELECT 
            d.id,
            d.user_id,
            d.license_number,
            d.license_expiry,
            d.status as driver_status,
            d.assigned_bus_id,
            d.assigned_route_id,
            d.rating,
            d.total_trips,
            d.created_at,
            u.name,
            u.username,
            u.email,
            u.phone,
            u.gender,
            u.role,
            u.created_at as user_created_at
        FROM drivers d
        INNER JOIN users u ON d.user_id = u.id
        ORDER BY d.created_at DESC
    ";
    
    $result = mysqli_query($conn, $query);
    
    if (!$result) {
        echo json_encode(['success' => false, 'message' => mysqli_error($conn)]);
        exit;
    }
    
    $drivers = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $drivers[] = $row;
    }
    
    // If no drivers table data, fall back to users with driver role
    if (empty($drivers)) {
        $query = "SELECT * FROM users WHERE role = 'driver' ORDER BY created_at DESC";
        $result = mysqli_query($conn, $query);
        
        if ($result) {
            while ($row = mysqli_fetch_assoc($result)) {
                $drivers[] = [
                    'id' => $row['id'],
                    'user_id' => $row['id'],
                    'license_number' => 'DL' . str_pad($row['id'], 8, '0', STR_PAD_LEFT),
                    'license_expiry' => date('Y-m-d', strtotime('+1 year')),
                    'driver_status' => 'active',
                    'assigned_bus_id' => null,
                    'assigned_route_id' => null,
                    'rating' => '5.00',
                    'total_trips' => 0,
                    'created_at' => $row['created_at'],
                    'name' => $row['name'],
                    'username' => $row['username'],
                    'email' => $row['email'],
                    'phone' => $row['phone'],
                    'gender' => $row['gender'],
                    'role' => $row['role'],
                    'user_created_at' => $row['created_at']
                ];
            }
        }
    }
    
    echo json_encode(['success' => true, 'data' => $drivers]);
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['user_id']) || !isset($input['license_number'])) {
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        exit;
    }
    
    $user_id = intval($input['user_id']);
    $license_number = mysqli_real_escape_string($conn, $input['license_number']);
    $license_expiry = isset($input['license_expiry']) ? mysqli_real_escape_string($conn, $input['license_expiry']) : date('Y-m-d', strtotime('+1 year'));
    $status = isset($input['status']) ? mysqli_real_escape_string($conn, $input['status']) : 'active';
    
    // Check if driver already exists
    $check = "SELECT id FROM drivers WHERE user_id = $user_id";
    $checkResult = mysqli_query($conn, $check);
    
    if (mysqli_num_rows($checkResult) > 0) {
        // Update existing driver
        $query = "UPDATE drivers SET license_number = '$license_number', license_expiry = '$license_expiry', status = '$status' WHERE user_id = $user_id";
    } else {
        // Insert new driver
        $query = "INSERT INTO drivers (user_id, license_number, license_expiry, status) VALUES ($user_id, '$license_number', '$license_expiry', '$status')";
    }
    
    if (mysqli_query($conn, $query)) {
        echo json_encode(['success' => true, 'message' => 'Driver saved successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => mysqli_error($conn)]);
    }
    exit;
}

if ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Check for id in body or query string
    $id = 0;
    if (isset($input['id'])) {
        $id = intval($input['id']);
    } elseif (isset($_GET['id'])) {
        $id = intval($_GET['id']);
    }
    
    if ($id <= 0) {
        echo json_encode(['success' => false, 'message' => 'Driver ID is required']);
        exit;
    }
    
    // Get user_id from drivers table to update user record
    $getUserIdQuery = "SELECT user_id FROM drivers WHERE id = $id";
    $userIdResult = mysqli_query($conn, $getUserIdQuery);
    $userId = $id; // Default to id if driver record doesn't exist
    if ($userIdResult && mysqli_num_rows($userIdResult) > 0) {
        $userIdRow = mysqli_fetch_assoc($userIdResult);
        $userId = intval($userIdRow['user_id']);
    }
    
    // Update user table for username and phone if provided
    if (isset($input['username']) && !empty($input['username'])) {
        $username = mysqli_real_escape_string($conn, $input['username']);
        mysqli_query($conn, "UPDATE users SET name = '$username', username = '$username' WHERE id = $userId");
    }
    
    if (isset($input['phone'])) {
        $phone = mysqli_real_escape_string($conn, $input['phone']);
        mysqli_query($conn, "UPDATE users SET phone = '$phone' WHERE id = $userId");
    }
    
    $license_number = isset($input['license_number']) ? mysqli_real_escape_string($conn, $input['license_number']) : '';
    $license_expiry = isset($input['license_expiry']) ? mysqli_real_escape_string($conn, $input['license_expiry']) : null;
    $status = isset($input['status']) ? mysqli_real_escape_string($conn, $input['status']) : 'active';
    
    // Handle assignment IDs - only update if explicitly provided
    $has_bus_assignment = isset($input['assigned_bus_id']) && $input['assigned_bus_id'] !== '' && $input['assigned_bus_id'] !== null;
    $has_route_assignment = isset($input['assigned_route_id']) && $input['assigned_route_id'] !== '' && $input['assigned_route_id'] !== null;
    
    $assigned_bus_id = 'NULL';
    if ($has_bus_assignment) {
        $assigned_bus_id = intval($input['assigned_bus_id']);
    }
    
    $assigned_route_id = 'NULL';
    if ($has_route_assignment) {
        $assigned_route_id = intval($input['assigned_route_id']);
    }
    
    // Check if driver exists first
    $checkQuery = "SELECT id, assigned_bus_id, assigned_route_id FROM drivers WHERE id = $id";
    $checkResult = mysqli_query($conn, $checkQuery);
    
    if ($checkResult && mysqli_num_rows($checkResult) > 0) {
        // Driver record exists - update it
        $query = "UPDATE drivers SET ";
        $updates = [];
        
        if (!empty($license_number)) {
            $updates[] = "license_number = '$license_number'";
        }
        
        if ($license_expiry) {
            $updates[] = "license_expiry = '$license_expiry'";
        }
        
        $updates[] = "status = '$status'";
        
        // Only update assignment fields if explicitly provided
        if ($has_bus_assignment) {
            $updates[] = "assigned_bus_id = " . $assigned_bus_id;
        }
        if ($has_route_assignment) {
            $updates[] = "assigned_route_id = " . $assigned_route_id;
        }
        
        $query .= implode(', ', $updates) . " WHERE id = $id";
        
        if (mysqli_query($conn, $query)) {
            echo json_encode(['success' => true, 'message' => 'Driver updated successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => mysqli_error($conn)]);
        }
    } else {
        // No driver record exists - check if user exists and create driver record
        $userCheck = mysqli_query($conn, "SELECT id FROM users WHERE id = $id AND role = 'driver'");
        if ($userCheck && mysqli_num_rows($userCheck) > 0) {
            // Create new driver record
            $insertQuery = "INSERT INTO drivers (user_id, license_number, status, assigned_bus_id, assigned_route_id) \n                           VALUES ($id, 'DL00000000', 'active', " . $assigned_bus_id . ", " . $assigned_route_id . ")\n                           ON DUPLICATE KEY UPDATE assigned_bus_id = " . $assigned_bus_id . ", assigned_route_id = " . $assigned_route_id;
            
            if (mysqli_query($conn, $insertQuery)) {
                echo json_encode(['success' => true, 'message' => 'Driver created and assigned successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => mysqli_error($conn)]);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'User not found or not a driver']);
        }
    }
    exit;
}

if ($method === 'DELETE') {
    if (!isset($_GET['id'])) {
        echo json_encode(['success' => false, 'message' => 'Driver ID required']);
        exit;
    }
    
    $id = intval($_GET['id']);
    
    // Get user_id to update user role back to passenger
    $getDriver = "SELECT user_id FROM drivers WHERE id = $id";
    $driverResult = mysqli_query($conn, $getDriver);
    
    if ($driverRow = mysqli_fetch_assoc($driverResult)) {
        $user_id = $driverRow['user_id'];
        
        // Delete driver record
        $query = "DELETE FROM drivers WHERE id = $id";
        
        if (mysqli_query($conn, $query)) {
            // Optionally update user role
            // mysqli_query($conn, "UPDATE users SET role = 'passenger' WHERE id = $user_id");
            echo json_encode(['success' => true, 'message' => 'Driver deleted successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => mysqli_error($conn)]);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Driver not found']);
    }
    exit;
}

echo json_encode(['success' => false, 'message' => 'Invalid request method']);
