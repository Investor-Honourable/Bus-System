<?php
require_once 'config/db.php';

header("Content-Type: application/json");

$sql = "SELECT tk.*, b.booking_reference, t.departure_date, r.origin, r.destination, d.user_id as driver_user_id
        FROM tickets tk
        JOIN bookings b ON tk.booking_id = b.id
        JOIN trips t ON tk.trip_id = t.id
        JOIN routes r ON t.route_id = r.id
        LEFT JOIN drivers d ON t.driver_id = d.id
        ORDER BY tk.id DESC LIMIT 20";
        
$result = $conn->query($sql);

$tickets = [];
while ($row = $result->fetch_assoc()) {
    $tickets[] = $row;
}

echo json_encode(['status' => 'success', 'tickets' => $tickets, 'count' => count($tickets)]);
$conn->close();