<?php
// Driver change password API
error_reporting(0);
ini_set('display_errors', 0);

require_once("../../config/db.php");

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(200); exit; }

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
  http_response_code(405);
  echo json_encode(["status" => "error", "message" => "Method not allowed"]);
  exit;
}

$input = json_decode(file_get_contents("php://input"), true);
$user_id = isset($input["user_id"]) ? intval($input["user_id"]) : 0;
$current_password = $input["current_password"] ?? "";
$new_password = $input["new_password"] ?? "";
$confirm_password = $input["confirm_password"] ?? "";

if ($user_id <= 0) {
  http_response_code(400);
  echo json_encode(["status" => "error", "message" => "User ID is required"]);
  exit;
}

// Verify user role
$verify_sql = "SELECT id, role FROM users WHERE id = ?";
$verify_stmt = $conn->prepare($verify_sql);
$verify_stmt->bind_param("i", $user_id);
$verify_stmt->execute();
$verify_result = $verify_stmt->get_result();

if ($verify_result->num_rows === 0) {
  http_response_code(401);
  echo json_encode(["status" => "error", "message" => "User not found"]);
  exit;
}

$user = $verify_result->fetch_assoc();
if ($user['role'] !== 'driver') {
  http_response_code(403);
  echo json_encode(["status" => "error", "message" => "Access denied. Driver role required."]);
  exit;
}

if (empty($current_password) || empty($new_password) || empty($confirm_password)) {
  http_response_code(400);
  echo json_encode(["status" => "error", "message" => "All password fields are required"]);
  exit;
}

if ($new_password !== $confirm_password) {
  http_response_code(400);
  echo json_encode(["status" => "error", "message" => "New passwords do not match"]);
  exit;
}

if (strlen($new_password) < 6) {
  http_response_code(400);
  echo json_encode(["status" => "error", "message" => "Password must be at least 6 characters"]);
  exit;
}

// Get current password hash from database
$sql = "SELECT password FROM users WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
  http_response_code(404);
  echo json_encode(["status" => "error", "message" => "User not found"]);
  exit;
}

$row = $result->fetch_assoc();

// Verify current password
if (!password_verify($current_password, $row['password'])) {
  http_response_code(400);
  echo json_encode(["status" => "error", "message" => "Current password is incorrect"]);
  exit;
}

// Hash new password
$new_password_hash = password_hash($new_password, PASSWORD_DEFAULT);

// Update password
$update_sql = "UPDATE users SET password = ? WHERE id = ?";
$update_stmt = $conn->prepare($update_sql);
$update_stmt->bind_param("si", $new_password_hash, $user_id);

if ($update_stmt->execute()) {
  echo json_encode(["status" => "success", "message" => "Password updated successfully"]);
} else {
  http_response_code(500);
  echo json_encode(["status" => "error", "message" => "Failed to update password"]);
}

$stmt->close();
$conn->close();
