<?php
/**
 * Populate Sample Notifications for all users
 */
require_once 'config/db.php';

$notifications = [
    [1, 'System Update', 'New features have been added to CamTransit dashboard.', 'system'],
    [22, 'Welcome!', 'Welcome to CamTransit! Book your first trip.', 'system'],
    [23, 'Welcome!', 'Welcome to CamTransit! Book your first trip.', 'system'],
    [24, 'Welcome!', 'Welcome to CamTransit! Book your first trip.', 'system'],
    [25, 'New Trip Assignment', 'You have a new trip tomorrow on BUS-001.', 'trip'],
    [26, 'New Trip Assignment', 'Trip assigned: Douala to Kribi tomorrow.', 'trip']
];

$stmt = $conn->prepare("INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (?, ?, ?, ?, 0)");

foreach ($notifications as $notif) {
    $stmt->bind_param("isss", $notif[0], $notif[1], $notif[2], $notif[3]);
    $stmt->execute();
}

echo json_encode(['status' => 'success', 'added' => count($notifications)]);
?>

