<?php
// Turn off error display to return JSON instead of HTML on errors
error_reporting(0);
ini_set('display_errors', 0);

require_once("../../config/db.php");

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(200); exit; }

$method = $_SERVER["REQUEST_METHOD"];

if ($method === "GET") {
  // Get trips from the trips table (used by passengers)
  $sql = "
  SELECT
    t.id AS trip_id,
    t.departure_date,
    t.departure_time,
    t.arrival_time,
    t.price,
    t.available_seats,
    t.status,
    t.route_id,
    t.bus_id,
    r.origin,
    r.destination,
    b.bus_number,
    b.bus_name,
    b.bus_type,
    b.total_seats
  FROM trips t
  JOIN routes r ON r.id = t.route_id
  JOIN buses b ON b.id = t.bus_id
  ORDER BY t.departure_date DESC, t.departure_time DESC
  ";

  $res = $conn->query($sql);
  if (!$res) {
    http_response_code(500);
    echo json_encode(["error" => "Query failed", "details" => $conn->error]);
    exit;
  }

  $data = [];
  while ($row = $res->fetch_assoc()) {
    // Normalize field names for frontend compatibility
    $row['date'] = $row['departure_date'];
    $row['start_point'] = $row['origin'] ?? $row['start_point'];
    $row['end_point'] = $row['destination'] ?? $row['end_point'];
    if (!isset($row['capacity'])) {
      $row['capacity'] = $row['total_seats'] ?? 50;
    }
    $data[] = $row;
  }

  echo json_encode(["data" => $data]);
  exit;
}

if ($method === "POST") {
  try {
    $input = json_decode(file_get_contents("php://input"), true);
    
    // Debug: log what we received
    if (!$input) {
      http_response_code(400);
      echo json_encode(["error" => "Invalid JSON input", "received" => file_get_contents("php://input")]);
      exit;
    }

    $route_id = intval($input["route_id"] ?? 0);
    $bus_id   = intval($input["bus_id"] ?? 0);

    $date     = trim($input["date"] ?? "");  // departure_date
    $dep      = trim($input["departure_time"] ?? "");
    $arr      = trim($input["arrival_time"] ?? "");
    $price    = floatval($input["price"] ?? 0);

    if ($route_id <= 0 || $bus_id <= 0 || $date === "" || $dep === "" || $arr === "") {
      http_response_code(400);
      echo json_encode(["error" => "route_id, bus_id, date, departure_time, arrival_time are required"]);
      exit;
    }

    if ($price <= 0) {
      http_response_code(400);
      echo json_encode(["error" => "Price must be greater than 0"]);
      exit;
    }

    // Get bus capacity for available_seats
    $busStmt = $conn->prepare("SELECT total_seats, capacity FROM buses WHERE id = ?");
    $busStmt->bind_param("i", $bus_id);
    $busStmt->execute();
    $busResult = $busStmt->get_result();
    $bus = $busResult->fetch_assoc();
    $available_seats = $bus['total_seats'] ?? $bus['capacity'] ?? 50;

    // Insert into trips table (used by passengers)
    $stmt = $conn->prepare("INSERT INTO trips (route_id, bus_id, departure_date, departure_time, arrival_time, price, available_seats, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled')");
    if (!$stmt) { http_response_code(500); echo json_encode(["error"=>"Prepare failed","details"=>$conn->error]); exit; }
    $stmt->bind_param("iisssdii", $route_id, $bus_id, $date, $dep, $arr, $price, $available_seats);

    if ($stmt->execute()) {
      echo json_encode(["message" => "Trip created", "data" => ["trip_id" => $conn->insert_id]]);
    } else {
      http_response_code(500);
      echo json_encode(["error" => "Insert failed", "details" => $stmt->error]);
    }
    exit;
  } catch (Exception $e) {
    http_response_code(500);
    $errorMsg = $e->getMessage();
    // Check for common database errors
    if (strpos($errorMsg, 'Table') !== false || strpos($errorMsg, 'trips') !== false) {
      $errorMsg = "Database table 'trips' may not exist. Please run the database setup.";
    }
    echo json_encode(["error" => "Server error", "details" => $errorMsg]);
    exit;
  }
}

if ($method === "PUT") {
  $input = json_decode(file_get_contents("php://input"), true);

  $trip_id = intval($input["trip_id"] ?? $input["schedule_id"] ?? 0);
  $date = trim($input["date"] ?? "");
  $departure_time = trim($input["departure_time"] ?? "");
  $arrival_time = trim($input["arrival_time"] ?? "");
  $price = isset($input["price"]) ? floatval($input["price"]) : null;
  $status = strtolower(trim($input["status"] ?? ""));

  if ($trip_id <= 0) {
    http_response_code(400);
    echo json_encode(["error" => "trip_id is required"]);
    exit;
  }

  $updates = [];
  $params = [];
  $types = "";

  if ($date !== "") {
    $updates[] = "departure_date = ?";
    $params[] = $date;
    $types .= "s";
  }
  if ($departure_time !== "") {
    $updates[] = "departure_time = ?";
    $params[] = $departure_time;
    $types .= "s";
  }
  if ($arrival_time !== "") {
    $updates[] = "arrival_time = ?";
    $params[] = $arrival_time;
    $types .= "s";
  }
  if ($price !== null) {
    $updates[] = "price = ?";
    $params[] = $price;
    $types .= "d";
  }
  if ($status !== "") {
    $allowed_status = ["scheduled", "ongoing", "completed", "cancelled"];
    if (in_array($status, $allowed_status)) {
      $updates[] = "status = ?";
      $params[] = $status;
      $types .= "s";
    }
  }

  if (count($updates) > 0) {
    $params[] = $trip_id;
    $types .= "i";
    $sql = "UPDATE trips SET " . implode(", ", $updates) . " WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
  }

  echo json_encode(["message" => "Trip updated", "data" => ["trip_id" => $trip_id]]);
  exit;
}

if ($method === "DELETE") {
  $input = json_decode(file_get_contents("php://input"), true);
  $trip_id = intval($input["trip_id"] ?? $input["schedule_id"] ?? 0);

  if ($trip_id <= 0) {
    http_response_code(400);
    echo json_encode(["error" => "trip_id is required"]);
    exit;
  }

  $stmt = $conn->prepare("DELETE FROM trips WHERE id = ?");
  $stmt->bind_param("i", $trip_id);
  $stmt->execute();

  echo json_encode(["message" => "Trip deleted", "data" => ["trip_id" => $trip_id]]);
  exit;
}

http_response_code(405);
echo json_encode(["error" => "Method not allowed"]);
