<?php
/**
 * Clean Fake Data Script
 * Removes trips and bookings that are not real (not created by actual users)
 */

session_start();
require 'config/db.php';

header('Content-Type: application/json');

echo "=== Starting Data Cleanup ===\n\n";

try {
    // 1. Delete notifications that are not real (test notifications)
    $result = $conn->query("SELECT COUNT(*) as cnt FROM notifications");
    $totalNotifs = $result->fetch_assoc()['cnt'];
    echo "Total notifications before: $totalNotifs\n";
    
    // Delete test/system notifications (keep user-generated ones)
    $conn->query("DELETE FROM notifications WHERE type IN ('system', 'test', 'demo') OR title LIKE '%Test%' OR title LIKE '%Demo%'");
    $affected = $conn->affected_rows;
    echo "Deleted $affected test notifications\n\n";

    // 2. Delete trips that have no bookings (fake trips)
    // First, find trips with no bookings
    $result = $conn->query("
        SELECT COUNT(*) as cnt FROM trips t
        LEFT JOIN bookings b ON t.id = b.trip_id
        WHERE b.id IS NULL
    ");
    $fakeTrips = $result->fetch_assoc()['cnt'];
    echo "Trips without bookings (fake): $fakeTrips\n";
    
    // Delete these fake trips
    $conn->query("
        DELETE t FROM trips t
        LEFT JOIN bookings b ON t.id = b.trip_id
        WHERE b.id IS NULL
    ");
    $affected = $conn->affected_rows;
    echo "Deleted $affected fake trips\n\n";

    // 3. Delete old trips (past departure dates that are completed)
    $today = date('Y-m-d');
    $result = $conn->query("SELECT COUNT(*) as cnt FROM trips WHERE departure_date < '$today' AND status = 'completed'");
    $oldTrips = $result->fetch_assoc()['cnt'];
    echo "Old completed trips: $oldTrips\n";
    
    $conn->query("DELETE FROM trips WHERE departure_date < '$today' AND status = 'completed'");
    $affected = $conn->affected_rows;
    echo "Deleted $affected old completed trips\n\n";

    // 4. Delete old bookings (past trips)
    $result = $conn->query("
        SELECT COUNT(*) as cnt FROM bookings b
        JOIN trips t ON b.trip_id = t.id
        WHERE t.departure_date < '$today'
    ");
    $oldBookings = $result->fetch_assoc()['cnt'];
    echo "Old bookings: $oldBookings\n";
    
    $conn->query("
        DELETE b FROM bookings b
        JOIN trips t ON b.trip_id = t.id
        WHERE t.departure_date < '$today'
    ");
    $affected = $conn->affected_rows;
    echo "Deleted $affected old bookings\n\n";

    // 5. Show remaining real data
    $result = $conn->query("SELECT COUNT(*) as cnt FROM trips");
    $realTrips = $result->fetch_assoc()['cnt'];
    echo "=== Remaining Real Data ===\n";
    echo "Real trips: $realTrips\n";

    $result = $conn->query("SELECT COUNT(*) as cnt FROM bookings");
    $realBookings = $result->fetch_assoc()['cnt'];
    echo "Real bookings: $realBookings\n";

    $result = $conn->query("SELECT COUNT(*) as cnt FROM notifications WHERE type IN ('booking', 'cancellation', 'reminder')");
    $realNotifs = $result->fetch_assoc()['cnt'];
    echo "Real notifications: $realNotifs\n";

    echo "\n=== Cleanup Complete ===\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

$conn->close();
?>