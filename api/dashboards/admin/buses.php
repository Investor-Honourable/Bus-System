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
  // List buses
  $sql = "SELECT id, bus_number, bus_name, bus_type, total_seats, available_seats, amenities, status, created_at FROM buses ORDER BY id DESC";
  $res = $conn->query($sql);

  $data = [];
  while ($row = $res->fetch_assoc()) {
    // Normalize field names for frontend compatibility
    $row['capacity'] = $row['total_seats'];
    $row['type'] = $row['bus_type'];
    if (!isset($row['type']) || $row['type'] === null || $row['type'] === '') {
      $row['type'] = 'standard';
    }
    $data[] = $row;
  }

  echo json_encode(["data" => $data]);
  exit;
}

if ($method === "POST") {
  // Create bus
  $input = json_decode(file_get_contents("php://input"), true);

  $bus_number = trim($input["bus_number"] ?? "");
  $bus_name = trim($input["bus_name"] ?? $bus_number);
  $capacity   = intval($input["capacity"] ?? 0);
  $type       = trim($input["type"] ?? "standard");

  $allowed_types = ["standard", "vip", "luxury"];
  if (!in_array($type, $allowed_types)) {
    $type = "standard";
  }

  if ($bus_number === "" || $capacity <= 0) {
    http_response_code(400);
    echo json_encode(["error" => "bus_number and capacity are required"]);
    exit;
  }

  $stmt = $conn->prepare("INSERT INTO buses (bus_number, bus_name, bus_type, total_seats, available_seats) VALUES (?, ?, ?, ?, ?)");
  if (!$stmt) {
    http_response_code(500);
    echo json_encode(["error" => "SQL prepare failed", "details" => $conn->error]);
    exit;
  }

  $stmt->bind_param("sssii", $bus_number, $bus_name, $type, $capacity, $capacity);

  if ($stmt->execute()) {
    echo json_encode(["message" => "Bus created", "data" => ["id" => $conn->insert_id, "bus_number" => $bus_number, "capacity" => $capacity, "type" => $type]]);
  } else {
    http_response_code(500);
    echo json_encode(["error" => "Insert failed", "details" => $stmt->error]);
  }
  exit;
}

if ($method === "PUT") {
  // Update bus
  $input = json_decode(file_get_contents("php://input"), true);

  $id         = intval($input["id"] ?? 0);
  $bus_number = trim($input["bus_number"] ?? "");
  $capacity   = intval($input["capacity"] ?? 0);
  $type       = trim($input["type"] ?? "standard");

  if ($id <= 0) {
    http_response_code(400);
    echo json_encode(["error" => "id is required"]);
    exit;
  }

  $updates = [];
  $params = [];
  $types = "";

  if ($bus_number !== "") {
    $updates[] = "bus_number = ?";
    $params[] = $bus_number;
    $types .= "s";
  }
  if ($capacity > 0) {
    $updates[] = "capacity = ?";
    $params[] = $capacity;
    $types .= "i";
  }
  if ($type !== "") {
    $updates[] = "type = ?";
    $params[] = $type;
    $types .= "s";
  }

  if (count($updates) > 0) {
    $params[] = $id;
    $types .= "i";
    $sql = "UPDATE buses SET " . implode(", ", $updates) . " WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
  }

  echo json_encode(["message" => "Bus updated", "data" => ["id" => $id]]);
  exit;
}

if ($method === "DELETE") {
  // Delete bus
  $input = json_decode(file_get_contents("php://input"), true);
  $id = intval($input["id"] ?? 0);

  if ($id <= 0) {
    http_response_code(400);
    echo json_encode(["error" => "id is required"]);
    exit;
  }

  $stmt = $conn->prepare("DELETE FROM buses WHERE id = ?");
  $stmt->bind_param("i", $id);
  $stmt->execute();

  echo json_encode(["message" => "Bus deleted", "data" => ["id" => $id]]);
  exit;
}

http_response_code(405);
echo json_encode(["error" => "Method not allowed"]);