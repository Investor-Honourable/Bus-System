<?php
require_once("../../config/db.php");

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(200); exit; }

$input = json_decode(file_get_contents("php://input"), true);

$schedule_id = intval($input["schedule_id"] ?? 0);
$route_id    = intval($input["route_id"] ?? 0);
$bus_id      = intval($input["bus_id"] ?? 0);
$driver_id   = isset($input["driver_id"]) ? intval($input["driver_id"]) : null;

$date        = trim($input["date"] ?? "");
$dep         = trim($input["departure_time"] ?? "");
$arr         = trim($input["arrival_time"] ?? "");
$status      = strtoupper(trim($input["status"] ?? ""));

if ($schedule_id <= 0) {
  http_response_code(400);
  echo json_encode(["error" => "schedule_id is required"]);
  exit;
}

$allowed_status = ["OPEN","STARTED","ARRIVED","COMPLETED","CANCELLED"];
if ($status !== "" && !in_array($status, $allowed_status, true)) {
  http_response_code(400);
  echo json_encode(["error" => "Invalid status"]);
  exit;
}

// Build dynamic update
$fields = [];
$params = [];
$types  = "";

if ($route_id > 0) { $fields[] = "route_id=?"; $params[] = $route_id; $types .= "i"; }
if ($bus_id > 0)   { $fields[] = "bus_id=?";   $params[] = $bus_id;   $types .= "i"; }

if ($driver_id !== null) { $fields[] = "driver_id=?"; $params[] = $driver_id; $types .= "i"; }

if ($date !== "") { $fields[] = "date=?"; $params[] = $date; $types .= "s"; }
if ($dep  !== "") { $fields[] = "departure_time=?"; $params[] = $dep; $types .= "s"; }
if ($arr  !== "") { $fields[] = "arrival_time=?";   $params[] = $arr; $types .= "s"; }

if ($status !== "") { $fields[] = "status=?"; $params[] = $status; $types .= "s"; }

if (count($fields) === 0) {
  http_response_code(400);
  echo json_encode(["error" => "No fields to update"]);
  exit;
}

$sql = "UPDATE schedule SET " . implode(", ", $fields) . " WHERE id=?";
$params[] = $schedule_id;
$types .= "i";

$stmt = $conn->prepare($sql);
if (!$stmt) {
  http_response_code(500);
  echo json_encode(["error" => "Prepare failed", "details" => $conn->error]);
  exit;
}

$stmt->bind_param($types, ...$params);

if ($stmt->execute()) {
  echo json_encode(["message" => "Schedule updated"]);
} else {
  http_response_code(500);
  echo json_encode(["error" => "Update failed", "details" => $stmt->error]);
}