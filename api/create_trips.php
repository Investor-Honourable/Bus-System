<?php
/**
 * Create Fresh Real Trips - For Real Bookings
 * Creates realistic trips for the next 7 days with proper schedule
 */

session_start();
require 'config/db.php';

header('Content-Type: application/json');

echo "=== Creating Fresh Real Trips ===\n\n";

try {
    // Get available routes
    $result = $conn->query("SELECT id, route_code, origin, destination, base_price FROM routes WHERE status = 'active' ORDER BY origin");
    $routes = [];
    while ($row = $result->fetch_assoc()) {
        $routes[] = $row;
    }

    // Get available buses
    $result = $conn->query("SELECT id, bus_number, total_seats FROM buses WHERE status = 'active' ORDER BY id");
    $buses = [];
    while ($row = $result->fetch_assoc()) {
        $buses[] = $row;
    }

    // Get available drivers
    $result = $conn->query("SELECT id, user_id FROM drivers WHERE status = 'active' ORDER BY id");
    $drivers = [];
    while ($row = $result->fetch_assoc()) {
        $drivers[] = $row;
    }

    if (empty($routes) || empty($buses) || empty($drivers)) {
        echo "Error: Need at least 1 route, 1 bus, and 1 driver\n";
        exit;
    }

    echo "Found " . count($routes) . " routes, " . count($buses) . " buses, " . count($drivers) . " drivers\n\n";

    $tripCount = 0;
    $schedule = [
        '06:00:00', // Morning
        '08:00:00', // Late morning
        '10:00:00', // Midday
        '14:00:00', // Afternoon
        '16:00:00'  // Evening
    ];

    $stmt = $conn->prepare("INSERT INTO trips (bus_id, route_id, driver_id, departure_date, departure_time, arrival_time, price, available_seats, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')");

    // Create trips for next 14 days
    for ($day = 0; $day < 14; $day++) {
        $date = date('Y-m-d', strtotime("+{$day} days"));
        
        // Skip Sundays (optional - many bus companies don't operate)
        $dayOfWeek = date('w', strtotime($date));
        // if ($dayOfWeek == 0) continue; // Uncomment to skip Sundays

        foreach ($routes as $routeIndex => $route) {
            // Use different buses and drivers for variety
            $busIndex = $routeIndex % count($buses);
            $driverIndex = $routeIndex % count($drivers);
            
            // Take first few departure times per route per day
            foreach ($schedule as $timeIndex => $departureTime) {
                // Only create 2-3 trips per route per day to keep it realistic
                if ($timeIndex > 2) break;
                
                $bus = $buses[$busIndex];
                $driver = $drivers[$driverIndex];
                
                // Calculate arrival time based on route (estimate 1 hour per 100km)
                $duration = rand(120, 360); // 2-6 hours in minutes
                $arrivalTimestamp = strtotime($date . ' ' . $departureTime . ' +' . $duration . ' minutes');
                $arrivalTime = date('H:i:s', $arrivalTimestamp);
                
                $price = $route['base_price'];
                $seats = $bus['total_seats'];
                
                $stmt->bind_param("iiisssdi", $bus['id'], $route['id'], $driver['id'], $date, $departureTime, $arrivalTime, $price, $seats);
                $stmt->execute();
                $tripCount++;
            }
        }
    }

    echo "✓ Created $tripCount fresh trips\n\n";
    echo "=== Ready for Real Bookings ===\n";
    echo "Passengers can now search routes and book trips.\n";
    echo "Trips are scheduled for the next 14 days.\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

$conn->close();
?>