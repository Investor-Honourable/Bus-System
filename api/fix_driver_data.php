<?php
/**
 * Fix Driver Dashboard Data Script
 * This script creates trips for Marie Driver and assigns them properly
 * 
 * Usage: Run this script to fix driver dashboard data
 * Access via: http://localhost/Bus_system/api/fix_driver_data.php
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
    
    // 1. Find or create the Douala → Bafoussam route
    $stmt = $conn->prepare("SELECT id, route_code FROM routes WHERE origin = 'Douala' AND destination = 'Bafoussam'");
    $stmt->execute();
    $result = $stmt->get_result();
    $route = $result->fetch_assoc();
    
    if (!$route) {
        // Create the route
        $stmt = $conn->prepare("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) VALUES (?, 'Douala', 'Bafoussam', 150, 150, 3000, 'active')");
        $route_code = 'ROU-DB-' . time();
        $stmt->bind_param("s", $route_code);
        $stmt->execute();
        $route_id = $conn->insert_id;
        $results[] = "Created route Douala → Bafoussam with ID: $route_id";
    } else {
        $route_id = $route['id'];
        $results[] = "Found existing route Douala → Bafoussam with ID: $route_id";
    }
    
    // 2. Find or create BUS-004
    $stmt = $conn->prepare("SELECT id, total_seats FROM buses WHERE bus_number = 'BUS-004'");
    $stmt->execute();
    $result = $stmt->get_result();
    $bus = $result->fetch_assoc();
    
    if (!$bus) {
        // Create the bus
        $stmt = $conn->prepare("INSERT INTO buses (bus_number, bus_name, bus_type, total_seats, available_seats, status) VALUES ('BUS-004', 'Toyota Coaster 2024', 'standard', 50, 50, 'active')");
        $stmt->execute();
        $bus_id = $conn->insert_id;
        $results[] = "Created bus BUS-004 with ID: $bus_id";
    } else {
        $bus_id = $bus['id'];
        $results[] = "Found existing bus BUS-004 with ID: $bus_id, Total Seats: " . $bus['total_seats'];
    }
    
    // 3. Find or create Marie Driver
    // First, find the user
    $stmt = $conn->prepare("SELECT id, name FROM users WHERE email = 'marie.driver@camtransit.com'");
    $stmt->execute();
    $result = $stmt->get_result();
    $marie_user = $result->fetch_assoc();
    
    if (!$marie_user) {
        // Create the user
        $hashed_password = password_hash('driver123', PASSWORD_DEFAULT);
        $stmt = $conn->prepare("INSERT INTO users (name, username, email, phone, gender, password, role) VALUES ('Marie Driver', 'mariedriver', 'marie.driver@camtransit.com', '+237600000003', 'female', ?, 'driver')");
        $stmt->bind_param("s", $hashed_password);
        $stmt->execute();
        $marie_user_id = $conn->insert_id;
        $results[] = "Created user Marie Driver with ID: $marie_user_id";
    } else {
        $marie_user_id = $marie_user['id'];
        $results[] = "Found existing user Marie Driver with ID: $marie_user_id";
    }
    
    // Now find or create the driver record
    $stmt = $conn->prepare("SELECT id, assigned_route_id, assigned_bus_id, status FROM drivers WHERE user_id = ?");
    $stmt->bind_param("i", $marie_user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $marie_driver = $result->fetch_assoc();
    
    if (!$marie_driver) {
        // Create the driver record
        $license_expiry = date('Y-m-d', strtotime('+1 year'));
        $stmt = $conn->prepare("INSERT INTO drivers (user_id, license_number, license_expiry, license_type, status, assigned_route_id, assigned_bus_id) VALUES (?, 'DL00000002', ?, 'Class B', 'active', ?, ?)");
        $stmt->bind_param("isii", $marie_user_id, $license_expiry, $route_id, $bus_id);
        $stmt->execute();
        $marie_driver_id = $conn->insert_id;
        $results[] = "Created driver record with ID: $marie_driver_id";
    } else {
        $marie_driver_id = $marie_driver['id'];
        
        // Update driver assignments
        $stmt = $conn->prepare("UPDATE drivers SET assigned_route_id = ?, assigned_bus_id = ?, status = 'active' WHERE id = ?");
        $stmt->bind_param("iii", $route_id, $bus_id, $marie_driver_id);
        $stmt->execute();
        $results[] = "Updated driver record ID: $marie_driver_id with route and bus assignments";
    }
    
    // 4. Create trips for today and tomorrow on Douala → Bafoussam route
    $today = date('Y-m-d');
    $tomorrow = date('Y-m-d', strtotime('+1 day'));
    
    $trips_created = 0;
    
    // Morning trips
    $times = [
        ['06:00:00', '08:30:00'],
        ['08:00:00', '10:30:00'],
        ['14:00:00', '16:30:00']
    ];
    
    foreach ([$today, $tomorrow] as $date) {
        foreach ($times as $time_pair) {
            $departure_time = $time_pair[0];
            $arrival_time = $time_pair[1];
            
            // Check if trip already exists
            $stmt = $conn->prepare("SELECT id FROM trips WHERE route_id = ? AND bus_id = ? AND departure_date = ? AND departure_time = ?");
            $stmt->bind_param("iiss", $route_id, $bus_id, $date, $departure_time);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows === 0) {
                // Create the trip
                $stmt = $conn->prepare("INSERT INTO trips (bus_id, route_id, driver_id, departure_date, departure_time, arrival_time, price, available_seats, status) VALUES (?, ?, ?, ?, ?, ?, 3000, 50, 'scheduled')");
                $stmt->bind_param("iiisss", $bus_id, $route_id, $marie_driver_id, $date, $departure_time, $arrival_time);
                $stmt->execute();
                $trips_created++;
            }
        }
    }
    
    $results[] = "Created $trips_created trips for route Douala → Bafoussam";
    
    // 5. Also assign Marie to existing trips on the route (if any)
    $stmt = $conn->prepare("UPDATE trips SET driver_id = ? WHERE route_id = ? AND driver_id IS NULL");
    $stmt->bind_param("ii", $marie_driver_id, $route_id);
    $stmt->execute();
    $results[] = "Assigned Marie to all unassigned trips on Douala → Bafoussam route";
    
    // 6. Get summary of trips for Marie
    $stmt = $conn->prepare("SELECT t.*, r.origin, r.destination, b.bus_number 
                            FROM trips t
                            JOIN routes r ON t.route_id = r.id
                            JOIN buses b ON t.bus_id = b.id
                            WHERE t.driver_id = ? OR t.route_id = ?
                            ORDER BY t.departure_date ASC, t.departure_time ASC");
    $stmt->bind_param("ii", $marie_driver_id, $route_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $trips_summary = [];
    while ($row = $result->fetch_assoc()) {
        $trips_summary[] = [
            'id' => $row['id'],
            'date' => $row['departure_date'],
            'time' => $row['departure_time'],
            'route' => $row['origin'] . ' → ' . $row['destination'],
            'bus' => $row['bus_number'],
            'status' => $row['status']
        ];
    }
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Driver data fixed successfully',
        'details' => $results,
        'summary' => [
            'marie_user_id' => $marie_user_id,
            'marie_driver_id' => $marie_driver_id,
            'route_id' => $route_id,
            'bus_id' => $bus_id,
            'trips_count' => count($trips_summary),
            'trips' => $trips_summary
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to fix driver data: ' . $e->getMessage()
    ]);
}

$conn->close();
