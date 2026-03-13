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
$driver_id = isset($input["driver_id"]) ? intval($input["driver_id"]) : 0;

if ($method === "GET") {
  $driver_id = isset($_GET["driver_id"]) ? intval($_GET["driver_id"]) : 0;
}

if ($method === "GET" || $method === "POST") {
  // Return all trips for now (in a real app, filter by driver_id)
  // If driver_id is provided, we'll return all trips
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
  ORDER BY t.departure_date ASC, t.departure_time ASC
  ";
  
  $res = $conn->query($sql);
  if (!$res) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Query failed", "details" => $conn->error]);
    exit;
  }
  
  $data = [];
  while ($row = $res->fetch_assoc()) {
    // Calculate booked seats
    $booked = $row['total_seats'] - $row['available_seats'];
    $row['booked_seats'] = $booked;
    $data[] = $row;
  }
  
  echo json_encode(["status" => "success", "data" => $data]);
  exit;
}

http_response_code(405);
echo json_encode(["status" => "error", "message" => "Method not allowed"]);
