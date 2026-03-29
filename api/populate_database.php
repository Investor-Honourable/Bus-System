<?php
/**
 * Populate Database with Sample Data
 * Run this script once to add realistic data to the database
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
    // Check if data already exists
    $result = $conn->query("SELECT COUNT(*) as count FROM users");
    $row = $result->fetch_assoc();
    
    if ($row['count'] > 0) {
        echo json_encode([
            'status' => 'info',
            'message' => 'Database already contains data',
            'user_count' => $row['count']
        ]);
        exit;
    }

    // Insert Users
    $users = [
        ['Admin User', 'admin', 'admin@camtransit.com', '+237600000001', 'male', password_hash('admin123', PASSWORD_DEFAULT), 'admin'],
        ['John Driver', 'johndriver', 'driver@camtransit.com', '+237600000002', 'male', password_hash('driver123', PASSWORD_DEFAULT), 'driver'],
        ['Alice Passenger', 'alice', 'passenger@camtransit.com', '+237600000003', 'female', password_hash('passenger123', PASSWORD_DEFAULT), 'passenger'],
        ['Marie Driver', 'mariedriver', 'marie@camtransit.com', '+237600000004', 'female', password_hash('driver123', PASSWORD_DEFAULT), 'driver'],
        ['Bob Passenger', 'bob', 'bob@camtransit.com', '+237600000005', 'male', password_hash('passenger123', PASSWORD_DEFAULT), 'passenger'],
        ['Sarah Passenger', 'sarah', 'sarah@camtransit.com', '+237600000006', 'female', password_hash('passenger123', PASSWORD_DEFAULT), 'passenger']
    ];

    $stmt = $conn->prepare("INSERT INTO users (name, username, email, phone, gender, password, role) VALUES (?, ?, ?, ?, ?, ?, ?)");
    foreach ($users as $user) {
        $stmt->bind_param("sssssss", $user[0], $user[1], $user[2], $user[3], $user[4], $user[5], $user[6]);
        $stmt->execute();
    }

    // Insert Drivers
    $drivers = [
        [2, 'DL001234', '2027-12-31', 'active', 4.8],
        [4, 'DL005678', '2027-12-31', 'active', 4.6]
    ];

    $stmt = $conn->prepare("INSERT INTO drivers (user_id, license_number, license_expiry, status, rating) VALUES (?, ?, ?, ?, ?)");
    foreach ($drivers as $driver) {
        $stmt->bind_param("isssd", $driver[0], $driver[1], $driver[2], $driver[3], $driver[4]);
        $stmt->execute();
    }

    // Insert Passengers
    $passengers = [
        [3, 'Alice', 'Passenger', '+237600000003'],
        [5, 'Bob', 'Passenger', '+237600000005'],
        [6, 'Sarah', 'Passenger', '+237600000006']
    ];

    $stmt = $conn->prepare("INSERT INTO passengers (user_id, first_name, last_name, phone) VALUES (?, ?, ?, ?)");
    foreach ($passengers as $passenger) {
        $stmt->bind_param("isss", $passenger[0], $passenger[1], $passenger[2], $passenger[3]);
        $stmt->execute();
    }

    // Insert Buses
    $buses = [
        ['BUS001', 'Mercedes-Benz Tourismo', 'luxury', 45, 'active', 'WiFi, AC, USB Charging, Reclining Seats'],
        ['BUS002', 'Volvo 9700', 'standard', 50, 'active', 'AC, USB Charging'],
        ['BUS003', 'Scania Touring', 'vip', 30, 'active', 'WiFi, AC, USB Charging, Reclining Seats, Entertainment'],
        ['BUS004', 'Toyota Coaster', 'minibus', 25, 'active', 'AC'],
        ['BUS005', 'Yutong ZK6122', 'standard', 55, 'active', 'AC, USB Charging']
    ];

    $stmt = $conn->prepare("INSERT INTO buses (bus_number, model, type, capacity, status, amenities) VALUES (?, ?, ?, ?, ?, ?)");
    foreach ($buses as $bus) {
        $stmt->bind_param("sssiss", $bus[0], $bus[1], $bus[2], $bus[3], $bus[4], $bus[5]);
        $stmt->execute();
    }

    // Insert Routes
    $routes = [
        ['DLA-YDE', 'Douala', 'Yaoundé', 280, 240, 5000, 'active'],
        ['DLA-KRI', 'Douala', 'Kribi', 150, 120, 3000, 'active'],
        ['DLA-BUE', 'Douala', 'Buea', 70, 60, 1500, 'active'],
        ['DLA-LIM', 'Douala', 'Limbe', 80, 70, 1800, 'active'],
        ['DLA-BAM', 'Douala', 'Bamenda', 350, 300, 6000, 'active'],
        ['YDE-BAM', 'Yaoundé', 'Bamenda', 300, 270, 5500, 'active'],
        ['YDE-BUE', 'Yaoundé', 'Buea', 320, 280, 5500, 'active'],
        ['DLA-BAF', 'Douala', 'Bafoussam', 250, 210, 4500, 'active'],
        ['YDE-BAF', 'Yaoundé', 'Bafoussam', 200, 180, 4000, 'active'],
        ['DLA-KUM', 'Douala', 'Kumba', 180, 150, 3500, 'active']
    ];

    $stmt = $conn->prepare("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
    foreach ($routes as $route) {
        $stmt->bind_param("sssdiis", $route[0], $route[1], $route[2], $route[3], $route[4], $route[5], $route[6]);
        $stmt->execute();
    }

    // Insert Trips (for next 7 days)
    $tripCount = 0;
    $stmt = $conn->prepare("INSERT INTO trips (bus_id, route_id, driver_id, departure_time, arrival_time, price, available_seats, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    
    for ($day = 0; $day < 7; $day++) {
        $date = date('Y-m-d', strtotime("+{$day} days"));
        
        foreach ($routes as $routeIndex => $route) {
            $routeId = $routeIndex + 1;
            $busId = ($routeIndex % count($buses)) + 1;
            $driverId = ($routeIndex % count($drivers)) + 1;
            
            // Morning trip
            $departure = $date . ' 06:00:00';
            $arrival = $date . ' ' . date('H:i:s', strtotime("+{$route[4]} minutes", strtotime($departure)));
            $price = $route[5];
            $seats = $buses[$busId - 1][3];
            
            $stmt->bind_param("iiissdii", $busId, $routeId, $driverId, $departure, $arrival, $price, $seats, 'scheduled');
            $stmt->execute();
            $tripCount++;
            
            // Afternoon trip
            $departure = $date . ' 14:00:00';
            $arrival = $date . ' ' . date('H:i:s', strtotime("+{$route[4]} minutes", strtotime($departure)));
            
            $stmt->bind_param("iiissdii", $busId, $routeId, $driverId, $departure, $arrival, $price, $seats, 'scheduled');
            $stmt->execute();
            $tripCount++;
        }
    }

    // Insert Bookings
    $bookings = [
        [3, 1, 'BK001', 2, 10000, 'confirmed', 'mobile_money'],
        [5, 3, 'BK002', 1, 5000, 'confirmed', 'cash'],
        [6, 5, 'BK003', 3, 15000, 'pending', 'card']
    ];

    $stmt = $conn->prepare("INSERT INTO bookings (passenger_id, trip_id, booking_reference, seats, total_amount, status, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?)");
    foreach ($bookings as $booking) {
        $stmt->bind_param("iisidss", $booking[0], $booking[1], $booking[2], $booking[3], $booking[4], $booking[5], $booking[6]);
        $stmt->execute();
    }

    // Insert Notifications
    $notifications = [
        [3, 'booking', 'Booking Confirmed', 'Your booking BK001 has been confirmed.'],
        [5, 'booking', 'Booking Confirmed', 'Your booking BK002 has been confirmed.'],
        [6, 'booking', 'Payment Pending', 'Please complete payment for booking BK003.'],
        [1, 'system', 'New Booking', 'New booking BK001 received.'],
        [2, 'trip', 'Trip Assignment', 'You have been assigned to trip #1.']
    ];

    $stmt = $conn->prepare("INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)");
    foreach ($notifications as $notification) {
        $stmt->bind_param("isss", $notification[0], $notification[1], $notification[2], $notification[3]);
        $stmt->execute();
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'Database populated successfully',
        'data' => [
            'users' => count($users),
            'drivers' => count($drivers),
            'passengers' => count($passengers),
            'buses' => count($buses),
            'routes' => count($routes),
            'trips' => $tripCount,
            'bookings' => count($bookings),
            'notifications' => count($notifications)
        ]
    ]);

} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Error populating database: ' . $e->getMessage()
    ]);
}
?>
