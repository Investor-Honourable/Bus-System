<?php
// Assign drivers to trips that have bookings
error_reporting(0);
ini_set('display_errors', 0);

require_once("config/db.php");

header("Content-Type: text/html; charset=UTF-8");

echo "<h1>🚗 Assigning Drivers to Trips...</h1>";

// Get drivers
$drivers = $conn->query("SELECT id, user_id FROM drivers LIMIT 5");
if (!$drivers || $drivers->num_rows == 0) {
  echo "<p style='color:red'>No drivers found in database!</p>";
  exit;
}

echo "<p>Found drivers in database</p>";

// Get trips with bookings
$trips = $conn->query("SELECT DISTINCT trip_id FROM bookings");
if (!$trips || $trips->num_rows == 0) {
  echo "<p style='color:red'>No bookings found!</p>";
  exit;
}

echo "<p>Trips with bookings: " . $trips->num_rows . "</p>";

// Clear existing assignments
$conn->query("DELETE FROM driver_trip_assignments");
echo "<p>Cleared existing assignments</p>";

$assigned = 0;
while ($trip = $trips->fetch_assoc()) {
  $trip_id = $trip['trip_id'];
  
  // Get first driver
  $driver = $drivers->fetch_assoc();
  if ($driver) {
    $sql = "INSERT INTO driver_trip_assignments (driver_id, trip_id, status, assigned_at) 
            VALUES (" . intval($driver['id']) . ", " . intval($trip_id) . ", 'active', NOW())";
    if ($conn->query($sql)) {
      $assigned++;
      echo "<p>✓ Assigned driver ID " . $driver['id'] . " to trip $trip_id</p>";
    }
    
    // Reset drivers result for next iteration
    $drivers = $conn->query("SELECT id, user_id FROM drivers LIMIT 5");
  }
}

echo "<h2 style='color:green'>✅ Assigned $assigned driver-trip combinations!</h2>";
echo "<p>Drivers can now see these trips in their dashboard.</p>";

$conn->close();
