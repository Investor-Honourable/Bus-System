<?php
/**
 * Ensure Marie Has Future Trips
 * Assigns Marie to future trips on her assigned route
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require_once 'config/db.php';

try {
    // Find Marie Driver
    $stmt = $conn->prepare("SELECT d.id, d.user_id, d.assigned_route_id, d.assigned_bus_id, u.name, u.email 
                           FROM drivers d JOIN users u ON d.user_id = u.id 
                           WHERE u.email = 'marie.driver@camtransit.com'");
    $stmt->execute();
    $result = $stmt->get_result();
    $marie = $result->fetch_assoc();
    
    if (!$marie) {
        echo json_encode(['status' => 'error', 'message' => 'Marie Driver not found']);
        exit;
    }
    
    $results = [];
    $results[] = "Found Marie Driver: " . $marie['name'] . " (ID: " . $marie['id'] . ")";
    $results[] = "Current assigned_route_id: " . ($marie['assigned_route_id'] ?? 'NULL');
    $results[] = "Current assigned_bus_id: " . ($marie['assigned_bus_id'] ?? 'NULL');
    
    // Find the route (either direction)
    $stmt = $conn->query("SELECT id, route_code, origin, destination FROM routes WHERE 
                          (origin = 'Douala' AND destination = 'Bafoussam') OR 
                          (origin = 'Bafoussam' AND destination = 'Douala')");
    $route = $stmt->fetch_assoc();
    
    if (!$route) {
        // Create the route
        $stmt = $conn->prepare("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) 
                                VALUES (?, 'Bafoussam', 'Douala', 150, 150, 3000, 'active')");
        $route_code = 'ROU-BD-' . time();
        $stmt->bind_param("s", $route_code);
        $stmt->execute();
        $route_id = $conn->insert_id;
        $results[] = "Created route: Bafoussam → Douala (ID: $route_id)";
    } else {
        $route_id = $route['id'];
        $results[] = "Found route: {$route['origin']} → {$route['destination']} (ID: $route_id)";
    }
    
    // Find or create BUS-004
    $stmt = $conn->prepare("SELECT id, total_seats FROM buses WHERE bus_number = 'BUS-004'");
    $stmt->execute();
    $result = $stmt->get_result();
    $bus = $result->fetch_assoc();
    
    if (!$bus) {
        $stmt = $conn->query("SELECT id, total_seats FROM buses LIMIT 1");
        $bus = $stmt->fetch_assoc();
        $bus_id = $bus['id'];
        $results[] = "BUS-004 not found, using bus ID: $bus_id (seats: " . $bus['total_seats'] . ")";
    } else {
        $bus_id = $bus['id'];
        $results[] = "Found BUS-004 (ID: $bus_id, seats: " . $bus['total_seats'] . ")";
    }
    
    // Update Marie's assignments
    $stmt = $conn->prepare("UPDATE drivers SET assigned_route_id = ?, assigned_bus_id = ? WHERE id = ?");
    $stmt->bind_param("iii", $route_id, $bus_id, $marie['id']);
    $stmt->execute();
    $results[] = "Updated Marie's assigned_route_id = $route_id, assigned_bus_id = $bus_id";
    
    // Delete ALL past trips for Marie
    $stmt = $conn->prepare("DELETE FROM trips WHERE driver_id = ? AND departure_date < CURDATE()");
    $stmt->bind_param("i", $marie['id']);
    $stmt->execute();
    $deleted = $stmt->affected_rows;
    $results[] = "Deleted $deleted past trips for Marie";
    
    // Create NEW trips for TODAY and NEXT 7 DAYS
    $trips_created = 0;
    $times = ['06:00:00', '14:00:00'];
    $today = strtotime('today');
    $seats = $bus['total_seats'] ?? 50;
    
    for ($day = 0; $day <= 7; $day++) {
        $date = date('Y-m-d', strtotime("+$day days", $today));
        
        foreach ($times as $departure_time) {
            // Calculate arrival (assume 2.5 hours / 150 minutes)
            $dep_ts = strtotime("$date $departure_time");
            $arrival = date('H:i:s', strtotime('+150 minutes', $dep_ts));
            
            $stmt = $conn->prepare("INSERT INTO trips 
                (bus_id, route_id, driver_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (?, ?, ?, ?, ?, ?, 3000, ?, 'scheduled')");
            $stmt->bind_param("iiisssi", $bus_id, $route_id, $marie['id'], $date, $departure_time, $arrival, $seats);
            $stmt->execute();
            $trips_created++;
        }
    }
    
    $results[] = "Created $trips_created new trips for Marie (today + 7 days, 2 times/day)";
    
    // Get summary
    $stmt = $conn->prepare("SELECT t.id, t.departure_date, t.departure_time, t.status, r.origin, r.destination, b.bus_number
                           FROM trips t
                           JOIN routes r ON t.route_id = r.id
                           JOIN buses b ON t.bus_id = b.id
                           WHERE t.driver_id = ?
                           ORDER BY t.departure_date ASC, t.departure_time ASC");
    $stmt->bind_param("i", $marie['id']);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $trips = [];
    while ($row = $result->fetch_assoc()) {
        $trips[] = $row;
    }
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Marie Driver fixed with future trips',
        'details' => $results,
        'summary' => [
            'marie_driver_id' => $marie['id'],
            'route_id' => $route_id,
            'bus_id' => $bus_id,
            'total_trips' => count($trips),
            'trips' => $trips
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
