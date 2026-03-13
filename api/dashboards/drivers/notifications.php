<?php
// Turn off error display to return JSON instead of HTML
error_reporting(0);
ini_set('display_errors', 0);

require_once("../../config/db.php");

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(200); exit; }

$method = $_SERVER["REQUEST_METHOD"];

// Get input data
$input = json_decode(file_get_contents("php://input"), true);
$driver_id = isset($input["driver_id"]) ? intval($input["driver_id"]) : 0;

if ($method === "GET") {
  $driver_id = isset($_GET["driver_id"]) ? intval($_GET["driver_id"]) : 0;
}

if ($method === "GET" || $method === "POST") {
  if ($driver_id <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Driver ID is required"]);
    exit;
  }

  $notifications = [];
  
  // Get today's date
  $today = date('Y-m-d');
  
  // Get trips for this driver
  $trips_sql = "SELECT 
    t.id,
    t.departure_date,
    t.departure_time,
    t.status AS trip_status,
    r.origin,
    r.destination,
    b.bus_number
  FROM trips t
  JOIN routes r ON r.id = t.route_id
  JOIN buses b ON b.id = t.bus_id
  WHERE t.departure_date >= ?
  ORDER BY t.departure_date ASC, t.departure_time ASC
  LIMIT 10";
  
  $stmt = $conn->prepare($trips_sql);
  $stmt->bind_param("s", $today);
  $stmt->execute();
  $trips_result = $stmt->get_result();
  
  $trip_count = 0;
  while ($trip = $trips_result->fetch_assoc()) {
    $trip_count++;
    $dep_date = new DateTime($trip['departure_date']);
    $formatted_date = $dep_date->format('F j, Y');
    
    // Add notification for upcoming trip
    $notifications[] = [
      "id" => $trip['id'],
      "type" => "trip",
      "title" => "Upcoming Trip #" . $trip['id'],
      "message" => "Trip from {$trip['origin']} to {$trip['destination']} on {$formatted_date} at {$trip['departure_time']} - Bus: {$trip['bus_number']}",
      "time" => getRelativeTime($trip['departure_date'] . ' ' . $trip['departure_time']),
      "read" => false,
      "trip_id" => $trip['id']
    ];
    
    // Check for bookings on this trip
    $booking_sql = "SELECT COUNT(*) as count FROM bookings WHERE trip_id = ? AND booking_status = 'confirmed'";
    $booking_stmt = $conn->prepare($booking_sql);
    $booking_stmt->bind_param("i", $trip['id']);
    $booking_stmt->execute();
    $booking_result = $booking_stmt->get_result();
    $booking = $booking_result->fetch_assoc();
    
    if ($booking['count'] > 0) {
      $notifications[] = [
        "id" => $trip['id'] . '_bookings',
        "type" => "passenger",
        "title" => "Passenger Update - Trip #" . $trip['id'],
        "message" => "{$booking['count']} passenger(s) booked for {$trip['origin']} → {$trip['destination']}",
        "time" => getRelativeTime($trip['departure_date'] . ' ' . $trip['departure_time']),
        "read" => false,
        "trip_id" => $trip['id']
      ];
    }
  }
  
  // If no trips, add a welcome notification
  if ($trip_count === 0) {
    $notifications[] = [
      "id" => 1,
      "type" => "info",
      "title" => "No Upcoming Trips",
      "message" => "You have no trips scheduled. Check back later or contact your administrator.",
      "time" => "Just now",
      "read" => false
    ];
  }
  
  // Add welcome notification
  $notifications[] = [
    "id" => 0,
    "type" => "info",
    "title" => "Welcome to Driver Dashboard",
    "message" => "Manage your trips, view passengers, and verify tickets all in one place.",
    "time" => "1 day ago",
    "read" => true
  ];
  
  // Sort by read status (unread first) and time
  usort($notifications, function($a, $b) {
    if ($a['read'] === $b['read']) {
      return 0;
    }
    return $a['read'] ? 1 : -1;
  });
  
  echo json_encode(["status" => "success", "data" => $notifications]);
  exit;
}

function getRelativeTime($datetime) {
  $time = strtotime($datetime);
  $diff = $time - time();
  
  if ($diff < 0) {
    return "Past";
  }
  
  if ($diff < 3600) {
    $mins = floor($diff / 60);
    return $mins . " minute" . ($mins > 1 ? "s" : "") . " from now";
  }
  
  if ($diff < 86400) {
    $hours = floor($diff / 3600);
    return $hours . " hour" . ($hours > 1 ? "s" : "") . " from now";
  }
  
  $days = floor($diff / 86400);
  return $days . " day" . ($days > 1 ? "s" : "") . " from now";
}

http_response_code(405);
echo json_encode(["status" => "error", "message" => "Method not allowed"]);
