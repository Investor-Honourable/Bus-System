<?php
/**
 * Bus Management API - Main Entry Point
 * Handles: auth, routes, buses, trips, bookings, tickets
 */

session_start();
require 'config/db.php';

// CORS Configuration - Get allowed origin from request or use defaults
$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed_origin = in_array($origin, $allowed_origins) ? $origin : $allowed_origins[0];

header("Access-Control-Allow-Origin: $allowed_origin");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, User-ID");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Disable error display in production (enable only for local development)
$is_localhost = in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1', 'localhost']) || 
                strpos($_SERVER['HTTP_HOST'] ?? '', 'localhost') !== false;
if (!$is_localhost) {
    ini_set('display_errors', 0);
    error_reporting(0);
}

// ============ NOTIFICATION HELPER FUNCTIONS ============

function createNotification($conn, $userId, $title, $message, $type, $referenceType = null, $referenceId = null) {
    try {
        $stmt = $conn->prepare("INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id) VALUES (?, ?, ?, ?, ?, ?)");
        $refType = $referenceType ?? '';
        $refId = $referenceId ?? 0;
        $stmt->bind_param("isssii", $userId, $title, $message, $type, $refType, $refId);
        $stmt->execute();
        $notifId = $conn->insert_id;
        
        // Log notification for audit
        error_log("Notification [$notifId] created for user $userId: $type - $title");
        return $notifId;
    } catch (Exception $e) {
        error_log("Notification error: " . $e->getMessage());
        return null;
    }
}

function sendNotificationToAll($conn, $title, $message, $type, $role = null) {
    try {
        if ($role) {
            $stmt = $conn->prepare("SELECT id FROM users WHERE role = ?");
            $stmt->bind_param("s", $role);
            $stmt->execute();
            $result = $stmt->get_result();
        } else {
            $result = $conn->query("SELECT id FROM users");
        }
        
        $count = 0;
        while ($row = $result->fetch_assoc()) {
            createNotification($conn, $row['id'], $title, $message, $type);
            $count++;
        }
        error_log("Notification sent to $count users: $type - $title");
        return $count;
    } catch (Exception $e) {
        error_log("Send to all error: " . $e->getMessage());
        return 0;
    }
}

// Get request method and data
$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"), true);
$action = $data['action'] ?? '';

// ============= AUTHENTICATION =============
if ($action === 'login' || $action === 'register') {
    require 'auth.php';
    exit;
}

// ============= ROUTES =============
// Schema migration: Fix column names if using old schema (departure_city/destination_city)
$columns_result = $conn->query("SHOW COLUMNS FROM routes LIKE 'departure_city'");
if ($columns_result && $columns_result->num_rows > 0) {
    // Old schema exists - migrate data and rename columns
    $conn->query("ALTER TABLE routes ADD COLUMN origin VARCHAR(100) AFTER id");
    $conn->query("ALTER TABLE routes ADD COLUMN destination VARCHAR(100) AFTER origin");
    $conn->query("UPDATE routes SET origin = departure_city, destination = destination_city WHERE origin IS NULL OR origin = ''");
    $conn->query("ALTER TABLE routes DROP COLUMN departure_city");
    $conn->query("ALTER TABLE routes DROP COLUMN destination_city");
}

// Also ensure origin/destination columns exist
$check_origin = $conn->query("SHOW COLUMNS FROM routes LIKE 'origin'");
if (!$check_origin || $check_origin->num_rows == 0) {
    $conn->query("ALTER TABLE routes ADD COLUMN origin VARCHAR(100)");
}
$check_dest = $conn->query("SHOW COLUMNS FROM routes LIKE 'destination'");
if (!$check_dest || $check_dest->num_rows == 0) {
    $conn->query("ALTER TABLE routes ADD COLUMN destination VARCHAR(100)");
}

if ($method === 'GET' && (strpos($_SERVER['REQUEST_URI'], 'routes') !== false || $action === 'get_routes')) {
    $result = $conn->query("SELECT * FROM routes WHERE status = 'active' ORDER BY origin");
    $routes = [];
    while ($row = $result->fetch_assoc()) {
        $routes[] = $row;
    }
    echo json_encode(['status' => 'success', 'routes' => $routes]);
    exit;
}

if ($action === 'get_routes') {
    $result = $conn->query("SELECT * FROM routes WHERE status = 'active' ORDER BY origin");
    $routes = [];
    while ($row = $result->fetch_assoc()) {
        $routes[] = $row;
    }
    echo json_encode(['status' => 'success', 'routes' => $routes]);
    exit;
}

if ($method === 'POST' && $action === 'add_route') {
    $origin = $data['origin'] ?? '';
    $destination = $data['destination'] ?? '';
    $distance = $data['distance_km'] ?? 0;
    $duration = $data['duration_minutes'] ?? 0;
    $price = $data['base_price'] ?? 0;
    
    $stmt = $conn->prepare("INSERT INTO routes (origin, destination, distance_km, duration_minutes, base_price) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("siidi", $origin, $destination, $distance, $duration, $price);
    
    if ($stmt->execute()) {
        echo json_encode(['status' => 'success', 'message' => 'Route added successfully']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to add route']);
    }
    exit;
}

// ============= BUSES =============
if ($method === 'GET' && (strpos($_SERVER['REQUEST_URI'], 'buses') !== false || $action === 'get_buses')) {
    $result = $conn->query("SELECT * FROM buses WHERE status = 'active'");
    $buses = [];
    while ($row = $result->fetch_assoc()) {
        $row['amenities'] = json_decode($row['amenities'] ?? '[]');
        $buses[] = $row;
    }
    echo json_encode(['status' => 'success', 'buses' => $buses]);
    exit;
}

if ($action === 'get_buses') {
    $result = $conn->query("SELECT * FROM buses WHERE status = 'active'");
    $buses = [];
    while ($row = $result->fetch_assoc()) {
        $row['amenities'] = json_decode($row['amenities'] ?? '[]');
        $buses[] = $row;
    }
    echo json_encode(['status' => 'success', 'buses' => $buses]);
    exit;
}

if ($method === 'POST' && $action === 'add_bus') {
    $bus_number = $data['bus_number'] ?? '';
    $bus_name = $data['bus_name'] ?? '';
    $bus_type = $data['bus_type'] ?? 'standard';
    $total_seats = $data['total_seats'] ?? 0;
    $amenities = json_encode($data['amenities'] ?? []);
    
    $stmt = $conn->prepare("INSERT INTO buses (bus_number, bus_name, bus_type, total_seats, available_seats, amenities) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("sssiis", $bus_number, $bus_name, $bus_type, $total_seats, $total_seats, $amenities);
    
    if ($stmt->execute()) {
        echo json_encode(['status' => 'success', 'message' => 'Bus added successfully']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to add bus']);
    }
    exit;
}

// ============= TRIPS =============
if ($method === 'GET' && (strpos($_SERVER['REQUEST_URI'], 'trips') !== false || $action === 'get_trips')) {
    $origin = $data['origin'] ?? '';
    $destination = $data['destination'] ?? '';
    $date = $data['date'] ?? '';
    
    $sql = "SELECT t.*, r.origin, r.destination, r.distance_km, r.duration_minutes, 
            b.bus_number, b.bus_name, b.bus_type, b.amenities 
            FROM trips t 
            JOIN routes r ON t.route_id = r.id 
            JOIN buses b ON t.bus_id = b.id 
            WHERE t.status = 'scheduled' AND t.available_seats > 0";
    
    $params = [];
    $types = "";
    
    if ($origin) {
        $sql .= " AND r.origin LIKE ?";
        $params[] = "%$origin%";
        $types .= "s";
    }
    if ($destination) {
        $sql .= " AND r.destination LIKE ?";
        $params[] = "%$destination%";
        $types .= "s";
    }
    if ($date) {
        $sql .= " AND t.departure_date = ?";
        $params[] = $date;
        $types .= "s";
    }
    
    $sql .= " ORDER BY t.departure_time";
    
    $stmt = $conn->prepare($sql);
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    
    $trips = [];
    while ($row = $result->fetch_assoc()) {
        $row['amenities'] = json_decode($row['amenities'] ?? '[]');
        $trips[] = $row;
    }
    echo json_encode(['status' => 'success', 'trips' => $trips]);
    exit;
}

if ($action === 'get_trips') {
    $origin = $data['origin'] ?? '';
    $destination = $data['destination'] ?? '';
    $date = $data['date'] ?? '';
    
    $sql = "SELECT t.*, r.origin, r.destination, r.distance_km, r.duration_minutes, 
            b.bus_number, b.bus_name, b.bus_type, b.amenities 
            FROM trips t 
            JOIN routes r ON t.route_id = r.id 
            JOIN buses b ON t.bus_id = b.id 
            WHERE t.status = 'scheduled' AND t.available_seats > 0";
    
    $params = [];
    $types = "";
    
    if ($origin) {
        $sql .= " AND r.origin LIKE ?";
        $params[] = "%$origin%";
        $types .= "s";
    }
    if ($destination) {
        $sql .= " AND r.destination LIKE ?";
        $params[] = "%$destination%";
        $types .= "s";
    }
    if ($date) {
        $sql .= " AND t.departure_date = ?";
        $params[] = $date;
        $types .= "s";
    }
    
    $sql .= " ORDER BY t.departure_time";
    
    $stmt = $conn->prepare($sql);
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    
    $trips = [];
    while ($row = $result->fetch_assoc()) {
        $row['amenities'] = json_decode($row['amenities'] ?? '[]');
        $trips[] = $row;
    }
    echo json_encode(['status' => 'success', 'trips' => $trips]);
    exit;
}

if ($method === 'POST' && $action === 'add_trip') {
    $bus_id = $data['bus_id'] ?? 0;
    $route_id = $data['route_id'] ?? 0;
    $date = $data['departure_date'] ?? '';
    $departure = $data['departure_time'] ?? '';
    $arrival = $data['arrival_time'] ?? '';
    $price = $data['price'] ?? 0;
    
    // Get available seats
    $stmt_bus = $conn->prepare("SELECT available_seats FROM buses WHERE id = ?");
    $stmt_bus->bind_param("i", $bus_id);
    $stmt_bus->execute();
    $bus_result = $stmt_bus->get_result();
    $bus = $bus_result->fetch_assoc();
    $available = $bus['available_seats'] ?? 0;
    
    $stmt = $conn->prepare("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("iisssdi", $bus_id, $route_id, $date, $departure, $arrival, $price, $available);
    
    if ($stmt->execute()) {
        echo json_encode(['status' => 'success', 'message' => 'Trip added successfully']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to add trip']);
    }
    exit;
}

// ============= GET ALL ROUTES (not trips) =============
if ($action === 'get_all_routes') {
    // Schema migration: Fix column names if using old schema (departure_city/destination_city)
    $columns_result = $conn->query("SHOW COLUMNS FROM routes LIKE 'departure_city'");
    if ($columns_result && $columns_result->num_rows > 0) {
        // Old schema exists - migrate data and rename columns
        $conn->query("ALTER TABLE routes ADD COLUMN origin VARCHAR(100) AFTER id");
        $conn->query("ALTER TABLE routes ADD COLUMN destination VARCHAR(100) AFTER origin");
        $conn->query("UPDATE routes SET origin = departure_city, destination = destination_city WHERE origin IS NULL OR origin = ''");
        $conn->query("ALTER TABLE routes DROP COLUMN departure_city");
        $conn->query("ALTER TABLE routes DROP COLUMN destination_city");
    }
    
    // Also ensure origin/destination columns exist
    $check_origin = $conn->query("SHOW COLUMNS FROM routes LIKE 'origin'");
    if (!$check_origin || $check_origin->num_rows == 0) {
        $conn->query("ALTER TABLE routes ADD COLUMN origin VARCHAR(100)");
    }
    $check_dest = $conn->query("SHOW COLUMNS FROM routes LIKE 'destination'");
    if (!$check_dest || $check_dest->num_rows == 0) {
        $conn->query("ALTER TABLE routes ADD COLUMN destination VARCHAR(100)");
    }
    
    // Ensure data exists - auto-create if needed
    $routeCount = $conn->query("SELECT COUNT(*) as cnt FROM routes")->fetch_assoc()['cnt'];
    if ($routeCount == 0) {
        // Create buses
        $conn->query("INSERT INTO buses (bus_number, bus_name, bus_type, total_seats, available_seats, amenities, status) 
            VALUES ('BUS-001', 'CamTransit Express', 'luxury', 50, 50, '[\"WiFi\", \"AC\", \"USB\", \"Refreshments\"]', 'active')");
        $conn->query("INSERT INTO buses (bus_number, bus_name, bus_type, total_seats, available_seats, amenities, status) 
            VALUES ('BUS-002', 'City Liner', 'standard', 40, 40, '[\"AC\", \"WiFi\"]', 'active')");
        $conn->query("INSERT INTO buses (bus_number, bus_name, bus_type, total_seats, available_seats, amenities, status) 
            VALUES ('BUS-003', 'VIP Coach', 'vip', 20, 20, '[\"WiFi\", \"AC\", \"USB\", \"Refreshments\", \"Reclining Seats\"]', 'active')");
        
        // Create routes
        $conn->query("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) 
            VALUES ('DLA-YDE', 'Douala', 'Yaoundé', 280, 180, 3500, 'active')");
        $conn->query("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) 
            VALUES ('DLA-KRI', 'Douala', 'Kribi', 150, 120, 2500, 'active')");
        $conn->query("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) 
            VALUES ('DLA-BAF', 'Douala', 'Bafoussam', 200, 150, 3000, 'active')");
        $conn->query("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) 
            VALUES ('YDE-BAF', 'Yaoundé', 'Bafoussam', 180, 140, 2800, 'active')");
        $conn->query("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) 
            VALUES ('YDE-DLA', 'Yaoundé', 'Douala', 280, 180, 3500, 'active')");
        $conn->query("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) 
            VALUES ('KRI-DLA', 'Kribi', 'Douala', 150, 120, 2500, 'active')");
        $conn->query("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) 
            VALUES ('BAF-DLA', 'Bafoussam', 'Douala', 200, 150, 3000, 'active')");
        $conn->query("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) 
            VALUES ('BAF-YDE', 'Bafoussam', 'Yaoundé', 180, 140, 2800, 'active')");
        $conn->query("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) 
            VALUES ('DLA-LIM', 'Douala', 'Limbe', 120, 90, 2000, 'active')");
        $conn->query("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) 
            VALUES ('DLA-KUM', 'Douala', 'Kumba', 180, 135, 2800, 'active')");
    }
    
    // Also create trips if none exist
    $tripCount = $conn->query("SELECT COUNT(*) as cnt FROM trips")->fetch_assoc()['cnt'];
    if ($tripCount == 0) {
        // Create trips for the next 30 days
        for ($i = 0; $i <= 30; $i++) {
            $trip_date = date('Y-m-d', strtotime("+$i days"));
            $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (1, 1, '$trip_date', '06:00:00', '09:00:00', 3500, 50, 'scheduled')");
            $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (1, 5, '$trip_date', '06:00:00', '09:00:00', 3500, 50, 'scheduled')");
            $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (2, 5, '$trip_date', '05:30:00', '08:30:00', 3500, 40, 'scheduled')");
            $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (2, 2, '$trip_date', '08:00:00', '10:00:00', 2500, 40, 'scheduled')");
            $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (2, 6, '$trip_date', '08:00:00', '10:00:00', 2500, 40, 'scheduled')");
            $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (1, 6, '$trip_date', '11:00:00', '13:00:00', 2500, 50, 'scheduled')");
            $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (3, 4, '$trip_date', '14:00:00', '16:20:00', 2800, 20, 'scheduled')");
            $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (3, 8, '$trip_date', '14:00:00', '16:20:00', 2800, 20, 'scheduled')");
            $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (1, 3, '$trip_date', '16:00:00', '18:30:00', 3000, 50, 'scheduled')");
            $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (1, 7, '$trip_date', '16:00:00', '18:30:00', 3000, 50, 'scheduled')");
            $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (2, 7, '$trip_date', '19:00:00', '21:30:00', 3000, 40, 'scheduled')");
            $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (2, 9, '$trip_date', '07:00:00', '08:30:00', 2000, 40, 'scheduled')");
            $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (1, 10, '$trip_date', '09:00:00', '11:15:00', 2800, 50, 'scheduled')");
        }
    }
    
    $result = $conn->query("SELECT * FROM routes WHERE status = 'active' ORDER BY origin, destination");
    
    $routes = [];
    while ($row = $result->fetch_assoc()) {
        $routes[] = $row;
    }
    
    echo json_encode(['status' => 'success', 'routes' => $routes]);
    exit;
}

// ============= CREATE TRIP FOR A SPECIFIC ROUTE =============
if ($action === 'create_trip_for_route') {
    $route_id = intval($data['route_id'] ?? 0);
    $date = $data['date'] ?? date('Y-m-d');
    
    if (!$route_id) {
        echo json_encode(['status' => 'error', 'message' => 'Route ID is required']);
        exit;
    }
    
    // Get the route info
    $routeResult = $conn->query("SELECT * FROM routes WHERE id = $route_id");
    $route = $routeResult->fetch_assoc();
    
    if (!$route) {
        echo json_encode(['status' => 'error', 'message' => 'Route not found']);
        exit;
    }
    
    // Get first available bus
    $busResult = $conn->query("SELECT * FROM buses LIMIT 1");
    $bus = $busResult->fetch_assoc();
    
    if (!$bus) {
        echo json_encode(['status' => 'error', 'message' => 'No buses available']);
        exit;
    }
    
    // Calculate times
    $departureTime = '09:00:00';
    $durationMinutes = intval($route['duration_minutes'] ?: 180);
    $price = floatval($route['base_price'] ?: 3000);
    $totalSeats = intval($bus['total_seats'] ?: 50);
    
    // Calculate arrival time
    $departure = new DateTime($departureTime);
    $arrival = clone $departure;
    $arrival->add(new DateInterval("PT{$durationMinutes}M"));
    $arrivalTime = $arrival->format('H:i:s');
    
    // Simple insert query
    $sql = "INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
            VALUES ({$bus['id']}, $route_id, '$date', '$departureTime', '$arrivalTime', $price, $totalSeats, 'scheduled')";
    
    if ($conn->query($sql)) {
        $trip_id = $conn->insert_id;
        echo json_encode(['status' => 'success', 'trip_id' => $trip_id, 'message' => 'Trip created with ' . $totalSeats . ' seats']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to create trip: ' . $conn->error]);
    }
    exit;
}

// ============= CREATE TRIPS FOR ALL ROUTES =============
if ($action === 'create_trips_for_routes') {
    // Get all routes
    $result = $conn->query("SELECT * FROM routes");
    $routes = [];
    while ($row = $result->fetch_assoc()) {
        $routes[] = $row;
    }
    
    // Get all buses
    $busResult = $conn->query("SELECT * FROM buses");
    $buses = [];
    while ($row = $busResult->fetch_assoc()) {
        $buses[] = $row;
    }
    
    if (empty($routes) || empty($buses)) {
        echo json_encode(['status' => 'error', 'message' => 'No routes or buses found']);
        exit;
    }
    
    $tripCount = 0;
    
    // Create trips for next 14 days for each route
    for ($i = 0; $i <= 14; $i++) {
        $trip_date = date('Y-m-d', strtotime("+$i days"));
        
        foreach ($routes as $route) {
            foreach ($buses as $bus) {
                // Create 1-2 trips per route per day
                $times = ['06:00:00', '14:00:00'];
                foreach ($times as $timeIndex => $departureTime) {
                    $departure = new DateTime($departureTime);
                    $durationMinutes = $route['duration_minutes'] ?: 180;
                    $arrival = clone $departure;
                    $arrival->add(new DateInterval("PT{$durationMinutes}M"));
                    
                    $price = $route['base_price'] ?: 3000;
                    
                    $stmt = $conn->prepare("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled')");
                    $stmt->bind_param("iisssdi", $bus['id'], $route['id'], $trip_date, $departureTime, $arrival->format('H:i:s'), $price, $bus['total_seats']);
                    $stmt->execute();
                    $tripCount++;
                }
            }
        }
    }
    
    echo json_encode(['status' => 'success', 'message' => "Created $tripCount trips", 'trips_created' => $tripCount]);
    exit;
}

// ============= SEARCH TRIPS =============
if ($action === 'search_trips') {
    // Ensure data exists - auto-create if needed
    $routeCount = $conn->query("SELECT COUNT(*) as cnt FROM routes")->fetch_assoc()['cnt'];
    if ($routeCount == 0) {
        // Create buses
        $conn->query("INSERT INTO buses (bus_number, bus_name, bus_type, total_seats, available_seats, amenities, status) 
            VALUES ('BUS-001', 'CamTransit Express', 'luxury', 50, 50, '[\"WiFi\", \"AC\", \"USB\", \"Refreshments\"]', 'active')");
        $conn->query("INSERT INTO buses (bus_number, bus_name, bus_type, total_seats, available_seats, amenities, status) 
            VALUES ('BUS-002', 'City Liner', 'standard', 40, 40, '[\"AC\", \"WiFi\"]', 'active')");
        $conn->query("INSERT INTO buses (bus_number, bus_name, bus_type, total_seats, available_seats, amenities, status) 
            VALUES ('BUS-003', 'VIP Coach', 'vip', 20, 20, '[\"WiFi\", \"AC\", \"USB\", \"Refreshments\", \"Reclining Seats\"]', 'active')");
        
        // Create routes
        $conn->query("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) 
            VALUES ('DLA-YDE', 'Douala', 'Yaoundé', 280, 180, 3500, 'active')");
        $conn->query("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) 
            VALUES ('DLA-KRI', 'Douala', 'Kribi', 150, 120, 2500, 'active')");
        $conn->query("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) 
            VALUES ('DLA-BAF', 'Douala', 'Bafoussam', 200, 150, 3000, 'active')");
        $conn->query("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) 
            VALUES ('YDE-BAF', 'Yaoundé', 'Bafoussam', 180, 140, 2800, 'active')");
        $conn->query("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) 
            VALUES ('YDE-DLA', 'Yaoundé', 'Douala', 280, 180, 3500, 'active')");
        $conn->query("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) 
            VALUES ('KRI-DLA', 'Kribi', 'Douala', 150, 120, 2500, 'active')");
        $conn->query("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) 
            VALUES ('BAF-DLA', 'Bafoussam', 'Douala', 200, 150, 3000, 'active')");
        $conn->query("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) 
            VALUES ('BAF-YDE', 'Bafoussam', 'Yaoundé', 180, 140, 2800, 'active')");
        $conn->query("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) 
            VALUES ('DLA-LIM', 'Douala', 'Limbe', 120, 90, 2000, 'active')");
        $conn->query("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) 
            VALUES ('DLA-KUM', 'Douala', 'Kumba', 180, 135, 2800, 'active')");
        
        // Create trips for the next 30 days
        for ($i = 0; $i <= 30; $i++) {
            $trip_date = date('Y-m-d', strtotime("+$i days"));
            $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (1, 1, '$trip_date', '06:00:00', '09:00:00', 3500, 50, 'scheduled')");
            $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (1, 5, '$trip_date', '06:00:00', '09:00:00', 3500, 50, 'scheduled')");
            $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (2, 5, '$trip_date', '05:30:00', '08:30:00', 3500, 40, 'scheduled')");
            $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (2, 2, '$trip_date', '08:00:00', '10:00:00', 2500, 40, 'scheduled')");
            $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (2, 6, '$trip_date', '08:00:00', '10:00:00', 2500, 40, 'scheduled')");
            $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (1, 6, '$trip_date', '11:00:00', '13:00:00', 2500, 50, 'scheduled')");
            $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (3, 4, '$trip_date', '14:00:00', '16:20:00', 2800, 20, 'scheduled')");
            $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (3, 8, '$trip_date', '14:00:00', '16:20:00', 2800, 20, 'scheduled')");
            $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (1, 3, '$trip_date', '16:00:00', '18:30:00', 3000, 50, 'scheduled')");
            $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (1, 7, '$trip_date', '16:00:00', '18:30:00', 3000, 50, 'scheduled')");
            $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (2, 7, '$trip_date', '19:00:00', '21:30:00', 3000, 40, 'scheduled')");
            $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (2, 9, '$trip_date', '07:00:00', '08:30:00', 2000, 40, 'scheduled')");
            $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (1, 10, '$trip_date', '09:00:00', '11:15:00', 2800, 50, 'scheduled')");
        }
    }
    
    $origin = $data['origin'] ?? '';
    $destination = $data['destination'] ?? '';
    $date = $data['date'] ?? '';
    
    $sql = "SELECT t.id, t.departure_date, t.departure_time, t.arrival_time, t.price, t.available_seats,
            r.origin, r.destination, r.route_code, r.distance_km, r.duration_minutes,
            b.id as bus_id, b.bus_number, b.bus_name, b.bus_type, b.amenities, b.total_seats
            FROM trips t 
            JOIN routes r ON t.route_id = r.id 
            JOIN buses b ON t.bus_id = b.id 
            WHERE (t.status = 'scheduled' OR t.status = 'confirmed') AND t.available_seats > 0";
    
    $params = [];
    $types = "";
    
    // If search filters are provided, apply them
    if (!empty($origin)) {
        $sql .= " AND r.origin LIKE ?";
        $params[] = "%$origin%";
        $types .= "s";
    }
    if (!empty($destination)) {
        $sql .= " AND r.destination LIKE ?";
        $params[] = "%$destination%";
        $types .= "s";
    }
    if (!empty($date)) {
        $sql .= " AND t.departure_date = ?";
        $params[] = $date;
        $types .= "s";
    }
    
    $sql .= " ORDER BY t.departure_date, t.departure_time";
    
    $stmt = $conn->prepare($sql);
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    
    $trips = [];
    while ($row = $result->fetch_assoc()) {
        $row['amenities'] = json_decode($row['amenities'] ?? '[]');
        $trips[] = $row;
    }
    
    // If no trips found with filters, try without date filter
    if (empty($trips) && !empty($date)) {
        $sql2 = "SELECT t.id, t.departure_date, t.departure_time, t.arrival_time, t.price, t.available_seats,
                r.origin, r.destination, r.route_code, r.distance_km, r.duration_minutes,
                b.id as bus_id, b.bus_number, b.bus_name, b.bus_type, b.amenities, b.total_seats
                FROM trips t 
                JOIN routes r ON t.route_id = r.id 
                JOIN buses b ON t.bus_id = b.id 
                WHERE t.status = 'scheduled' AND t.available_seats > 0";
        
        $params2 = [];
        $types2 = "";
        
        if (!empty($origin)) {
            $sql2 .= " AND r.origin LIKE ?";
            $params2[] = "%$origin%";
            $types2 .= "s";
        }
        if (!empty($destination)) {
            $sql2 .= " AND r.destination LIKE ?";
            $params2[] = "%$destination%";
            $types2 .= "s";
        }
        
        $sql2 .= " ORDER BY t.departure_date, t.departure_time";
        
        $stmt2 = $conn->prepare($sql2);
        if (!empty($params2)) {
            $stmt2->bind_param($types2, ...$params2);
        }
        $stmt2->execute();
        $result2 = $stmt2->get_result();
        
        while ($row = $result2->fetch_assoc()) {
            $row['amenities'] = json_decode($row['amenities'] ?? '[]');
            $trips[] = $row;
        }
    }
    
    echo json_encode(['status' => 'success', 'trips' => $trips]);
    exit;
}

// ============= BOOKINGS =============
if ($action === 'create_booking') {
    // Ensure tickets table has correct schema - add ALL missing columns
    $conn->query("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ticket_reference VARCHAR(20) UNIQUE");
    $conn->query("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS passenger_name VARCHAR(255)");
    $conn->query("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ticket_status ENUM('active', 'used', 'cancelled') DEFAULT 'active'");
    $conn->query("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
    
    $user_id = $_SESSION['user_id'] ?? $data['user_id'] ?? 0;
    $trip_id = $data['trip_id'] ?? 0;
    $seats = $data['seats'] ?? 1;
    $seat_numbers = $data['seat_numbers'] ?? '';
    $passenger_name = $data['passenger_name'] ?? '';
    $passenger_phone = $data['passenger_phone'] ?? '';
    $passenger_email = $data['passenger_email'] ?? '';
    $id_number = $data['id_number'] ?? '';
    $special_requests = $data['special_requests'] ?? '';
    $payment_method = $data['payment_method'] ?? 'mtn_momo';
    
    // Debug log
    error_log("create_booking called - user_id: $user_id, trip_id: $trip_id, seats: $seats, seat_numbers: $seat_numbers");
    
    // If no user_id, create a guest user
    if (!$user_id || $user_id <= 0) {
        // Create guest user
        $guest_email = !empty($passenger_email) ? $passenger_email : 'guest_' . time() . '@camtransit.com';
        $guest_name = !empty($passenger_name) ? $passenger_name : 'Guest Passenger';
        $guest_pass = password_hash('guest' . time(), PASSWORD_DEFAULT);
        
        $stmt_guest = $conn->prepare("INSERT INTO users (name, email, password, role, created_at) VALUES (?, ?, ?, 'passenger', NOW())");
        $stmt_guest->bind_param("sss", $guest_name, $guest_email, $guest_pass);
        
        if ($stmt_guest->execute()) {
            $user_id = $stmt_guest->insert_id;
            error_log("Created guest user with id: $user_id");
        } else {
            error_log("Failed to create guest user: " . $stmt_guest->error);
            // Try to find existing user by email
            if (!empty($passenger_email)) {
                $check_user = $conn->query("SELECT id FROM users WHERE email = '$passenger_email'");
                if ($check_user && $check_user->num_rows > 0) {
                    $user_row = $check_user->fetch_assoc();
                    $user_id = $user_row['id'];
                }
            }
            // If still no user_id, return error
            if (!$user_id || $user_id <= 0) {
                echo json_encode(['status' => 'error', 'message' => 'Failed to create booking: Unable to identify user. Please login or provide valid email.']);
                exit;
            }
        }
    }
    
    // Verify user exists in database
    $verify_user = $conn->query("SELECT id FROM users WHERE id = $user_id");
    if (!$verify_user || $verify_user->num_rows == 0) {
        echo json_encode(['status' => 'error', 'message' => 'Failed to create booking: User not found. Please login again.']);
        exit;
    }
    
    if (!$trip_id || $trip_id <= 0) {
        echo json_encode(['status' => 'error', 'message' => 'Trip is required']);
        exit;
    }
    
    // Validate required passenger details
    if (empty($passenger_name) || empty($passenger_phone) || empty($passenger_email)) {
        echo json_encode(['status' => 'error', 'message' => 'Passenger name, phone, and email are required']);
        exit;
    }
    
    // Get trip details
    $stmt_trip = $conn->prepare("SELECT * FROM trips WHERE id = ?");
    $stmt_trip->bind_param("i", $trip_id);
    $stmt_trip->execute();
    $trip_result = $stmt_trip->get_result();
    $trip = $trip_result->fetch_assoc();
    
    if (!$trip) {
        echo json_encode(['status' => 'error', 'message' => 'Trip not found. Please search again.']);
        exit;
    }
    
    if ($trip['available_seats'] < $seats) {
        echo json_encode(['status' => 'error', 'message' => 'Not enough seats available. Only ' . $trip['available_seats'] . ' seats left.']);
        exit;
    }
    
    $total_price = $trip['price'] * $seats;
    $ref = 'CT' . strtoupper(uniqid());
    $booking_date = date('Y-m-d H:i:s');
    $travel_date = $trip['departure_date'] ?? date('Y-m-d');
    
    // Insert booking
    $stmt = $conn->prepare("INSERT INTO bookings (user_id, trip_id, booking_reference, number_of_seats, total_price, booking_status, booking_date, travel_date) VALUES (?, ?, ?, ?, ?, 'confirmed', ?, ?)");
    $stmt->bind_param("iisidss", $user_id, $trip_id, $ref, $seats, $total_price, $booking_date, $travel_date);
    
    if ($stmt->execute()) {
        $booking_id = $stmt->insert_id;
        error_log("Booking created with id: $booking_id");
        
        // Update available seats
        $new_seats = $trip['available_seats'] - $seats;
        $stmt_update = $conn->prepare("UPDATE trips SET available_seats = ? WHERE id = ?");
        $stmt_update->bind_param("ii", $new_seats, $trip_id);
        $stmt_update->execute();
        
        // Generate tickets for each seat
        $seat_numbers_input = $data['seat_numbers'] ?? $seat_numbers ?? '';
        $seatArray = !empty($seat_numbers_input) ? explode(',', $seat_numbers_input) : [];
        if (empty($seatArray)) {
            // If no seat numbers provided, generate sequential seats based on number_of_seats
            $numSeats = intval($seats);
            for ($i = 0; $i < $numSeats; $i++) {
                $seatArray[] = strval($i + 1);
            }
        }
        
        $tickets_created = 0;
        foreach ($seatArray as $seat_num) {
            $seat_num = trim($seat_num);
            if ($seat_num) {
                // Each seat gets a unique ticket reference
                $ticket_ref = 'TKT' . strtoupper(uniqid());
                
                // Insert ticket with passenger details
                $sql = "INSERT INTO tickets (booking_id, ticket_reference, seat_number, ticket_status, passenger_name, passenger_phone, created_at) 
                        VALUES ($booking_id, '$ticket_ref', '$seat_num', 'active', '" . $conn->real_escape_string($passenger_name) . "', '" . $conn->real_escape_string($passenger_phone) . "', NOW())";
                
                if ($conn->query($sql)) {
                    $tickets_created++;
                }
            }
        }
        error_log("Created $tickets_created tickets for booking $booking_id");
        
        // Get trip details for notifications
        $tripInfo = $conn->query("
            SELECT r.origin, r.destination, t.departure_date, t.departure_time
            FROM trips t
            JOIN routes r ON t.route_id = r.id
            WHERE t.id = $trip_id
        ")->fetch_assoc();
        
        $routeInfo = $tripInfo['origin'] . ' → ' . $tripInfo['destination'];
        $departureInfo = date('M d, Y', strtotime($tripInfo['departure_date'])) . ' at ' . date('h:i A', strtotime($tripInfo['departure_time']));
        
        // Create notification for user - Booking Confirmation
        $userNotifTitle = 'Booking Confirmed!';
        $userNotifMsg = "Your booking ($ref) for $routeInfo on $departureInfo has been confirmed. $tickets_created ticket(s) issued.";
        createNotification($conn, $user_id, $userNotifTitle, $userNotifMsg, 'booking_confirmation', 'booking', $booking_id);
        
        // Create notification for user - Payment Receipt
        $receiptMsg = "Payment of " . number_format($total_price) . " XAF received. Booking: $ref";
        createNotification($conn, $user_id, 'Payment Receipt', $receiptMsg, 'payment_receipt', 'booking', $booking_id);
        
        // Create notification for user - Seat Allocation
        $seatsMsg = "Seat(s) allocated: " . implode(', ', $seatArray) . " for your trip on $departureInfo";
        createNotification($conn, $user_id, 'Seat Allocated', $seatsMsg, 'seat_allocation', 'booking', $booking_id);
        
        // Create notification for user - Departure Reminder (set for 24 hours before)
        $reminderMsg = "Reminder: Your trip $routeInfo departs tomorrow at " . date('h:i A', strtotime($tripInfo['departure_time']));
        createNotification($conn, $user_id, 'Departure Reminder', $reminderMsg, 'departure_reminder', 'booking', $booking_id);
        
        // Notify admin about new booking
        $adminMsg = "New booking: $passenger_name booked $seats seat(s) for $routeInfo. Total: " . number_format($total_price) . " XAF";
        sendNotificationToAll($conn, 'New Booking', $adminMsg, 'new_booking', 'admin');
        
        // Get the created tickets to return
        $tickets_result = $conn->query("SELECT * FROM tickets WHERE booking_id = $booking_id");
        $created_tickets = [];
        while ($t = $tickets_result->fetch_assoc()) {
            $created_tickets[] = $t;
        }
        
        echo json_encode([
            'status' => 'success', 
            'message' => 'Booking created successfully!',
            'booking' => [
                'id' => $booking_id,
                'reference' => $ref,
                'seats' => $seats,
                'total_price' => $total_price,
                'tickets' => $created_tickets
            ],
            'notifications_sent' => true
        ]);
    } else {
        error_log("Booking insert failed: " . $stmt->error);
        echo json_encode(['status' => 'error', 'message' => 'Failed to create booking: ' . $stmt->error]);
    }
    exit;
}

if ($action === 'get_bookings') {
    $user_id = $_SESSION['user_id'] ?? $data['user_id'] ?? 0;
    
    $stmt = $conn->prepare("
        SELECT b.id, b.booking_reference, b.number_of_seats, b.total_price, b.booking_status, b.booking_date,
               t.departure_date, t.departure_time, t.arrival_time, 
               r.origin, r.destination, r.duration_minutes, bs.bus_number, bs.bus_name, bs.bus_type,
               GROUP_CONCAT(tk.seat_number ORDER BY tk.id SEPARATOR ', ') as seat_numbers
        FROM bookings b
        JOIN trips t ON b.trip_id = t.id
        JOIN routes r ON t.route_id = r.id
        JOIN buses bs ON t.bus_id = bs.id
        LEFT JOIN tickets tk ON tk.booking_id = b.id
        WHERE b.user_id = ?
        GROUP BY b.id
        ORDER BY b.booking_date DESC
    ");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $bookings = [];
    while ($row = $result->fetch_assoc()) {
        $bookings[] = $row;
    }
    echo json_encode(['status' => 'success', 'bookings' => $bookings]);
    exit;
}

// ============= CANCEL BOOKING =============
if ($action === 'cancel_booking') {
    $user_id = $_SESSION['user_id'] ?? $data['user_id'] ?? 0;
    $booking_id = intval($data['booking_id'] ?? 0);
    
    if (!$user_id) {
        echo json_encode(['status' => 'error', 'message' => 'User not authenticated']);
        exit;
    }
    
    if ($booking_id <= 0) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid booking ID']);
        exit;
    }
    
    // Check if booking exists and belongs to user
    $check_stmt = $conn->prepare("SELECT b.id, b.trip_id, b.number_of_seats, b.booking_status FROM bookings b WHERE b.id = ? AND b.user_id = ?");
    $check_stmt->bind_param("ii", $booking_id, $user_id);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();
    $booking = $check_result->fetch_assoc();
    
    if (!$booking) {
        echo json_encode(['status' => 'error', 'message' => 'Booking not found']);
        exit;
    }
    
    // Check if already cancelled or completed
    if ($booking['booking_status'] === 'cancelled') {
        echo json_encode(['status' => 'error', 'message' => 'Booking is already cancelled']);
        exit;
    }
    
    if ($booking['booking_status'] === 'completed') {
        echo json_encode(['status' => 'error', 'message' => 'Cannot cancel a completed trip']);
        exit;
    }
    
    // Update booking status to cancelled
    $update_stmt = $conn->prepare("UPDATE bookings SET booking_status = 'cancelled' WHERE id = ?");
    $update_stmt->bind_param("i", $booking_id);
    
    if ($update_stmt->execute()) {
        // Restore available seats in trips table
        $trip_id = $booking['trip_id'];
        $seats = $booking['number_of_seats'];
        $seats_stmt = $conn->prepare("UPDATE trips SET available_seats = available_seats + ? WHERE id = ?");
        $seats_stmt->bind_param("ii", $seats, $trip_id);
        $seats_stmt->execute();
        
        // Cancel associated tickets
        $ticket_stmt = $conn->prepare("UPDATE tickets SET ticket_status = 'cancelled' WHERE booking_id = ?");
        $ticket_stmt->bind_param("i", $booking_id);
        $ticket_stmt->execute();
        
        // Get booking reference for notifications
        $bookingRef = $conn->query("SELECT booking_reference FROM bookings WHERE id = $booking_id")->fetch_assoc()['booking_reference'];
        
        // Create notification for user - Cancellation Confirmation
        $cancelMsg = "Your booking ($bookingRef) has been cancelled. Your seats have been released and refund will be processed.";
        createNotification($conn, $user_id, 'Booking Cancelled', $cancelMsg, 'cancellation_confirmation', 'booking', $booking_id);
        
        // Notify admin about cancellation
        $adminMsg = "Booking cancelled: $bookingRef by user ID $user_id. $seats seat(s) released.";
        sendNotificationToAll($conn, 'Booking Cancelled', $adminMsg, 'booking_cancelled', 'admin');
        
        echo json_encode(['status' => 'success', 'message' => 'Booking cancelled successfully', 'notifications_sent' => true]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to cancel booking']);
    }
    exit;
}

// ============= TICKETS =============
if ($action === 'get_tickets') {
    $user_id = $_SESSION['user_id'] ?? $data['user_id'] ?? 0;
    
    // Debug
    error_log("get_tickets called with user_id: $user_id");
    
    // First check if tickets table has data
    $ticketCount = $conn->query("SELECT COUNT(*) as cnt FROM tickets")->fetch_assoc()['cnt'];
    error_log("Total tickets in database: $ticketCount");
    
    $stmt = $conn->prepare("
        SELECT t.*, b.booking_reference, b.number_of_seats, b.total_price, b.booking_status,
               tr.departure_date, tr.departure_time, tr.arrival_time,
               r.origin, r.destination,
               bs.bus_number, bs.bus_name, bs.bus_type
        FROM tickets t
        JOIN bookings b ON t.booking_id = b.id
        JOIN trips tr ON b.trip_id = tr.id
        JOIN routes r ON tr.route_id = r.id
        JOIN buses bs ON tr.bus_id = bs.id
        WHERE b.user_id = ?
        ORDER BY tr.departure_date DESC
    ");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $tickets = [];
    while ($row = $result->fetch_assoc()) {
        $tickets[] = $row;
    }
    error_log("Tickets found for user $user_id: " . count($tickets));
    echo json_encode(['status' => 'success', 'tickets' => $tickets]);
    exit;
}

// Fix tickets for existing bookings
if ($action === 'fix_tickets') {
    $user_id = intval($data['user_id'] ?? 0);
    
    // Get all bookings without tickets
    $bookings = $conn->query("
        SELECT b.id, b.user_id, b.trip_id, b.number_of_seats, b.booking_reference,
               tr.departure_date, tr.departure_time, tr.arrival_time,
               r.origin, r.destination, tr.price,
               bs.bus_number, bs.bus_name, bs.bus_type
        FROM bookings b
        JOIN trips tr ON b.trip_id = tr.id
        JOIN routes r ON tr.route_id = r.id
        JOIN buses bs ON tr.bus_id = bs.id
        WHERE b.user_id = $user_id
        AND b.booking_status = 'confirmed'
        AND b.id NOT IN (SELECT booking_id FROM tickets WHERE booking_id IS NOT NULL)
    ");
    
    $created = 0;
    while ($booking = $bookings->fetch_assoc()) {
        // Generate seat number
        $seat_num = $booking['number_of_seats'];
        $ticket_ref = 'TKT' . strtoupper(uniqid());
        
        // Get passenger name from booking or use default
        $passenger_name = 'Passenger';
        
        // Create ticket
        $conn->query("
            INSERT INTO tickets (booking_id, ticket_reference, seat_number, ticket_status, passenger_name)
            VALUES ({$booking['id']}, '$ticket_ref', '$seat_num', 'active', '$passenger_name')
        ");
        $created++;
    }
    
    echo json_encode(['status' => 'success', 'message' => "Created $created tickets"]);
    exit;
}

// ============= SYSTEM ANNOUNCEMENTS =============
if ($action === 'send_announcement') {
    $admin_user_id = $data['admin_user_id'] ?? 0;
    $title = $data['title'] ?? 'System Announcement';
    $message = $data['message'] ?? '';
    $target_role = $data['role'] ?? null; // 'admin', 'driver', 'passenger', or null for all
    
    // Verify admin permissions
    $checkAdmin = $conn->query("SELECT role FROM users WHERE id = " . intval($admin_user_id))->fetch_assoc();
    if (!$checkAdmin || $checkAdmin['role'] !== 'admin') {
        echo json_encode(['status' => 'error', 'message' => 'Only admins can send announcements']);
        exit;
    }
    
    if (empty($message)) {
        echo json_encode(['status' => 'error', 'message' => 'Message is required']);
        exit;
    }
    
    // Send announcement
    $count = sendNotificationToAll($conn, $title, $message, 'system_announcement', $target_role);
    
    // Log the announcement
    error_log("System announcement sent by admin $admin_user_id: $title - $message (sent to $count users)");
    
    echo json_encode([
        'status' => 'success', 
        'message' => "Announcement sent to $count users",
        'sent_count' => $count
    ]);
    exit;
}

// ============= GET NOTIFICATION LOGS =============
if ($action === 'get_notification_logs') {
    $admin_user_id = $data['admin_user_id'] ?? 0;
    
    // Verify admin permissions
    $checkAdmin = $conn->query("SELECT role FROM users WHERE id = " . intval($admin_user_id))->fetch_assoc();
    if (!$checkAdmin || $checkAdmin['role'] !== 'admin') {
        echo json_encode(['status' => 'error', 'message' => 'Only admins can view notification logs']);
        exit;
    }
    
    // Get recent notifications for audit
    $logs = $conn->query("
        SELECT n.*, u.name as user_name, u.email as user_email
        FROM notifications n
        LEFT JOIN users u ON n.user_id = u.id
        ORDER BY n.created_at DESC
        LIMIT 100
    ");
    
    $logsArray = [];
    while ($log = $logs->fetch_assoc()) {
        $logsArray[] = $log;
    }
    
    echo json_encode([
        'status' => 'success', 
        'logs' => $logsArray,
        'total' => count($logsArray)
    ]);
    exit;
}

// ============= DASHBOARD STATS =============
if ($action === 'get_stats') {
    $user_id = $_SESSION['user_id'] ?? $data['user_id'] ?? 0;
    
    // Get user stats - simple count
    $result1 = $conn->query("SELECT COUNT(*) as count FROM bookings WHERE user_id = " . intval($user_id));
    $total_bookings = $result1 ? $result1->fetch_assoc()['count'] ?? 0 : 0;
    
    // Get completed trips
    $result2 = $conn->query("SELECT COUNT(*) as count FROM bookings WHERE user_id = " . intval($user_id) . " AND booking_status = 'completed'");
    $completed_trips = $result2 ? $result2->fetch_assoc()['count'] ?? 0 : 0;
    
    // Get total spent
    $result3 = $conn->query("SELECT SUM(total_price) as total FROM bookings WHERE user_id = " . intval($user_id) . " AND booking_status = 'confirmed'");
    $total_spent = $result3 ? $result3->fetch_assoc()['total'] ?? 0 : 0;
    
    // Get upcoming trips - get ALL confirmed bookings, the frontend will filter by date
    $result_upcoming = $conn->query("SELECT COUNT(*) as count FROM bookings WHERE user_id = " . intval($user_id) . " AND booking_status = 'confirmed'");
    $upcoming_trips = $result_upcoming ? intval($result_upcoming->fetch_assoc()['count']) : 0;
    
    // Get user's most traveled route - join with routes table to get origin/destination
    $fav_result = $conn->query("SELECT CONCAT(r.origin, ' → ', r.destination) as route, COUNT(*) as trip_count FROM bookings b JOIN trips t ON b.trip_id = t.id JOIN routes r ON t.route_id = r.id WHERE b.user_id = " . intval($user_id) . " AND b.booking_status = 'confirmed' GROUP BY r.id ORDER BY trip_count DESC LIMIT 1");
    $favorite_route = ($fav_result && $fav_result->num_rows > 0) ? $fav_result->fetch_assoc()['route'] : 'N/A';
    
    echo json_encode([
        'status' => 'success',
        'stats' => [
            'completed_trips' => $completed_trips,
            'upcoming_trips' => $upcoming_trips,
            'total_spent' => $total_spent,
            'favorite_route' => $favorite_route
        ]
    ]);
    exit;
}

// Default response - moved to end of file after all actions

// ============= AUTO SETUP - Create ALL essential tables =============
if ($action === 'auto_setup') {
    // ... existing code ...
}

// Test ticket creation
if ($action === 'test_ticket') {
    $booking_id = intval($data['booking_id'] ?? 0);
    $ticket_ref = 'TKT' . strtoupper(uniqid());
    
    $sql = "INSERT INTO tickets (booking_id, ticket_reference, seat_number, ticket_status) VALUES ($booking_id, '$ticket_ref', '1', 'active')";
    
    if ($conn->query($sql)) {
        echo json_encode(['status' => 'success', 'message' => 'Ticket created', 'id' => $conn->insert_id]);
    } else {
        echo json_encode(['status' => 'error', 'message' => $conn->error, 'sql' => $sql]);
    }
    exit;
}

// ============= AUTO SETUP - Create ALL essential tables =============
if ($action === 'auto_setup') {
    // Create tables if they don't exist - COMPLETE SET
    $conn->query("CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        username VARCHAR(100) UNIQUE,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        gender ENUM('male', 'female', 'other') NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'driver', 'passenger') DEFAULT 'passenger',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB");
    
    $conn->query("CREATE TABLE IF NOT EXISTS buses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bus_number VARCHAR(20) UNIQUE,
        bus_name VARCHAR(100),
        bus_type ENUM('standard', 'luxury', 'vip') DEFAULT 'standard',
        total_seats INT DEFAULT 50,
        available_seats INT DEFAULT 50,
        amenities JSON,
        status ENUM('active', 'maintenance', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB");
    
    // Schema migration for routes: Fix column names if using old schema
    $columns_result = $conn->query("SHOW COLUMNS FROM routes LIKE 'departure_city'");
    if ($columns_result && $columns_result->num_rows > 0) {
        $conn->query("ALTER TABLE routes ADD COLUMN origin VARCHAR(100) AFTER id");
        $conn->query("ALTER TABLE routes ADD COLUMN destination VARCHAR(100) AFTER origin");
        $conn->query("UPDATE routes SET origin = departure_city, destination = destination_city WHERE origin IS NULL OR origin = ''");
        $conn->query("ALTER TABLE routes DROP COLUMN departure_city");
        $conn->query("ALTER TABLE routes DROP COLUMN destination_city");
    }
    
    $conn->query("CREATE TABLE IF NOT EXISTS routes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        route_code VARCHAR(20) UNIQUE,
        origin VARCHAR(100),
        destination VARCHAR(100),
        distance_km DECIMAL(10,2),
        duration_minutes INT,
        base_price DECIMAL(10,2),
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB");
    
    $conn->query("CREATE TABLE IF NOT EXISTS trips (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bus_id INT,
        route_id INT,
        departure_date DATE,
        departure_time TIME,
        arrival_time TIME,
        price DECIMAL(10,2),
        available_seats INT DEFAULT 50,
        status ENUM('scheduled', 'confirmed', 'completed', 'cancelled') DEFAULT 'scheduled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (bus_id) REFERENCES buses(id),
        FOREIGN KEY (route_id) REFERENCES routes(id)
    ) ENGINE=InnoDB");
    
    $conn->query("CREATE TABLE IF NOT EXISTS bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        trip_id INT,
        booking_reference VARCHAR(20) UNIQUE,
        number_of_seats INT DEFAULT 1,
        total_price DECIMAL(10,2),
        booking_status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
        booking_date DATE,
        travel_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (trip_id) REFERENCES trips(id)
    ) ENGINE=InnoDB");
    
    // Tickets table with all columns
    $conn->query("CREATE TABLE IF NOT EXISTS tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_id INT,
        ticket_reference VARCHAR(20) UNIQUE,
        seat_number VARCHAR(10),
        passenger_name VARCHAR(255),
        ticket_status ENUM('active', 'used', 'cancelled') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(id)
    ) ENGINE=InnoDB");
    
    // Additional essential tables
    $conn->query("CREATE TABLE IF NOT EXISTS passengers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        username VARCHAR(100),
        phone VARCHAR(20),
        gender ENUM('male', 'female', 'other') NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB");
    
    $conn->query("CREATE TABLE IF NOT EXISTS drivers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        license_number VARCHAR(50) UNIQUE,
        license_expiry DATE,
        status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
        assigned_bus_id INT,
        assigned_route_id INT,
        rating DECIMAL(3,2) DEFAULT 5.00,
        total_trips INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB");
    
    $conn->query("CREATE TABLE IF NOT EXISTS user_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        email_notifications TINYINT(1) DEFAULT 1,
        sms_notifications TINYINT(1) DEFAULT 1,
        booking_confirmations TINYINT(1) DEFAULT 1,
        trip_reminders TINYINT(1) DEFAULT 1,
        promotions TINYINT(1) DEFAULT 0,
        two_factor_enabled TINYINT(1) DEFAULT 0,
        language VARCHAR(10) DEFAULT 'en',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB");
    
    $conn->query("CREATE TABLE IF NOT EXISTS payment_methods (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type ENUM('mobile_money', 'card') NOT NULL,
        provider VARCHAR(50),
        account_number VARCHAR(50),
        is_default TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB");
    
    $conn->query("CREATE TABLE IF NOT EXISTS login_activity (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        device VARCHAR(255),
        location VARCHAR(255),
        ip_address VARCHAR(45),
        is_current TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB");
    
    // Schema migration: Fix column names if using old schema (departure_city/destination_city)
    $columns_result = $conn->query("SHOW COLUMNS FROM routes LIKE 'departure_city'");
    if ($columns_result && $columns_result->num_rows > 0) {
        // Old schema exists - migrate data and rename columns
        $conn->query("ALTER TABLE routes ADD COLUMN origin VARCHAR(100) AFTER id");
        $conn->query("ALTER TABLE routes ADD COLUMN destination VARCHAR(100) AFTER origin");
        $conn->query("UPDATE routes SET origin = departure_city, destination = destination_city WHERE origin IS NULL OR origin = ''");
        $conn->query("ALTER TABLE routes DROP COLUMN departure_city");
        $conn->query("ALTER TABLE routes DROP COLUMN destination_city");
    }
    
    // Also add missing columns if needed
    $check_origin = $conn->query("SHOW COLUMNS FROM routes LIKE 'origin'");
    if (!$check_origin || $check_origin->num_rows == 0) {
        $conn->query("ALTER TABLE routes ADD COLUMN origin VARCHAR(100)");
    }
    $check_dest = $conn->query("SHOW COLUMNS FROM routes LIKE 'destination'");
    if (!$check_dest || $check_dest->num_rows == 0) {
        $conn->query("ALTER TABLE routes ADD COLUMN destination VARCHAR(100)");
    }
    
    $conn->query("CREATE TABLE IF NOT EXISTS trips (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bus_id INT,
        route_id INT,
        departure_date DATE,
        departure_time TIME,
        arrival_time TIME,
        price DECIMAL(10,2),
        available_seats INT DEFAULT 50,
        status ENUM('scheduled', 'confirmed', 'completed', 'cancelled') DEFAULT 'scheduled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (bus_id) REFERENCES buses(id),
        FOREIGN KEY (route_id) REFERENCES routes(id)
    ) ENGINE=InnoDB");
    
    $conn->query("CREATE TABLE IF NOT EXISTS bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        trip_id INT,
        booking_reference VARCHAR(20) UNIQUE,
        number_of_seats INT DEFAULT 1,
        total_price DECIMAL(10,2),
        booking_status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
        booking_date DATE,
        travel_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (trip_id) REFERENCES trips(id)
    ) ENGINE=InnoDB");
    
    $conn->query("CREATE TABLE IF NOT EXISTS tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_id INT,
        ticket_reference VARCHAR(20) UNIQUE,
        seat_number VARCHAR(10),
        passenger_name VARCHAR(255),
        ticket_status ENUM('active', 'used', 'cancelled') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(id)
    ) ENGINE=InnoDB");
    
    // Check current counts
    $userCount = $conn->query("SELECT COUNT(*) as cnt FROM users")->fetch_assoc()['cnt'];
    $busCount = $conn->query("SELECT COUNT(*) as cnt FROM buses")->fetch_assoc()['cnt'];
    $routeCount = $conn->query("SELECT COUNT(*) as cnt FROM routes")->fetch_assoc()['cnt'];
    $tripCount = $conn->query("SELECT COUNT(*) as cnt FROM trips")->fetch_assoc()['cnt'];
    
    // Create users if none exist
    if ($userCount == 0) {
        $admin_pass = password_hash('admin123', PASSWORD_DEFAULT);
        $passenger_pass = password_hash('passenger123', PASSWORD_DEFAULT);
        $conn->query("INSERT INTO users (name, username, email, phone, password, role) 
            VALUES ('Admin User', 'admin', 'admin@camtransit.com', '237600000000', '$admin_pass', 'admin')");
        $conn->query("INSERT INTO users (name, username, email, phone, password, role) 
            VALUES ('Alice Passenger', 'apassenger', 'passenger@camtransit.com', '237600000001', '$passenger_pass', 'passenger')");
    }
    
    // Create buses if none exist
    if ($busCount == 0) {
        $conn->query("INSERT INTO buses (bus_number, bus_name, bus_type, total_seats, available_seats, amenities, status) 
            VALUES ('BUS-001', 'CamTransit Express', 'luxury', 50, 50, '[\"WiFi\", \"AC\", \"USB\", \"Refreshments\"]', 'active')");
        $conn->query("INSERT INTO buses (bus_number, bus_name, bus_type, total_seats, available_seats, amenities, status) 
            VALUES ('BUS-002', 'City Liner', 'standard', 40, 40, '[\"AC\", \"WiFi\"]', 'active')");
        $conn->query("INSERT INTO buses (bus_number, bus_name, bus_type, total_seats, available_seats, amenities, status) 
            VALUES ('BUS-003', 'VIP Coach', 'vip', 20, 20, '[\"WiFi\", \"AC\", \"USB\", \"Refreshments\", \"Reclining Seats\"]', 'active')");
    }
    
    // Create routes if none exist
    if ($routeCount == 0) {
        $conn->query("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) 
            VALUES ('DLA-YDE', 'Douala', 'Yaoundé', 280, 180, 3500, 'active')");
        $conn->query("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) 
            VALUES ('DLA-KRI', 'Douala', 'Kribi', 150, 120, 2500, 'active')");
        $conn->query("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) 
            VALUES ('DLA-BAF', 'Douala', 'Bafoussam', 200, 150, 3000, 'active')");
        $conn->query("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) 
            VALUES ('YDE-BAF', 'Yaoundé', 'Bafoussam', 180, 140, 2800, 'active')");
        $conn->query("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) 
            VALUES ('YDE-DLA', 'Yaoundé', 'Douala', 280, 180, 3500, 'active')");
        $conn->query("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) 
            VALUES ('KRI-DLA', 'Kribi', 'Douala', 150, 120, 2500, 'active')");
        $conn->query("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) 
            VALUES ('BAF-DLA', 'Bafoussam', 'Douala', 200, 150, 3000, 'active')");
        $conn->query("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) 
            VALUES ('BAF-YDE', 'Bafoussam', 'Yaoundé', 180, 140, 2800, 'active')");
        $conn->query("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) 
            VALUES ('DLA-LIM', 'Douala', 'Limbe', 120, 90, 2000, 'active')");
        $conn->query("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) 
            VALUES ('DLA-KUM', 'Douala', 'Kumba', 180, 135, 2800, 'active')");
    }
    
    // Create trips if none exist
    if ($tripCount == 0) {
        for ($i = 0; $i <= 30; $i++) {
            $trip_date = date('Y-m-d', strtotime("+$i days"));
            $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (1, 1, '$trip_date', '06:00:00', '09:00:00', 3500, 50, 'scheduled')");
            $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (1, 5, '$trip_date', '06:00:00', '09:00:00', 3500, 50, 'scheduled')");
            $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (2, 5, '$trip_date', '05:30:00', '08:30:00', 3500, 40, 'scheduled')");
            $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (2, 2, '$trip_date', '08:00:00', '10:00:00', 2500, 40, 'scheduled')");
            $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (2, 6, '$trip_date', '08:00:00', '10:00:00', 2500, 40, 'scheduled')");
            $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (1, 6, '$trip_date', '11:00:00', '13:00:00', 2500, 50, 'scheduled')");
            $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (3, 4, '$trip_date', '14:00:00', '16:20:00', 2800, 20, 'scheduled')");
            $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (3, 8, '$trip_date', '14:00:00', '16:20:00', 2800, 20, 'scheduled')");
            $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (1, 3, '$trip_date', '16:00:00', '18:30:00', 3000, 50, 'scheduled')");
            $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (1, 7, '$trip_date', '16:00:00', '18:30:00', 3000, 50, 'scheduled')");
            $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (2, 7, '$trip_date', '19:00:00', '21:30:00', 3000, 40, 'scheduled')");
            $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (2, 9, '$trip_date', '07:00:00', '08:30:00', 2000, 40, 'scheduled')");
            $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (1, 10, '$trip_date', '09:00:00', '11:15:00', 2800, 50, 'scheduled')");
        }
    }
    
    // Get final counts
    $finalUserCount = $conn->query("SELECT COUNT(*) as cnt FROM users")->fetch_assoc()['cnt'];
    $finalBusCount = $conn->query("SELECT COUNT(*) as cnt FROM buses")->fetch_assoc()['cnt'];
    $finalRouteCount = $conn->query("SELECT COUNT(*) as cnt FROM routes")->fetch_assoc()['cnt'];
    $finalTripCount = $conn->query("SELECT COUNT(*) as cnt FROM trips")->fetch_assoc()['cnt'];
    
    echo json_encode([
        'status' => 'success', 
        'message' => 'Auto setup complete!',
        'setup' => true,
        'data' => [
            'users' => $finalUserCount,
            'buses' => $finalBusCount,
            'routes' => $finalRouteCount,
            'trips' => $finalTripCount
        ]
    ]);
    exit;
}

$conn->query("CREATE TABLE IF NOT EXISTS routes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        route_code VARCHAR(20) UNIQUE,
        origin VARCHAR(100),
        destination VARCHAR(100),
        distance_km DECIMAL(10,2),
        duration_minutes INT,
        base_price DECIMAL(10,2),
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB");
    
    $conn->query("CREATE TABLE IF NOT EXISTS trips (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bus_id INT,
        route_id INT,
        departure_date DATE,
        departure_time TIME,
        arrival_time TIME,
        price DECIMAL(10,2),
        available_seats INT DEFAULT 50,
        status ENUM('scheduled', 'confirmed', 'completed', 'cancelled') DEFAULT 'scheduled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (bus_id) REFERENCES buses(id),
        FOREIGN KEY (route_id) REFERENCES routes(id)
    ) ENGINE=InnoDB");
    
    $conn->query("CREATE TABLE IF NOT EXISTS bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        trip_id INT,
        booking_reference VARCHAR(20) UNIQUE,
        number_of_seats INT DEFAULT 1,
        total_price DECIMAL(10,2),
        booking_status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
        booking_date DATE,
        travel_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (trip_id) REFERENCES trips(id)
    ) ENGINE=InnoDB");
    
    $conn->query("CREATE TABLE IF NOT EXISTS tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_id INT,
        ticket_reference VARCHAR(20) UNIQUE,
        seat_number VARCHAR(10),
        passenger_name VARCHAR(255),
        ticket_status ENUM('active', 'used', 'cancelled') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(id)
    ) ENGINE=InnoDB");
    
// ============= GET BOOKED SEATS =============
if ($action === 'get_booked_seats') {
    $trip_id = $data['trip_id'] ?? 0;
    
    if (!$trip_id) {
        echo json_encode(['status' => 'error', 'message' => 'Trip ID is required']);
        exit;
    }
    
    // Get all booked seats for this trip
    $stmt = $conn->prepare("
        SELECT tk.seat_number 
        FROM tickets tk
        JOIN bookings b ON tk.booking_id = b.id
        WHERE b.trip_id = ? AND b.booking_status IN ('confirmed', 'pending')
    ");
    $stmt->bind_param("i", $trip_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $booked_seats = [];
    while ($row = $result->fetch_assoc()) {
        $booked_seats[] = $row['seat_number'];
    }
    
    // Get trip capacity
    $cap_stmt = $conn->prepare("SELECT b.total_seats, b.available_seats, t.departure_date, t.departure_time FROM trips t JOIN buses b ON t.bus_id = b.id WHERE t.id = ?");
    $cap_stmt->bind_param("i", $trip_id);
    $cap_stmt->execute();
    $cap_result = $cap_stmt->get_result();
    $trip_info = $cap_result->fetch_assoc();
    
    echo json_encode([
        'status' => 'success', 
        'booked_seats' => $booked_seats,
        'total_seats' => $trip_info['total_seats'] ?? 0,
        'available_seats' => $trip_info['available_seats'] ?? 0,
        'departure_date' => $trip_info['departure_date'] ?? '',
        'departure_time' => $trip_info['departure_time'] ?? ''
    ]);
    exit;
}

// ============= VALIDATE SEATS BEFORE BOOKING =============
if ($action === 'validate_seats') {
    $trip_id = intval($data['trip_id'] ?? 0);
    $seat_numbers = $data['seat_numbers'] ?? [];
    
    if (!$trip_id) {
        echo json_encode(['status' => 'error', 'message' => 'Trip ID is required']);
        exit;
    }
    
    if (empty($seat_numbers)) {
        echo json_encode(['status' => 'error', 'message' => 'No seats selected']);
        exit;
    }
    
    // Get currently booked seats
    $stmt = $conn->prepare("
        SELECT tk.seat_number 
        FROM tickets tk
        JOIN bookings b ON tk.booking_id = b.id
        WHERE b.trip_id = ? AND b.booking_status IN ('confirmed', 'pending')
    ");
    $stmt->bind_param("i", $trip_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $booked_seats = [];
    while ($row = $result->fetch_assoc()) {
        $booked_seats[] = intval($row['seat_number']);
    }
    
    // Check if any selected seats are already taken
    $already_taken = [];
    foreach ($seat_numbers as $seat) {
        if (in_array(intval($seat), $booked_seats)) {
            $already_taken[] = $seat;
        }
    }
    
    if (!empty($already_taken)) {
        echo json_encode([
            'status' => 'error', 
            'message' => 'Some seats are already taken: ' . implode(', ', $already_taken),
            'taken_seats' => $already_taken
        ]);
        exit;
    }
    
    // Check if trip has enough available seats
    $num_seats = count($seat_numbers);
    $cap_stmt = $conn->prepare("SELECT available_seats FROM trips WHERE id = ?");
    $cap_stmt->bind_param("i", $trip_id);
    $cap_stmt->execute();
    $available = $cap_stmt->get_result()->fetch_assoc()['available_seats'] ?? 0;
    
    if ($available < $num_seats) {
        echo json_encode([
            'status' => 'error', 
            'message' => "Only $available seats available for this trip"
        ]);
        exit;
    }
    
    echo json_encode([
        'status' => 'success', 
        'message' => 'Seats are available',
        'validated_seats' => $seat_numbers
    ]);
    exit;
}
