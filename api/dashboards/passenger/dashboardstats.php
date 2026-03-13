<?php
require_once("../../config/db.php");

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(200); exit; }

$passenger_id = isset($_GET['passenger_id']) ? intval($_GET['passenger_id']) : 0;

if ($passenger_id <= 0) {
    echo json_encode(["error" => "Invalid passenger ID"]);
    exit;
}

// Fetch the stats for the passenger
$sql = "
    SELECT
    (SELECT COUNT(*) FROM bookings WHERE passenger_id = ? AND status = 'CONFIRMED') AS activeTickets,
    (SELECT COUNT(*) FROM bookings WHERE passenger_id = ?) AS totalBookings,
    (SELECT COALESCE(SUM(r.price), 0) FROM bookings b LEFT JOIN routes r ON b.schedule_id = r.id WHERE b.passenger_id = ?) AS totalSpent,
    (SELECT COUNT(*) FROM bookings WHERE passenger_id = ? AND status = 'COMPLETED') AS completedBookings
";

// Prepare the SQL statement
$stmt = $conn->prepare($sql);

// Check if the query was prepared successfully
if ($stmt === false) {
    echo json_encode(["error" => "Failed to prepare the SQL query", "details" => $conn->error]);
    exit;
}

$stmt->bind_param("iiii", $passenger_id, $passenger_id, $passenger_id, $passenger_id);

$stmt->execute();
$res = $stmt->get_result();
$data = $res->fetch_assoc();

echo json_encode([
    "stats" => $data
]);
?>