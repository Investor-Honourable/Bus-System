<?php
session_start();
require 'config/db.php';

// Enable CORS for React/Vite frontend
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Enable errors for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Get JSON input
$data = json_decode(file_get_contents("php://input"), true);

$action = $data['action'] ?? 'login';

// Login action
if ($action === 'login') {
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';

    // Validate required fields
    if (!$email || !$password) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Email and password are required'
        ]);
        exit;
    }

    // Check if user exists
    $stmt = $conn->prepare("SELECT id, name, email, password, role FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid email or password'
        ]);
        $stmt->close();
        exit;
    }

    $user = $result->fetch_assoc();
    $stmt->close();

    // Verify password
    if (password_verify($password, $user['password'])) {
        // Create session
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_name'] = $user['name'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_role'] = $user['role'];

        echo json_encode([
            'status' => 'success',
            'message' => 'Login successful',
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role']
            ]
        ]);
    } else {
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid email or password'
        ]);
    }
    exit;
}

// Register action
if ($action === 'register') {
    $name = $data['name'] ?? '';
    $username = $data['username'] ?? null;
    $email = $data['email'] ?? '';
    $phone = $data['phone'] ?? null;
    $gender = $data['gender'] ?? null;
    $password = $data['password'] ?? '';

    // Validate required fields
    if (!$name || !$email || !$password) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Name, email, and password are required'
        ]);
        exit;
    }

    // Check if email already exists
    $stmtCheck = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmtCheck->bind_param("s", $email);
    $stmtCheck->execute();
    $stmtCheck->store_result();
    
    if ($stmtCheck->num_rows > 0) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Email already registered'
        ]);
        $stmtCheck->close();
        exit;
    }
    $stmtCheck->close();

    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Insert into users as passenger
    $stmt = $conn->prepare("
        INSERT INTO users (name, username, email, phone, gender, password, role)
        VALUES (?, ?, ?, ?, ?, ?, 'passenger')
    ");
    $stmt->bind_param("ssssss", $name, $username, $email, $phone, $gender, $hashedPassword);

    if ($stmt->execute()) {
        $user_id = $stmt->insert_id;

        // Insert into passengers table
        $stmt2 = $conn->prepare("
            INSERT INTO passengers (user_id, name, username, phone, gender)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt2->bind_param("issss", $user_id, $name, $username, $phone, $gender);
        $stmt2->execute();
        $stmt2->close();

        // Create session
        $_SESSION['user_id'] = $user_id;
        $_SESSION['user_name'] = $name;
        $_SESSION['user_email'] = $email;
        $_SESSION['user_role'] = 'passenger';

        // Return JSON including user info
        echo json_encode([
            'status' => 'success',
            'message' => 'User registered successfully',
            'user' => [
                'id' => $user_id,
                'name' => $name,
                'email' => $email,
                'role' => 'passenger'
            ]
        ]);
    } else {
        echo json_encode([
            'status' => 'error',
            'message' => 'Registration failed: ' . $stmt->error
        ]);
    }

    $stmt->close();
    exit;
}

// Invalid action
echo json_encode([
    'status' => 'error',
    'message' => 'Invalid action'
]);

$conn->close();
