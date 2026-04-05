<?php
/**
 * Authentication API
 * Handles user login and registration
 */

session_start();
require 'config/db.php';

// CORS Configuration
$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed_origin = in_array($origin, $allowed_origins) ? $origin : $allowed_origins[0];

header("Access-Control-Allow-Origin: $allowed_origin");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Disable error display in production
$is_localhost = in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1', 'localhost']) || 
                strpos($_SERVER['HTTP_HOST'] ?? '', 'localhost') !== false;
if (!$is_localhost) {
    ini_set('display_errors', 0);
    error_reporting(0);
}

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

        // Create login notification
        $notifTitle = 'Login Detected';
        $notifMsg = 'You logged in at ' . date('Y-m-d H:i:s');
        $stmtNotif = $conn->prepare("INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)");
        $notifType = 'login';
        $stmtNotif->bind_param("isss", $user['id'], $notifTitle, $notifMsg, $notifType);
        $stmtNotif->execute();
        $stmtNotif->close();
        
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

    // Strong password validation (server-side)
    $passwordErrors = [];
    if (strlen($password) < 8) {
        $passwordErrors[] = "Password must be at least 8 characters";
    }
    if (!preg_match('/[A-Z]/', $password)) {
        $passwordErrors[] = "Password must contain at least one uppercase letter";
    }
    if (!preg_match('/[a-z]/', $password)) {
        $passwordErrors[] = "Password must contain at least one lowercase letter";
    }
    if (!preg_match('/[0-9]/', $password)) {
        $passwordErrors[] = "Password must contain at least one number";
    }
    if (!preg_match('/[!@#$%^&*(),.?\":{}|<>]/', $password)) {
        $passwordErrors[] = "Password must contain at least one special character";
    }

    if (!empty($passwordErrors)) {
        echo json_encode([
            'status' => 'error',
            'message' => implode(". ", $passwordErrors)
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

        // Create user settings
        $stmt3 = $conn->prepare("INSERT INTO user_settings (user_id) VALUES (?)");
        $stmt3->bind_param("i", $user_id);
        $stmt3->execute();
        $stmt3->close();

        // Create session
        $_SESSION['user_id'] = $user_id;
        $_SESSION['user_name'] = $name;
        $_SESSION['user_email'] = $email;
        $_SESSION['user_role'] = 'passenger';
        
        // Create welcome notifications for new user
        $notifications = [
            ['title' => 'Welcome to CamTransit!', 'message' => 'Thank you for joining CamTransit! Start planning your journeys today.', 'type' => 'system'],
            ['title' => 'Complete Your Profile', 'message' => 'Add your phone number and profile picture to get started.', 'type' => 'profile'],
            ['title' => 'Book Your First Trip', 'message' => 'Ready to travel? Browse routes and book your first bus trip now!', 'type' => 'booking']
        ];
        
        foreach ($notifications as $notif) {
            $stmt = $conn->prepare("INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("isss", $user_id, $notif['title'], $notif['message'], $notif['type']);
            $stmt->execute();
            $stmt->close();
        }
        
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
    
    if (isset($stmt)) $stmt->close();
    exit;
}

// Invalid action
echo json_encode([
    'status' => 'error',
    'message' => 'Invalid action'
]);

$conn->close();
