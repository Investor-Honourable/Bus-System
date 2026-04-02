<?php
/**
 * Admin Users API
 * Handles user management for administrators
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

// GET - Fetch all users
if ($method === 'GET') {
    try {
        $result = $conn->query("SELECT id, name, username, email, phone, gender, role, is_active, created_at FROM users ORDER BY created_at DESC");
        $users = [];
        
        while ($row = $result->fetch_assoc()) {
            $users[] = $row;
        }
        
        echo json_encode(['status' => 'success', 'users' => $users]);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Failed to fetch users: ' . $e->getMessage()]);
    }
    exit;
}

// POST - Add new user
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $name = $data['name'] ?? '';
    $username = $data['username'] ?? null;
    $email = $data['email'] ?? '';
    $phone = $data['phone'] ?? null;
    $gender = $data['gender'] ?? null;
    $password = $data['password'] ?? '';
    $role = $data['role'] ?? 'passenger';
    
    if (!$name || !$email || !$password) {
        echo json_encode(['status' => 'error', 'message' => 'Name, email, and password are required']);
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
        
        $stmt = $conn->prepare("INSERT INTO users (name, username, email, phone, gender, password, role) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("sssssss", $name, $username, $email, $phone, $gender, $hashed_password, $role);
        
        if ($stmt->execute()) {
            $user_id = $conn->insert_id;
            
            // Create passenger record if role is passenger
            if ($role === 'passenger') {
                $stmt = $conn->prepare("INSERT INTO passengers (user_id, name, username, phone, gender) VALUES (?, ?, ?, ?, ?)");
                $stmt->bind_param("issss", $user_id, $name, $username, $phone, $gender);
                $stmt->execute();
            }
            
            // Create driver record if role is driver
            if ($role === 'driver') {
                $license_number = 'DL' . str_pad($user_id, 8, '0', STR_PAD_LEFT);
                $stmt = $conn->prepare("INSERT INTO drivers (user_id, license_number, license_expiry, status) VALUES (?, ?, DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 'active')");
                $stmt->bind_param("is", $user_id, $license_number);
                $stmt->execute();
            }
            
            // Create user settings
            $stmt = $conn->prepare("INSERT INTO user_settings (user_id) VALUES (?)");
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            
            echo json_encode(['status' => 'success', 'message' => 'User added successfully', 'id' => $user_id]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to add user: ' . $stmt->error]);
        }
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
    }
    exit;
}

// PUT - Update user
if ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $id = $data['id'] ?? 0;
    
    if (!$id) {
        echo json_encode(['status' => 'error', 'message' => 'User ID required']);
        exit;
    }
    
    try {
        // Build dynamic UPDATE query based on provided fields
        $updates = [];
        $types = '';
        $values = [];
        
        // Check each field and add to update if provided
        if (isset($data['name'])) {
            $updates[] = 'name = ?';
            $types .= 's';
            $values[] = $data['name'];
        }
        if (isset($data['username'])) {
            $updates[] = 'username = ?';
            $types .= 's';
            $values[] = $data['username'];
        }
        if (isset($data['email'])) {
            $updates[] = 'email = ?';
            $types .= 's';
            $values[] = $data['email'];
        }
        if (isset($data['phone'])) {
            $updates[] = 'phone = ?';
            $types .= 's';
            $values[] = $data['phone'];
        }
        if (isset($data['gender'])) {
            $updates[] = 'gender = ?';
            $types .= 's';
            $values[] = $data['gender'];
        }
        if (isset($data['role'])) {
            $updates[] = 'role = ?';
            $types .= 's';
            $values[] = $data['role'];
        }
        if (isset($data['is_active'])) {
            $updates[] = 'is_active = ?';
            $types .= 'i';
            $values[] = $data['is_active'];
        }
        
        // If no fields to update, return error
        if (empty($updates)) {
            echo json_encode(['status' => 'error', 'message' => 'No fields to update']);
            exit;
        }
        
        // Add ID to values
        $types .= 'i';
        $values[] = $id;
        
        // Build and execute query
        $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$values);
        
        if ($stmt->execute()) {
            // If role was updated, also update related records
            if (isset($data['role'])) {
                $new_role = $data['role'];
                
                // Create passenger record if role is passenger
                if ($new_role === 'passenger') {
                    // Check if passenger record exists
                    $check_stmt = $conn->prepare("SELECT id FROM passengers WHERE user_id = ?");
                    $check_stmt->bind_param("i", $id);
                    $check_stmt->execute();
                    $result = $check_stmt->get_result();
                    
                    if ($result->num_rows === 0) {
                        // Get user info for passenger record
                        $user_stmt = $conn->prepare("SELECT name, username, phone, gender FROM users WHERE id = ?");
                        $user_stmt->bind_param("i", $id);
                        $user_stmt->execute();
                        $user_result = $user_stmt->get_result();
                        $user_data = $user_result->fetch_assoc();
                        
                        $insert_stmt = $conn->prepare("INSERT INTO passengers (user_id, name, username, phone, gender) VALUES (?, ?, ?, ?, ?)");
                        $insert_stmt->bind_param("issss", $id, $user_data['name'], $user_data['username'], $user_data['phone'], $user_data['gender']);
                        $insert_stmt->execute();
                    }
                }
                
                // Create driver record if role is driver
                if ($new_role === 'driver') {
                    // Check if driver record exists
                    $check_stmt = $conn->prepare("SELECT id FROM drivers WHERE user_id = ?");
                    $check_stmt->bind_param("i", $id);
                    $check_stmt->execute();
                    $result = $check_stmt->get_result();
                    
                    if ($result->num_rows === 0) {
                        $license_number = 'DL' . str_pad($id, 8, '0', STR_PAD_LEFT);
                        $insert_stmt = $conn->prepare("INSERT INTO drivers (user_id, license_number, license_expiry, status) VALUES (?, ?, DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 'active')");
                        $insert_stmt->bind_param("is", $id, $license_number);
                        $insert_stmt->execute();
                    }
                }
            }
            
            echo json_encode(['status' => 'success', 'message' => 'User updated successfully']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to update user: ' . $stmt->error]);
        }
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
    }
    exit;
}

// DELETE - Delete user
if ($method === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? 0;
    
    if (!$id) {
        echo json_encode(['status' => 'error', 'message' => 'User ID required']);
        exit;
    }
    
    try {
        // Check if user has active bookings
        $stmt = $conn->prepare("SELECT COUNT(*) as booking_count FROM bookings WHERE user_id = ? AND booking_status = 'confirmed'");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        
        if ($row['booking_count'] > 0) {
            echo json_encode(['status' => 'error', 'message' => 'Cannot delete user with active bookings']);
            exit;
        }
        
        $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            echo json_encode(['status' => 'success', 'message' => 'User deleted successfully']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to delete user']);
        }
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
    }
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Invalid method']);
$conn->close();
