<?php
// Turn off error display to return JSON instead of HTML
error_reporting(0);
ini_set('display_errors', 0);

require_once("../../config/db.php");

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(200); exit; }

$method = $_SERVER["REQUEST_METHOD"];

// Get input data
$input = json_decode(file_get_contents("php://input"), true);
$user_id = isset($input["user_id"]) ? intval($input["user_id"]) : 0;
$action = isset($input["action"]) ? $input["action"] : "view";

if ($method === "GET") {
  $user_id = isset($_GET["user_id"]) ? intval($_GET["user_id"]) : 0;
  $action = isset($_GET["action"]) ? $_GET["action"] : "view";
}

if ($method === "GET" || $method === "POST") {
  if ($action === "view") {
    // Get driver profile
    if ($user_id <= 0) {
      http_response_code(400);
      echo json_encode(["status" => "error", "message" => "User ID is required"]);
      exit;
    }

    $sql = "SELECT 
      u.id,
      u.name,
      u.username,
      u.email,
      u.phone,
      u.gender,
      u.role,
      u.created_at,
      d.license_number,
      d.license_expiry,
      d.status AS driver_status,
      d.rating,
      d.total_trips,
      d.assigned_bus_id,
      d.assigned_route_id
    FROM users u
    LEFT JOIN drivers d ON d.user_id = u.id
    WHERE u.id = ?";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
      http_response_code(500);
      echo json_encode(["status" => "error", "message" => "Prepare failed", "details" => $conn->error]);
      exit;
    }
    
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
      http_response_code(404);
      echo json_encode(["status" => "error", "message" => "Driver not found"]);
      exit;
    }
    
    $driver = $result->fetch_assoc();
    
    // Get assigned bus info if available
    if ($driver['assigned_bus_id']) {
      $bus_sql = "SELECT bus_number, bus_name, bus_type FROM buses WHERE id = ?";
      $bus_stmt = $conn->prepare($bus_sql);
      $bus_stmt->bind_param("i", $driver['assigned_bus_id']);
      $bus_stmt->execute();
      $bus_result = $bus_stmt->get_result();
      if ($bus_result->num_rows > 0) {
        $bus = $bus_result->fetch_assoc();
        $driver['assigned_bus'] = $bus;
      }
    }
    
    // Get assigned route info if available
    if ($driver['assigned_route_id']) {
      $route_sql = "SELECT route_code, origin, destination, distance_km FROM routes WHERE id = ?";
      $route_stmt = $conn->prepare($route_sql);
      $route_stmt->bind_param("i", $driver['assigned_route_id']);
      $route_stmt->execute();
      $route_result = $route_stmt->get_result();
      if ($route_result->num_rows > 0) {
        $route = $route_result->fetch_assoc();
        $driver['assigned_route'] = $route;
      }
    }
    
    echo json_encode(["status" => "success", "data" => $driver]);
    exit;
    
  } elseif ($action === "update") {
    // Update driver profile
    if ($user_id <= 0) {
      http_response_code(400);
      echo json_encode(["status" => "error", "message" => "User ID is required"]);
      exit;
    }
    
    $name = isset($input["name"]) ? trim($input["name"]) : "";
    $phone = isset($input["phone"]) ? trim($input["phone"]) : "";
    
    if (empty($name)) {
      http_response_code(400);
      echo json_encode(["status" => "error", "message" => "Name is required"]);
      exit;
    }
    
    // Update users table
    $update_sql = "UPDATE users SET name = ?, phone = ? WHERE id = ?";
    $update_stmt = $conn->prepare($update_sql);
    $update_stmt->bind_param("ssi", $name, $phone, $user_id);
    
    if ($update_stmt->execute()) {
      // Get updated user data
      $sql = "SELECT id, name, username, email, phone, role FROM users WHERE id = ?";
      $stmt = $conn->prepare($sql);
      $stmt->bind_param("i", $user_id);
      $stmt->execute();
      $result = $stmt->get_result();
      $user = $result->fetch_assoc();
      
      echo json_encode(["status" => "success", "message" => "Profile updated successfully", "data" => $user]);
    } else {
      http_response_code(500);
      echo json_encode(["status" => "error", "message" => "Failed to update profile"]);
    }
    exit;
  }
}

http_response_code(405);
echo json_encode(["status" => "error", "message" => "Method not allowed"]);
