<?php
/**
 * Check Database Contents
 * Displays all data in the database tables
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/config/db.php';

try {
    $data = [];
    
    // Get users
    $result = $conn->query("SELECT id, name, username, email, phone, role FROM users");
    $data['users'] = $result->fetch_all(MYSQLI_ASSOC);
    
    // Get routes
    $result = $conn->query("SELECT * FROM routes");
    $data['routes'] = $result->fetch_all(MYSQLI_ASSOC);
    
    // Get buses
    $result = $conn->query("SELECT * FROM buses");
    $data['buses'] = $result->fetch_all(MYSQLI_ASSOC);
    
    // Get trips
    $result = $conn->query("SELECT * FROM trips LIMIT 10");
    $data['trips'] = $result->fetch_all(MYSQLI_ASSOC);
    
    // Get drivers
    $result = $conn->query("SELECT d.*, u.name, u.email FROM drivers d JOIN users u ON d.user_id = u.id");
    $data['drivers'] = $result->fetch_all(MYSQLI_ASSOC);
    
    // Get passengers
    $result = $conn->query("SELECT p.*, u.name, u.email FROM passengers p JOIN users u ON p.user_id = u.id");
    $data['passengers'] = $result->fetch_all(MYSQLI_ASSOC);
    
    // Get bookings
    $result = $conn->query("SELECT * FROM bookings");
    $data['bookings'] = $result->fetch_all(MYSQLI_ASSOC);
    
    // Get notifications
    $result = $conn->query("SELECT * FROM notifications");
    $data['notifications'] = $result->fetch_all(MYSQLI_ASSOC);
    
    // Get counts
    $data['counts'] = [
        'users' => count($data['users']),
        'routes' => count($data['routes']),
        'buses' => count($data['buses']),
        'trips' => count($data['trips']),
        'drivers' => count($data['drivers']),
        'passengers' => count($data['passengers']),
        'bookings' => count($data['bookings']),
        'notifications' => count($data['notifications'])
    ];
    
    echo json_encode([
        'status' => 'success',
        'data' => $data
    ]);

} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Error checking database: ' . $e->getMessage()
    ]);
}
?>
