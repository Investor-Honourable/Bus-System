<?php
/**
 * Complete System Reset - Delete All Bookings & Fake Trips
 * Keep only essential data: routes, buses, users (no bookings, no trips)
 */

session_start();
require 'config/db.php';

header('Content-Type: application/json');

echo "=== COMPLETE SYSTEM RESET ===\n\n";

try {
    $conn->begin_transaction();

    // 1. Delete ALL bookings
    $result = $conn->query("SELECT COUNT(*) as cnt FROM bookings");
    $bookingCount = $result->fetch_assoc()['cnt'];
    $conn->query("DELETE FROM bookings");
    echo "✓ Deleted $bookingCount bookings\n";

    // 2. Delete ALL trips (we'll create fresh ones later)
    $result = $conn->query("SELECT COUNT(*) as cnt FROM trips");
    $tripCount = $result->fetch_assoc()['cnt'];
    $conn->query("DELETE FROM trips");
    echo "✓ Deleted $tripCount trips\n";

    // 3. Delete ALL tickets
    $result = $conn->query("SELECT COUNT(*) as cnt FROM tickets");
    $ticketCount = $result->fetch_assoc()['cnt'];
    $conn->query("DELETE FROM tickets");
    echo "✓ Deleted $ticketCount tickets\n";

    // 4. Delete ALL notifications (keep only system settings)
    $conn->query("DELETE FROM notifications WHERE type IN ('booking', 'cancellation', 'reminder', 'system', 'promotion')");
    echo "✓ Deleted user notifications\n";

    // 5. Delete all activity logs (optional - clean start)
    $conn->query("DELETE FROM activity_logs");
    echo "✓ Deleted activity logs\n";

    // 6. Clean up orphan users (users with empty name/email)
    $conn->query("DELETE FROM users WHERE name = '' OR name IS NULL OR email = '' OR email IS NULL");
    echo "✓ Cleaned up orphan users\n";

    // 7. Fix driver role mismatch - make sure drivers have correct role
    $conn->query("UPDATE users u JOIN drivers d ON u.id = d.user_id SET u.role = 'driver' WHERE u.role != 'driver'");
    echo "✓ Fixed driver roles\n";

    // Commit transaction
    $conn->commit();

    echo "\n=== CLEANUP COMPLETE ===\n\n";

    // Show remaining data
    $result = $conn->query("SELECT COUNT(*) as cnt FROM users");
    echo "Users: " . $result->fetch_assoc()['cnt'] . "\n";

    $result = $conn->query("SELECT COUNT(*) as cnt FROM routes");
    echo "Routes: " . $result->fetch_assoc()['cnt'] . "\n";

    $result = $conn->query("SELECT COUNT(*) as cnt FROM buses");
    echo "Buses: " . $result->fetch_assoc()['cnt'] . "\n";

    $result = $conn->query("SELECT COUNT(*) as cnt FROM drivers");
    echo "Drivers: " . $result->fetch_assoc()['cnt'] . "\n";

    echo "\n=== SYSTEM READY FOR FRESH BOOKINGS ===\n";
    echo "Trips will be created automatically when you search and book routes.\n";

} catch (Exception $e) {
    $conn->rollback();
    echo "Error: " . $e->getMessage() . "\n";
}

$conn->close();
?>