<?php
// Update trip status API - with driver authorization
error_reporting(0);
ini_set('display_errors', 0);

require_once("../../config/db.php");

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(200); exit; }

$method = $_SERVER["REQUEST_METHOD"];

if ($method === "POST" || $method === "PUT") {
  $input = json_decode(file_get_contents("php://input"), true);
  
  $trip_id = intval($input["trip_id"] ?? $input["schedule_id"] ?? 0);
  $status = strtolower(trim($input["status"] ?? ""));
  $driver_id = intval($input["driver_id"] ?? 0);
  
  if ($trip_id <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "trip_id is required"]);
    exit;
  }
  
  if ($driver_id <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "driver_id is required for authorization"]);
    exit;
  }
  
  // Verify the user is actually a driver
  $verify_sql = "SELECT id, role FROM users WHERE id = ?";
  $verify_stmt = $conn->prepare($verify_sql);
  $verify_stmt->bind_param("i", $driver_id);
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
  
  // Verify driver is assigned to this trip
  $isAuthorized = false;
  
  // Check driver_trip_assignments table first
  $check_assignment = $conn->prepare(
    "SELECT id FROM driver_trip_assignments WHERE trip_id = ? AND driver_id = ?"
  );
  $driver_record_id = null;
  
  // Get driver record ID
  $get_driver = $conn->prepare("SELECT id FROM drivers WHERE user_id = ?");
  $get_driver->bind_param("i", $driver_id);
  $get_driver->execute();
  $driver_result = $get_driver->get_result();
  if ($driver_row = $driver_result->fetch_assoc()) {
    $driver_record_id = $driver_row['id'];
  }
  
  if ($driver_record_id) {
    $check_assignment->bind_param("ii", $trip_id, $driver_record_id);
    $check_assignment->execute();
    $assignment_result = $check_assignment->get_result();
    if ($assignment_result->num_rows > 0) {
      $isAuthorized = true;
    }
  }
  
  // If not in driver_trip_assignments, check if driver has assigned bus/route
  if (!$isAuthorized && $driver_record_id) {
    $driver_info = $conn->prepare("SELECT assigned_bus_id, assigned_route_id FROM drivers WHERE id = ?");
    $driver_info->bind_param("i", $driver_record_id);
    $driver_info->execute();
    $driver_info_result = $driver_info->get_result();
    if ($driver_info_row = $driver_info_result->fetch_assoc()) {
      // Check if driver is assigned to the bus or route of this trip
      $trip_info = $conn->prepare("SELECT bus_id, route_id FROM trips WHERE id = ?");
      $trip_info->bind_param("i", $trip_id);
      $trip_info->execute();
      $trip_result = $trip_info->get_result();
      if ($trip_row = $trip_result->fetch_assoc()) {
        if (!empty($driver_info_row['assigned_bus_id']) && $driver_info_row['assigned_bus_id'] == $trip_row['bus_id']) {
          $isAuthorized = true;
        } elseif (!empty($driver_info_row['assigned_route_id']) && $driver_info_row['assigned_route_id'] == $trip_row['route_id']) {
          $isAuthorized = true;
        }
      }
    }
  }
  
  // For demo/development: allow if no assignments exist
  if (!$isAuthorized) {
    $check_any = $conn->query("SELECT COUNT(*) as cnt FROM driver_trip_assignments");
    $any_row = $check_any->fetch_assoc();
    if ($any_row['cnt'] == 0) {
      $isAuthorized = true; // Allow if no assignments exist yet
    }
  }
  
  if (!$isAuthorized) {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "You are not authorized to update this trip"]);
    exit;
  }
  
  $allowed_status = ["scheduled", "confirmed", "in-progress", "ongoing", "completed", "cancelled"];
  if (!in_array($status, $allowed_status)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid status. Allowed: " . implode(", ", $allowed_status)]);
    exit;
  }
  
  // Update trip status
  $stmt = $conn->prepare("UPDATE trips SET status = ? WHERE id = ?");
  if (!$stmt) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "SQL prepare failed", "details" => $conn->error]);
    exit;
  }
  
  $stmt->bind_param("si", $status, $trip_id);
  
  if ($stmt->execute()) {
    echo json_encode(["status" => "success", "message" => "Trip status updated"]);
  } else {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Update failed", "details" => $stmt->error]);
  }
  exit;
}

http_response_code(405);
echo json_encode(["error" => "Method not allowed"]);
