<?php
// Driver settings API
error_reporting(0);
ini_set('display_errors', 0);

require_once("../../config/db.php");

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(200); exit; }

$method = $_SERVER["REQUEST_METHOD"];
$input = json_decode(file_get_contents("php://input"), true);
$user_id = isset($input["user_id"]) ? intval($input["user_id"]) : 0;

if ($method === "GET") {
  $user_id = isset($_GET["user_id"]) ? intval($_GET["user_id"]) : 0;
}

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

// Ensure table exists - drop and recreate to ensure correct schema
$conn->query("DROP TABLE IF EXISTS driver_settings");
$conn->query("CREATE TABLE driver_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  setting_key VARCHAR(50) NOT NULL,
  setting_value VARCHAR(10) DEFAULT 'true',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_setting (user_id, setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

// GET - Fetch settings
if ($method === "GET") {
  $settings = [
    "notify_trips" => true,
    "notify_passengers" => true,
    "notify_changes" => true
  ];
  
  $result = $conn->query("SELECT setting_key, setting_value FROM driver_settings WHERE user_id = " . intval($user_id));
  
  // Debug: Check for errors
  if (!$result) {
    echo json_encode(["status" => "error", "message" => $conn->error, "query" => "SELECT failed"]);
    exit;
  }
  
  if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
      if ($row['setting_value'] === '1' || $row['setting_value'] === 'true') {
        $settings[$row['setting_key']] = true;
      } else {
        $settings[$row['setting_key']] = false;
      }
    }
  }
  
  echo json_encode(["status" => "success", "data" => $settings, "debug" => ["rows" => $result->num_rows, "user_id" => $user_id]]);
  exit;
}

// POST - Save settings
if ($method === "POST") {
  $settings = $input["settings"] ?? [];
  
  foreach ($settings as $key => $value) {
    $value_str = $value ? 'true' : 'false';
    $safe_key = $conn->real_escape_string($key);
    
    // Check if exists
    $check = $conn->query("SELECT id FROM driver_settings WHERE user_id = " . intval($user_id) . " AND setting_key = '$safe_key'");
    
    if ($check && $check->num_rows > 0) {
      // Update
      $conn->query("UPDATE driver_settings SET setting_value = '$value_str' WHERE user_id = " . intval($user_id) . " AND setting_key = '$safe_key'");
    } else {
      // Insert
      $conn->query("INSERT INTO driver_settings (user_id, setting_key, setting_value) VALUES (" . intval($user_id) . ", '$safe_key', '$value_str')");
    }
  }
  
  echo json_encode(["status" => "success", "message" => "Settings saved"]);
  exit;
}

http_response_code(405);
echo json_encode(["status" => "error", "message" => "Method not allowed"]);
