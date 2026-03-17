<?php
/**
 * Sample Data Setup - Adds sample routes, buses, and trips
 * Run this to populate the database with sample data
 * WARNING: This only adds data if tables are empty - won't duplicate existing data
 */

$db_host = 'localhost';
$db_name = 'bus_system';
$db_user = 'root';
$db_pass = '';

header('Content-Type: text/html; charset=utf-8');

echo "<h1>📊 Adding Sample Data...</h1>";

try {
    $conn = new mysqli($db_host, $db_user, $db_pass);
    
    if ($conn->connect_error) {
        die("<p style='color:red'>Connection failed: " . $conn->connect_error . "</p>");
    }
    
    echo "<p>✓ Connected to MySQL</p>";
    
    $conn->select_db($db_name);
    echo "<p>✓ Using database '$db_name'</p><hr>";
    
    // Check if tables exist
    $tables = ['routes', 'buses', 'trips'];
    foreach ($tables as $table) {
        $result = $conn->query("SHOW TABLES LIKE '$table'");
        if ($result->num_rows === 0) {
            die("<p style='color:red'>Table '$table' doesn't exist. Please run restore_database.php first.</p>");
        }
    }
    
    // Add sample routes (only if routes table is empty)
    $routeCount = $conn->query("SELECT COUNT(*) as cnt FROM routes")->fetch_assoc()['cnt'];
    if ($routeCount == 0) {
        $routes = [
            ['Douala - Yaoundé', 'Douala', 'Yaoundé', 250, 180, 3500],
            ['Yaoundé - Douala', 'Yaoundé', 'Douala', 250, 180, 3500],
            ['Bafoussam - Douala', 'Bafoussam', 'Douala', 180, 150, 2500],
            ['Douala - Bafoussam', 'Douala', 'Bafoussam', 180, 150, 2500],
            ['Kribi - Douala', 'Kribi', 'Douala', 150, 120, 2000],
            ['Douala - Kribi', 'Douala', 'Kribi', 150, 120, 2000],
            ['Bamenda - Douala', 'Bamenda', 'Douala', 320, 240, 4000],
            ['Douala - Bamenda', 'Douala', 'Bamenda', 320, 240, 4000],
        ];
        
        $stmt = $conn->prepare("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price) VALUES (?, ?, ?, ?, ?, ?)");
        
        foreach ($routes as $route) {
            $code = strtoupper(substr($route[1], 0, 3) . substr($route[2], 0, 3) . rand(10, 99));
            $stmt->bind_param("sssiid", $code, $route[1], $route[2], $route[3], $route[4], $route[5]);
            $stmt->execute();
        }
        
        echo "<p>✓ Added " . count($routes) . " routes</p>";
    } else {
        echo "<p>✓ Routes already exist ($routeCount records)</p>";
    }
    
    // Add sample buses (only if buses table is empty)
    $busCount = $conn->query("SELECT COUNT(*) as cnt FROM buses")->fetch_assoc()['cnt'];
    if ($busCount == 0) {
        $buses = [
            ['BUS001', 'CamTransit 1', 'standard', 50],
            ['BUS002', 'CamTransit 2', 'standard', 50],
            ['BUS003', 'CamTransit VIP 1', 'vip', 30],
            ['BUS004', 'CamTransit VIP 2', 'vip', 30],
            ['BUS005', 'CamTransit Luxury', 'luxury', 20],
        ];
        
        $stmt = $conn->prepare("INSERT INTO buses (bus_number, bus_name, bus_type, total_seats, available_seats) VALUES (?, ?, ?, ?, ?)");
        
        foreach ($buses as $bus) {
            $stmt->bind_param("sssii", $bus[0], $bus[1], $bus[2], $bus[3], $bus[3]);
            $stmt->execute();
        }
        
        echo "<p>✓ Added " . count($buses) . " buses</p>";
    } else {
        echo "<p>✓ Buses already exist ($busCount records)</p>";
    }
    
    // Add sample trips (only if trips table is empty)
    $tripCount = $conn->query("SELECT COUNT(*) as cnt FROM trips")->fetch_assoc()['cnt'];
    if ($tripCount == 0) {
        // Get route and bus IDs
        $routes = $conn->query("SELECT id, origin FROM routes")->fetch_all(MYSQLI_ASSOC);
        $buses = $conn->query("SELECT id, bus_number FROM buses")->fetch_all(MYSQLI_ASSOC);
        
        if (count($routes) > 0 && count($buses) > 0) {
            $today = date('Y-m-d');
            $times = ['06:00:00', '08:00:00', '10:00:00', '12:00:00', '14:00:00', '16:00:00', '18:00:00', '20:00:00'];
            $statuses = ['scheduled', 'scheduled', 'scheduled', 'completed', 'completed'];
            
            $stmt = $conn->prepare("INSERT INTO trips (route_id, bus_id, departure_date, departure_time, arrival_time, price, available_seats, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            
            $tripId = 1;
            // Create trips for the next 7 days
            for ($day = 0; $day < 7; $day++) {
                $date = date('Y-m-d', strtotime("+$day days"));
                foreach ($routes as $route) {
                    foreach (array_slice($buses, 0, 3) as $bus) {
                        $time = $times[array_rand($times)];
                        $arrivalTime = date('H:i:s', strtotime($time) + rand(7200, 10800)); // 2-3 hours later
                        $price = 3500;
                        $availableSeats = $bus['bus_number'] === 'BUS003' ? 30 : ($bus['bus_number'] === 'BUS005' ? 20 : 50);
                        $status = $statuses[array_rand($statuses)];
                        
                        // For past days, set to completed
                        if (strtotime($date) < strtotime($today)) {
                            $status = 'completed';
                        }
                        
                        $stmt->bind_param("iisssdii", 
                            $route['id'], 
                            $bus['id'], 
                            $date, 
                            $time, 
                            $arrivalTime, 
                            $price, 
                            $availableSeats,
                            $status
                        );
                        $stmt->execute();
                        $tripId++;
                    }
                }
            }
            
            echo "<p>✓ Added sample trips for the next 7 days</p>";
        }
    } else {
        echo "<p>✓ Trips already exist ($tripCount records)</p>";
    }
    
    echo "<hr><h2 style='color:green'>✅ Sample data added successfully!</h2>";
    echo "<p>You can now:</p>";
    echo "<ul>";
    echo "<li>View the Admin Dashboard - should show stats</li>";
    echo "<li>View the Driver Dashboard - should show trips</li>";
    echo "<li>Go to Trips page - assign drivers to trips</li>";
    echo "</ul>";
    
} catch (Exception $e) {
    echo "<p style='color:red'>Error: " . $e->getMessage() . "</p>";
}
