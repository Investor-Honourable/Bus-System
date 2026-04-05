<?php
require_once 'config/db.php';

$sql = "SELECT b.id as booking_id, b.trip_id, b.user_id, b.booking_reference 
        FROM bookings b 
        WHERE b.booking_status = 'confirmed' 
        AND NOT EXISTS (SELECT 1 FROM tickets t WHERE t.booking_id = b.id)";
        
$result = $conn->query($sql);

$created = 0;
while ($row = $result->fetch_assoc()) {
    $ticket_code = 'TKT' . strtoupper(substr(md5(uniqid()), 0, 8));
    $trip_id = $row['trip_id'];
    $booking_id = $row['booking_id'];
    $user_id = $row['user_id'];
    
    $stmt = $conn->prepare("INSERT INTO tickets (ticket_code, booking_id, trip_id, user_id, seat_number, status) VALUES (?, ?, ?, ?, 1, 'valid')");
    $stmt->bind_param("siii", $ticket_code, $booking_id, $trip_id, $user_id);
    $stmt->execute();
    $created++;
    echo "Created ticket: $ticket_code for booking {$row['booking_reference']}\n";
}

echo "Total tickets created: $created\n";
$conn->close();