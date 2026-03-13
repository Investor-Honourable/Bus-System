<?php
// Turn off error display to return JSON instead of HTML on errors
error_reporting(0);
ini_set('display_errors', 0);

require_once("../../config/db.php");

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(200); exit; }

$method = $_SERVER["REQUEST_METHOD"];

if ($method === "GET") {
  // List routes
  $sql = "SELECT id, route_code, origin, destination, distance_km, duration_minutes, base_price, status, created_at FROM routes ORDER BY id DESC";
  $res = $conn->query($sql);

  $data = [];
  while ($row = $res->fetch_assoc()) {
    // Normalize field names for frontend compatibility
    $row['start_point'] = $row['origin'];
    $row['end_point'] = $row['destination'];
    $row['distance'] = $row['distance_km'] . " km";
    $row['duration'] = $row['duration_minutes'] . " min";
    $data[] = $row;
  }

  echo json_encode(["data" => $data]);
  exit;
}

if ($method === "POST") {
  // Create route
  $input = json_decode(file_get_contents("php://input"), true);

  $start = trim($input["start_point"] ?? "");
  $end   = trim($input["end_point"] ?? "");
  $distance = intval($input["distance"] ?? 0);
  $duration = intval($input["duration"] ?? 0);
  $base_price = floatval($input["base_price"] ?? 0);

  if ($start === "" || $end === "") {
    http_response_code(400);
    echo json_encode(["error" => "start_point and end_point are required"]);
    exit;
  }

  // Generate route code
  $route_code = strtoupper(substr($start, 0, 3) . substr($end, 0, 3)) . rand(100, 999);

  $stmt = $conn->prepare("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price) VALUES (?, ?, ?, ?, ?, ?)");
  if (!$stmt) {
    http_response_code(500);
    echo json_encode(["error" => "SQL prepare failed", "details" => $conn->error]);
    exit;
  }

  $stmt->bind_param("sssiid", $route_code, $start, $end, $distance, $duration, $base_price);

  if ($stmt->execute()) {
    echo json_encode(["message" => "Route created", "data" => ["id" => $conn->insert_id, "start_point" => $start, "end_point" => $end, "distance" => $distance, "duration" => $duration]]);
  } else {
    http_response_code(500);
    echo json_encode(["error" => "Insert failed", "details" => $stmt->error]);
  }
  exit;
}

if ($method === "PUT") {
  // Update route
  $input = json_decode(file_get_contents("php://input"), true);

  $id     = intval($input["id"] ?? 0);
  $start  = trim($input["start_point"] ?? "");
  $end    = trim($input["end_point"] ?? "");
  $distance = trim($input["distance"] ?? "");
  $duration = trim($input["duration"] ?? "");

  if ($id <= 0) {
    http_response_code(400);
    echo json_encode(["error" => "id is required"]);
    exit;
  }

  $updates = [];
  $params = [];
  $types = "";

  if ($start !== "") {
    $updates[] = "start_point = ?";
    $params[] = $start;
    $types .= "s";
  }
  if ($end !== "") {
    $updates[] = "end_point = ?";
    $params[] = $end;
    $types .= "s";
  }
  if ($distance !== "") {
    $updates[] = "distance = ?";
    $params[] = $distance;
    $types .= "s";
  }
  if ($duration !== "") {
    $updates[] = "duration = ?";
    $params[] = $duration;
    $types .= "s";
  }

  if (count($updates) > 0) {
    $params[] = $id;
    $types .= "i";
    $sql = "UPDATE routes SET " . implode(", ", $updates) . " WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
  }

  echo json_encode(["message" => "Route updated", "data" => ["id" => $id]]);
  exit;
}

if ($method === "DELETE") {
  // Delete route
  $input = json_decode(file_get_contents("php://input"), true);
  $id = intval($input["id"] ?? 0);

  if ($id <= 0) {
    http_response_code(400);
    echo json_encode(["error" => "id is required"]);
    exit;
  }

  $stmt = $conn->prepare("DELETE FROM routes WHERE id = ?");
  $stmt->bind_param("i", $id);
  $stmt->execute();

  echo json_encode(["message" => "Route deleted", "data" => ["id" => $id]]);
  exit;
}

http_response_code(405);
echo json_encode(["error" => "Method not allowed"]);