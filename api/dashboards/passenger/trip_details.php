<?php
require_once("../../config/db.php");

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(200); exit; }

$id = isset($_GET["id"]) ? intval($_GET["id"]) : 0;
if ($id <= 0) {
  http_response_code(400);
  echo json_encode(["error" => "Missing trip id"]);
  exit;
}

$sql = "
SELECT 
  t.id AS trip_id,
  r.origin,
  r.destination,
  t.departure_date,
  t.departure_time,
  t.arrival_time,
  t.price,
  t.available_seats,
  bs.id AS bus_id,
  bs.bus_number,
  bs.bus_name,
  bs.bus_type,
  bs.total_seats AS capacity
FROM trips t
JOIN routes r ON r.id = t.route_id
JOIN buses bs ON bs.id = t.bus_id
WHERE t.id = ?
LIMIT 1
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $id);
$stmt->execute();
$res = $stmt->get_result();
$row = $res->fetch_assoc();

if (!$row) {
  http_response_code(404);
  echo json_encode(["error" => "Trip not found"]);
  exit;
}

echo json_encode(["data" => $row]);
