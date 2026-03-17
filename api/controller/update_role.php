<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(200); exit; }

require '../config/db.php';

// Get POST data
$user_id = $_POST['user_id'] ?? null;
$new_role = strtolower($_POST['role'] ?? '');

if(!$user_id || $new_role !== 'driver'){
    echo json_encode(['status'=>'error','message'=>'Invalid user or role']);
    exit;
}

// 1️⃣ Update role in users table
$stmt = $conn->prepare("UPDATE users SET role = ? WHERE id = ?");
$stmt->bind_param("si", $new_role, $user_id);

if($stmt->execute()){

    // 2️⃣ Insert into drivers table
    // Use correct column names: assigned_route_id, assigned_bus_id
    $stmt2 = $conn->prepare(
        "INSERT INTO drivers (user_id, assigned_route_id, assigned_bus_id, status, rating, total_trips) 
         SELECT id, NULL, NULL, 'active', 5.00, 0 
         FROM users WHERE id = ?
         ON DUPLICATE KEY UPDATE status = 'active'"
    );
    $stmt2->bind_param("i", $user_id);
    $stmt2->execute();

    // 3️⃣ Optional: Remove from passengers
    $stmt3 = $conn->prepare("DELETE FROM passengers WHERE user_id = ?");
    $stmt3->bind_param("i", $user_id);
    $stmt3->execute();

    echo json_encode(['status'=>'success','message'=>'User role updated to driver and added to drivers table']);
} else {
    echo json_encode(['status'=>'error','message'=>'Update failed: '.$stmt->error]);
}

$stmt->close();
$conn->close();
