<?php
require_once("../../config/db.php");

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(200); exit; }

$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

if ($user_id <= 0) {
    echo json_encode(["error" => "Invalid user ID"]);
    exit;
}

// Fetch recent bookings for the passenger
$sql = "
    SELECT
        b.id AS booking_id,
        r.origin,
        r.destination,
        b.total_price,
        b.booking_status,
        t.departure_date AS trip_date
    FROM bookings b
    JOIN trips t ON b.trip_id = t.id
    JOIN routes r ON t.route_id = r.id
    WHERE b.user_id = ?
    ORDER BY b.booking_date DESC
    LIMIT 5
";

// Prepare the SQL statement
$stmt = $conn->prepare($sql);

// Check if the query was prepared successfully
if ($stmt === false) {
    echo json_encode(["error" => "Failed to prepare the SQL query", "details" => $conn->error]);
    exit;
}

$stmt->bind_param("i", $user_id);

$stmt->execute();
$res = $stmt->get_result();

$recentBookings = [];
while ($row = $res->fetch_assoc()) {
    $recentBookings[] = $row;
}

echo json_encode([
    "recentBookings" => $recentBookings
]);
?>