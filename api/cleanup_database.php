<?php
/**
 * Database Cleanup & Driver Assignment Script
 * Cleans old trips and assigns Marie Driver to proper trips
 * 
 * Usage: Run this script to fix the database
 * Access via: http://localhost/Bus_system/api/cleanup_database.php
 */

// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'config/db.php';

try {
    $results = [];
    
    // Get current date
    $today = date('Y-m-d');
    
    // 1. Clean up old trips (older than 7 days)
    $stmt = $conn->prepare("DELETE FROM trips WHERE departure_date < DATE_SUB(?, INTERVAL 7 DAY)");
    $stmt->bind_param("s", $today);
    $stmt->execute();
    $deleted_old = $stmt->affected_rows;
    $results[] = "Deleted $deleted_old old trips (older than 7 days)";
    
    // 2. Find Marie Driver
    $stmt = $conn->prepare("SELECT d.id, d.user_id FROM drivers d 
                           JOIN users u ON d.user_id = u.id 
                           WHERE u.email = 'marie.driver@camtransit.com'");
    $stmt->execute();
    $result = $stmt->get_result();
    $marie = $result->fetch_assoc();
    
    if (!$marie) {
        echo json_encode(['status' => 'error', 'message' => 'Marie Driver not found in database']);
        exit;
    }
    
    $marie_driver_id = $marie['id'];
    $results[] = "Found Marie Driver with ID: $marie_driver_id";
    
    // 3. Find the Douala → Bafoussam route
    $stmt = $conn->prepare("SELECT id FROM routes WHERE origin = 'Douala' AND destination = 'Bafoussam'");
    $stmt->execute();
    $result = $stmt->get_result();
    $route = $result->fetch_assoc();
    
    if (!$route) {
        echo json_encode(['status' => 'error', 'message' => 'Douala → Bafoussam route not found']);
        exit;
    }
    
    $route_id = $route['id'];
    $results[] = "Found Douala → Bafoussam route with ID: $route_id";
    
    // 4. Find BUS-004
    $stmt = $conn->prepare("SELECT id FROM buses WHERE bus_number = 'BUS-004'");
    $stmt->execute();
    $result = $stmt->get_result();
    $bus = $result->fetch_assoc();
    
    if (!$bus) {
        // Try to find any bus
        $stmt = $conn->query("SELECT id FROM buses LIMIT 1");
        $bus = $stmt->fetch_assoc();
        $bus_id = $bus['id'];
        $results[] = "BUS-004 not found, using bus ID: $bus_id";
    } else {
        $bus_id = $bus['id'];
        $results[] = "Found BUS-004 with ID: $bus_id";
    }
    
    // 5. Delete ALL existing trips for Marie (to start fresh)
    $stmt = $conn->prepare("DELETE FROM trips WHERE driver_id = ?");
    $stmt->bind_param("i", $marie_driver_id);
    $stmt->execute();
    $deleted_marie = $stmt->affected_rows;
    $results[] = "Deleted $deleted_marie existing trips for Marie";
    
    // 6. Create NEW trips for Marie - TODAY and TOMORROW only (morning and afternoon)
    $dates = [
        date('Y-m-d', strtotime('today')),
        date('Y-m-d', strtotime('tomorrow'))
    ];
    
    $times = [
        ['06:00:00', '08:30:00'],  // Morning
        ['14:00:00', '16:30:00']  // Afternoon
    ];
    
    $trips_created = 0;
    
    foreach ($dates as $date) {
        foreach ($times as $time_pair) {
            $departure = $time_pair[0];
            $arrival = $time_pair[1];
            
            $stmt = $conn->prepare("INSERT INTO trips 
                (bus_id, route_id, driver_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (?, ?, ?, ?, ?, ?, 3000, 50, 'scheduled')");
            $stmt->bind_param("iiisss", $bus_id, $route_id, $marie_driver_id, $date, $departure, $arrival);
            $stmt->execute();
            $trips_created++;
        }
    }
    
    $results[] = "Created $trips_created new trips for Marie";
    
    // 7. Update Marie's assigned route and bus
    $stmt = $conn->prepare("UPDATE drivers SET assigned_route_id = ?, assigned_bus_id = ? WHERE id = ?");
    $stmt->bind_param("iii", $route_id, $bus_id, $marie_driver_id);
    $stmt->execute();
    $results[] = "Updated Marie's assigned route (Douala → Bafoussam) and bus (BUS-004)";
    
    // 8. Verify - Get all trips for Marie
    $stmt = $conn->prepare("SELECT t.id, t.departure_date, t.departure_time, t.status, 
                           r.origin, r.destination, b.bus_number
                           FROM trips t
                           JOIN routes r ON t.route_id = r.id
                           JOIN buses b ON t.bus_id = b.id
                           WHERE t.driver_id = ?
                           ORDER BY t.departure_date ASC, t.departure_time ASC");
    $stmt->bind_param("i", $marie_driver_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $trips = [];
    while ($row = $result->fetch_assoc()) {
        $trips[] = $row;
    }
    
    // 9. Get total trip count
    $stmt = $conn->query("SELECT COUNT(*) as total FROM trips");
    $total_trips = $stmt->fetch_assoc();
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Database cleaned and Marie Driver assigned',
        'details' => $results,
        'summary' => [
            'marie_driver_id' => $marie_driver_id,
            'route_id' => $route_id,
            'bus_id' => $bus_id,
            'marie_trips_count' => count($trips),
            'total_trips_in_db' => $total_trips['total'],
            'trips' => $trips
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed: ' . $e->getMessage()
    ]);
}

$conn->close();
