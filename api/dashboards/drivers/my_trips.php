<?php
// Get driver's assigned trips
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
$driver_id = isset($input["driver_id"]) ? intval($input["driver_id"]) : 0;

if ($method === "GET") {
  $driver_id = isset($_GET["driver_id"]) ? intval($_GET["driver_id"]) : 0;
}

if ($method === "GET" || $method === "POST") {
  if ($driver_id <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Driver ID is required"]);
    exit;
  }
  
  // First, verify the user is actually a driver
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
  
  // Get the driver record ID from the drivers table
  $driver_record_id = null;
  $driver_sql = "SELECT id FROM drivers WHERE user_id = ?";
  $driver_stmt = $conn->prepare($driver_sql);
  $driver_stmt->bind_param("i", $driver_id);
  $driver_stmt->execute();
  $driver_result = $driver_stmt->get_result();
  if ($driver_row = $driver_result->fetch_assoc()) {
    $driver_record_id = $driver_row['id'];
  }
  
  // If no driver record, return empty array (not all trips!)
  if (!$driver_record_id) {
    echo json_encode(["status" => "success", "data" => []]);
    exit;
  }
  
  // Check if driver_trip_assignments table exists
  $has_assignments_table = false;
  $check_table = $conn->query("SHOW TABLES LIKE 'driver_trip_assignments'");
  if ($check_table && $check_table->num_rows > 0) {
    $has_assignments_table = true;
  }
  
  $data = [];
  
  if ($has_assignments_table) {
    // Check if there are any assignments for this driver
    $check_assignments = $conn->prepare("SELECT COUNT(*) as cnt FROM driver_trip_assignments WHERE driver_id = ?");
    $check_assignments->bind_param("i", $driver_record_id);
    $check_assignments->execute();
    $check_result = $check_assignments->get_result();
    $check_row = $check_result->fetch_assoc();
    
    if ($check_row['cnt'] > 0) {
      // Get trips from driver_trip_assignments
      $sql = "
      SELECT
        t.id,
        t.departure_date,
        t.departure_time,
        t.arrival_time,
        t.status,
        t.available_seats,
        r.origin,
        r.destination,
        b.bus_number,
        b.total_seats
      FROM driver_trip_assignments dta
      JOIN trips t ON t.id = dta.trip_id
      JOIN routes r ON r.id = t.route_id
      JOIN buses b ON b.id = t.bus_id
      WHERE dta.driver_id = ?
      ORDER BY t.departure_date DESC, t.departure_time DESC
      ";
      
      $stmt = $conn->prepare($sql);
      $stmt->bind_param("i", $driver_record_id);
      $stmt->execute();
      $result = $stmt->get_result();
      
      while ($row = $result->fetch_assoc()) {
        $booked = $row['total_seats'] - $row['available_seats'];
        $row['booked_seats'] = $booked;
        $data[] = $row;
      }
    }
  }
  
  // If no assignments found, try driver table for assigned_bus_id or assigned_route_id
  if (empty($data)) {
    $driver_info_sql = "SELECT assigned_bus_id, assigned_route_id FROM drivers WHERE user_id = ?";
    $driver_info_stmt = $conn->prepare($driver_info_sql);
    $driver_info_stmt->bind_param("i", $driver_id);
    $driver_info_stmt->execute();
    $driver_info_result = $driver_info_stmt->get_result();
    
    if ($driver_info_row = $driver_info_result->fetch_assoc()) {
      // If driver has assigned bus, show trips for that bus
      if (!empty($driver_info_row['assigned_bus_id'])) {
        $sql = "
        SELECT
          t.id,
          t.departure_date,
          t.departure_time,
          t.arrival_time,
          t.status,
          t.available_seats,
          r.origin,
          r.destination,
          b.bus_number,
          b.total_seats
        FROM trips t
        JOIN routes r ON r.id = t.route_id
        JOIN buses b ON b.id = t.bus_id
        WHERE t.bus_id = ?
        ORDER BY t.departure_date DESC, t.departure_time DESC
        ";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $driver_info_row['assigned_bus_id']);
        $stmt->execute();
        $result = $stmt->get_result();
        
        while ($row = $result->fetch_assoc()) {
          $booked = $row['total_seats'] - $row['available_seats'];
          $row['booked_seats'] = $booked;
          $data[] = $row;
        }
      }
      // If driver has assigned route, show trips for that route
      elseif (!empty($driver_info_row['assigned_route_id'])) {
        $sql = "
        SELECT
          t.id,
          t.departure_date,
          t.departure_time,
          t.arrival_time,
          t.status,
          t.available_seats,
          r.origin,
          r.destination,
          b.bus_number,
          b.total_seats
        FROM trips t
        JOIN routes r ON r.id = t.route_id
        JOIN buses b ON b.id = t.bus_id
        WHERE t.route_id = ?
        ORDER BY t.departure_date DESC, t.departure_time DESC
        ";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $driver_info_row['assigned_route_id']);
        $stmt->execute();
        $result = $stmt->get_result();
        
        while ($row = $result->fetch_assoc()) {
          $booked = $row['total_seats'] - $row['available_seats'];
          $row['booked_seats'] = $booked;
          $data[] = $row;
        }
      }
    }
  }
  
  // SECURITY: If still no data, return empty array (NOT all trips!)
  // This ensures data isolation - drivers only see their assigned trips
  
  echo json_encode(["status" => "success", "data" => $data]);
  exit;
}

http_response_code(405);
echo json_encode(["status" => "error", "message" => "Method not allowed"]);
