<?php
// Debug endpoint to list all bookings
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once("../../config/db.php");

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(200); exit; }

// Check bookings table
$sql = "SELECT id, booking_reference, number_of_seats, booking_status, trip_id, user_id FROM bookings LIMIT 20";
$result = $conn->query($sql);

$bookings = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $bookings[] = $row;
    }
}

echo json_encode([
    "status" => "success", 
    "count" => count($bookings),
    "data" => $bookings
]);
