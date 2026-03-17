<?php
// Driver notifications API
error_reporting(0);
ini_set('display_errors', 0);

require_once("../../config/db.php");

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(200); exit; }

$method = $_SERVER["REQUEST_METHOD"];

// Get input data
$input = json_decode(file_get_contents("php://input"), true);
$driver_id = isset($input["driver_id"]) ? intval($input["driver_id"]) : 0;

if ($method === "GET") {
  $driver_id = isset($_GET["driver_id"]) ? intval($_GET["driver_id"]) : 0;
}

if ($driver_id <= 0) {
  http_response_code(400);
  echo json_encode(["status" => "error", "message" => "Driver ID is required"]);
  exit;
}

// Verify the user is actually a driver
$verify_sql = "SELECT id, role FROM users WHERE id = ?";
$verify_stmt = $conn->prepare($verify_sql);
$verify_stmt->bind_param("i", $driver_id);
$verify_stmt->execute();
$verify_result = $verify_stmt->get_result();

if ($verify_result->num_rows === 0) {
  http_response_code(401);
  echo json_encode(["status" => "error", "message" => "User not found"]);
  exit;
}

$user = $verify_result->fetch_assoc();
if ($user['role'] !== 'driver') {
  http_response_code(403);
  echo json_encode(["status" => "error", "message" => "Access denied. Driver role required."]);
  exit;
}

// Get driver record ID
$driver_record_id = null;
$driver_sql = "SELECT id, assigned_bus_id, assigned_route_id FROM drivers WHERE user_id = ?";
$driver_stmt = $conn->prepare($driver_sql);
$driver_stmt->bind_param("i", $driver_id);
$driver_stmt->execute();
$driver_result = $driver_stmt->get_result();
$driver_info = null;
if ($driver_row = $driver_result->fetch_assoc()) {
  $driver_record_id = $driver_row['id'];
  $driver_info = $driver_row;
}

if ($method === "GET" || $method === "POST") {
  if ($driver_id <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Driver ID is required"]);
    exit;
  }

  // Check if driver_notifications table exists
  $table_exists = false;
  $check_table = $conn->query("SHOW TABLES LIKE 'driver_notifications'");
  if ($check_table && $check_table->num_rows > 0) {
    $table_exists = true;
  }

  // If table exists, get stored notifications
  $stored_notifications = [];
  if ($table_exists && $driver_record_id) {
    $notif_sql = "SELECT * FROM driver_notifications WHERE driver_id = ? ORDER BY created_at DESC LIMIT 20";
    $notif_stmt = $conn->prepare($notif_sql);
    $notif_stmt->bind_param("i", $driver_record_id);
    $notif_stmt->execute();
    $notif_result = $notif_stmt->get_result();
    while ($row = $notif_result->fetch_assoc()) {
      $stored_notifications[] = [
        "id" => $row['id'],
        "type" => $row['type'],
        "title" => $row['title'],
        "message" => $row['message'],
        "time" => timeAgo($row['created_at']),
        "read" => (bool)$row['is_read'],
        "trip_id" => $row['trip_id']
      ];
    }
  }

  // Also get trip-based notifications
  $today = date('Y-m-d');
  
  // Build trip query based on driver assignment
  $trips_sql = "";
  
  // Check if driver_trip_assignments table exists and has data
  $has_assignments = false;
  $check_table2 = $conn->query("SHOW TABLES LIKE 'driver_trip_assignments'");
  if ($check_table2 && $check_table2->num_rows > 0 && $driver_record_id) {
    $check_assignments = $conn->prepare("SELECT COUNT(*) as cnt FROM driver_trip_assignments WHERE driver_id = ?");
    $check_assignments->bind_param("i", $driver_record_id);
    $check_assignments->execute();
    $check_result = $check_assignments->get_result();
    $check_row = $check_result->fetch_assoc();
    if ($check_row['cnt'] > 0) {
      $has_assignments = true;
    }
  }
  
  if ($has_assignments && $driver_record_id) {
    $trips_sql = "SELECT t.id, t.departure_date, t.departure_time, t.status AS trip_status, r.origin, r.destination, b.bus_number
    FROM driver_trip_assignments dta
    JOIN trips t ON t.id = dta.trip_id
    JOIN routes r ON r.id = t.route_id
    JOIN buses b ON b.id = t.bus_id
    ORDER BY t.departure_date DESC, t.departure_time DESC
    LIMIT 10";
  } elseif ($driver_info && (!empty($driver_info['assigned_bus_id']) || !empty($driver_info['assigned_route_id']))) {
    if (!empty($driver_info['assigned_bus_id'])) {
      $trips_sql = "SELECT t.id, t.departure_date, t.departure_time, t.status AS trip_status, r.origin, r.destination, b.bus_number
      FROM trips t
      JOIN routes r ON r.id = t.route_id
      JOIN buses b ON b.id = t.bus_id
      WHERE t.bus_id = ?
      ORDER BY t.departure_date DESC, t.departure_time DESC
      LIMIT 10";
    } else {
      $trips_sql = "SELECT t.id, t.departure_date, t.departure_time, t.status AS trip_status, r.origin, r.destination, b.bus_number
      FROM trips t
      JOIN routes r ON r.id = t.route_id
      JOIN buses b ON b.id = t.bus_id
      WHERE t.route_id = ?
      ORDER BY t.departure_date DESC, t.departure_time DESC
      LIMIT 10";
    }
  } else {
    $trips_sql = "SELECT t.id, t.departure_date, t.departure_time, t.status AS trip_status, r.origin, r.destination, b.bus_number
    FROM trips t
    JOIN routes r ON r.id = t.route_id
    JOIN buses b ON b.id = t.bus_id
    ORDER BY t.departure_date DESC, t.departure_time DESC
    LIMIT 10";
  }
  
  // Execute trip query
  if (strpos($trips_sql, 'dta.driver_id') !== false && $driver_record_id) {
    $stmt = $conn->prepare($trips_sql);
  } elseif (strpos($trips_sql, 't.bus_id') !== false && !empty($driver_info['assigned_bus_id'])) {
    $stmt = $conn->prepare($trips_sql);
    $bus_id = $driver_info['assigned_bus_id'];
    $stmt->bind_param("i", $bus_id);
  } elseif (strpos($trips_sql, 't.route_id') !== false && !empty($driver_info['assigned_route_id'])) {
    $stmt = $conn->prepare($trips_sql);
    $route_id = $driver_info['assigned_route_id'];
    $stmt->bind_param("i", $route_id);
  } else {
    $stmt = $conn->prepare($trips_sql);
  }
  
  $stmt->execute();
  $trips_result = $stmt->get_result();
  
  $trip_notifications = [];
  while ($trip = $trips_result->fetch_assoc()) {
    // Add notification for trip
    $trip_notifications[] = [
      "id" => "trip_" . $trip['id'],
      "type" => "trip",
      "title" => "Trip #" . $trip['id'],
      "message" => "Trip from {$trip['origin']} to {$trip['destination']} on {$trip['departure_date']} at {$trip['departure_time']}",
      "time" => $trip['departure_date'],
      "read" => false,
      "trip_id" => $trip['id']
    ];
    
    // Check for bookings
    $booking_sql = "SELECT COUNT(*) as count FROM bookings WHERE trip_id = ? AND booking_status = 'confirmed'";
    $booking_stmt = $conn->prepare($booking_sql);
    $booking_stmt->bind_param("i", $trip['id']);
    $booking_stmt->execute();
    $booking_result = $booking_stmt->get_result();
    $booking = $booking_result->fetch_assoc();
    
    if ($booking['count'] > 0) {
      $trip_notifications[] = [
        "id" => "booking_" . $trip['id'],
        "type" => "passenger",
        "title" => "Passengers - Trip #" . $trip['id'],
        "message" => "{$booking['count']} passenger(s) booked for {$trip['origin']} → {$trip['destination']}",
        "time" => $trip['departure_date'],
        "read" => false,
        "trip_id" => $trip['id']
      ];
    }
  }
  
  // Merge notifications
  $notifications = array_merge($stored_notifications, $trip_notifications);
  
  // Add welcome notification if no stored notifications
  if (empty($stored_notifications)) {
    array_unshift($notifications, [
      "id" => "welcome",
      "type" => "info",
      "title" => "Welcome to Driver Dashboard",
      "message" => "Manage your trips, view passengers, and verify tickets.",
      "time" => "Just now",
      "read" => true
    ]);
  }
  
  // Sort by read status
  usort($notifications, function($a, $b) {
    if ($a['read'] === $b['read']) {
      return 0;
    }
    return $a['read'] ? 1 : -1;
  });
  
  echo json_encode(["status" => "success", "data" => $notifications]);
  exit;
}

// Handle PUT (mark as read)
if ($method === "PUT") {
  $notification_id = isset($input["notification_id"]) ? intval($input["notification_id"]) : 0;
  $action = isset($input["action"]) ? $input["action"] : "";
  
  if ($notification_id > 0 && $driver_record_id) {
    // Check if it's a stored notification or trip notification
    if (strpos($notification_id, 'trip_') === 0 || strpos($notification_id, 'booking_') === 0) {
      // Trip-based notification - store it
      $check_table = $conn->query("SHOW TABLES LIKE 'driver_notifications'");
      if ($check_table && $check_table->num_rows > 0) {
        $trip_id = intval(str_replace(['trip_', 'booking_'], '', $notification_id));
        
        // Check if already exists
        $check = $conn->prepare("SELECT id FROM driver_notifications WHERE driver_id = ? AND trip_id = ?");
        $check->bind_param("ii", $driver_record_id, $trip_id);
        $check->execute();
        $check_result = $check->get_result();
        
        if ($check_result->num_rows === 0) {
          $insert = $conn->prepare("INSERT INTO driver_notifications (driver_id, title, message, type, trip_id, is_read) VALUES (?, ?, ?, ?, ?, 1)");
          $title = "Trip #" . $trip_id;
          $message = "Notification marked as read";
          $type = "info";
          $insert->bind_param("isssi", $driver_record_id, $title, $message, $type, $trip_id);
          $insert->execute();
        }
      }
      echo json_encode(["status" => "success", "message" => "Notification marked as read"]);
    } else {
      // Direct notification update
      $update = $conn->prepare("UPDATE driver_notifications SET is_read = 1 WHERE id = ? AND driver_id = ?");
      $update->bind_param("ii", $notification_id, $driver_record_id);
      if ($update->execute()) {
        echo json_encode(["status" => "success", "message" => "Notification marked as read"]);
      } else {
        echo json_encode(["status" => "error", "message" => "Failed to update"]);
      }
    }
  }
  exit;
}

// Handle DELETE
if ($method === "DELETE") {
  $notification_id = isset($input["notification_id"]) ? intval($input["notification_id"]) : 0;
  
  if ($notification_id > 0 && $driver_record_id) {
    // Can't delete trip notifications
    if (strpos($notification_id, 'trip_') === 0 || strpos($notification_id, 'booking_') === 0) {
      echo json_encode(["status" => "error", "message" => "Cannot delete trip notifications"]);
      exit;
    }
    
    $delete = $conn->prepare("DELETE FROM driver_notifications WHERE id = ? AND driver_id = ?");
    $delete->bind_param("ii", $notification_id, $driver_record_id);
    if ($delete->execute()) {
      echo json_encode(["status" => "success", "message" => "Notification deleted"]);
    } else {
      echo json_encode(["status" => "error", "message" => "Failed to delete"]);
    }
  }
  exit;
}

function timeAgo($datetime) {
  $time = strtotime($datetime);
  $diff = time() - $time;
  
  if ($diff < 60) return "Just now";
  if ($diff < 3600) return floor($diff / 60) . " min ago";
  if ($diff < 86400) return floor($diff / 3600) . " hours ago";
  return floor($diff / 86400) . " days ago";
}

http_response_code(405);
echo json_encode(["status" => "error", "message" => "Method not allowed"]);
