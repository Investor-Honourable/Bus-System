<?php
// Turn off error display to return JSON instead of HTML
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
  
  if ($trip_id <= 0) {
    http_response_code(400);
    echo json_encode(["error" => "trip_id is required"]);
    exit;
  }
  
  $allowed_status = ["scheduled", "confirmed", "in-progress", "ongoing", "completed", "cancelled"];
  if (!in_array($status, $allowed_status)) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid status. Allowed: " . implode(", ", $allowed_status)]);
    exit;
  }
  
  // Update trip status
  $stmt = $conn->prepare("UPDATE trips SET status = ? WHERE id = ?");
  if (!$stmt) {
    http_response_code(500);
    echo json_encode(["error" => "SQL prepare failed", "details" => $conn->error]);
    exit;
  }
  
  $stmt->bind_param("si", $status, $trip_id);
  
  if ($stmt->execute()) {
    echo json_encode(["status" => "success", "message" => "Trip status updated"]);
  } else {
    http_response_code(500);
    echo json_encode(["error" => "Update failed", "details" => $stmt->error]);
  }
  exit;
}

http_response_code(405);
echo json_encode(["error" => "Method not allowed"]);
