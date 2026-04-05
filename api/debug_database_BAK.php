<?php
/**
 * Database Diagnostic Script
 * Provides complete report on database state for debugging
 * 
 * Usage: Run this script to see full database state
 * Access via: http://localhost/Bus_system/api/debug_database.php
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require_once 'config/db.php';

try {
    $report = [];
    
    // 1. Users table
    $stmt = $conn->query("SELECT id, name, email, role FROM users ORDER BY id");
    $users = [];
    while ($row = $stmt->fetch_assoc()) $users[] = $row;
    $report['users'] = $users;
    
    // 2. Drivers table
    $stmt = $conn->query("SELECT d.id, d.user_id, d.license_number, d.assigned_route_id, d.assigned_bus_id, d.status, u.name, u.email 
                          FROM drivers d JOIN users u ON d.user_id = u.id");
    $drivers = [];
    while ($row = $stmt->fetch_assoc()) $drivers[] = $row;
    $report['drivers'] = $drivers;
    
    // 3. Routes table
    $stmt = $conn->query("SELECT id, route_code, origin, destination, distance_km FROM routes ORDER BY id");
    $routes = [];
    while ($row = $stmt->fetch_assoc()) $routes[] = $row;
    $report['routes'] = $routes;
    
    // 4. Buses table
    $stmt = $conn->query("SELECT id, bus_number, bus_name, total_seats, available_seats, status FROM buses ORDER BY id");
    $buses = [];
    while ($row = $stmt->fetch_assoc()) $buses[] = $row;
    $report['buses'] = $buses;
    
    // 5. Trips summary
    $stmt = $conn->query("SELECT COUNT(*) as total FROM trips");
    $report['total_trips'] = $stmt->fetch_assoc()['total'];
    
    // 6. Trips with driver info
    $stmt = $conn->query("SELECT t.id, t.departure_date, t.departure_time, t.status, t.driver_id, r.origin, r.destination, b.bus_number, u.name as driver_name
                         FROM trips t
                         JOIN routes r ON t.route_id = r.id
                         JOIN buses b ON t.bus_id = b.id
                         LEFT JOIN drivers d ON t.driver_id = d.id
                         LEFT JOIN users u ON d.user_id = u.id
                         ORDER BY t.departure_date DESC, t.departure_time ASC
                         LIMIT 100");
    $all_trips = [];
    while ($row = $stmt->fetch_assoc()) $all_trips[] = $row;
    $report['trips'] = $all_trips;
    
    // 7. Marie Driver's specific trips
    $stmt = $conn->prepare("SELECT t.id, t.departure_date, t.departure_time, t.status, r.origin, r.destination, b.bus_number
                           FROM trips t
                           JOIN routes r ON t.route_id = r.id
                           JOIN buses b ON t.bus_id = b.id
                           WHERE t.driver_id = (SELECT id FROM drivers WHERE user_id = (SELECT id FROM users WHERE email = 'marie.driver@camtransit.com'))
                           ORDER BY t.departure_date ASC, t.departure_time ASC");
    $stmt->execute();
    $result = $stmt->get_result();
    $marie_trips = [];
    while ($row = $result->fetch_assoc()) $marie_trips[] = $row;
    $report['marie_trips'] = $marie_trips;
    
    // 8. Trip status breakdown
    $stmt = $conn->query("SELECT status, COUNT(*) as count FROM trips GROUP BY status");
    $status_breakdown = [];
    while ($row = $stmt->fetch_assoc()) $status_breakdown[] = $row;
    $report['trip_status_breakdown'] = $status_breakdown;
    
    // 9. Unassigned trips
    $stmt = $conn->query("SELECT COUNT(*) as count FROM trips WHERE driver_id IS NULL");
    $report['unassigned_trips'] = $stmt->fetch_assoc()['count'];
    
    // 10. Bookings (recent)
    $stmt = $conn->query("SELECT b.id, b.booking_reference, b.number_of_seats, b.booking_status, b.payment_status, t.departure_date, r.origin, r.destination
                         FROM bookings b
                         JOIN trips t ON b.trip_id = t.id
                         JOIN routes r ON t.route_id = r.id
                         ORDER BY b.created_at DESC
                         LIMIT 20");
    $bookings = [];
    while ($row = $stmt->fetch_assoc()) $bookings[] = $row;
    $report['recent_bookings'] = $bookings;
    
    echo json_encode([
        'status' => 'success',
        'database_report' => $report,
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}

$conn->close();
