<?php
// Turn off error display to return JSON instead of HTML on errors
error_reporting(0);
ini_set('display_errors', 0);

require_once("../../config/db.php");

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(200); exit; }

$method = $_SERVER["REQUEST_METHOD"];

/**
 * GET -> list all bookings with optional filters
 * POST -> update booking status
 * 
 * Filters (all optional via GET):
 * - status=pending|confirmed|cancelled|completed
 * - trip_id=3
 * - date=YYYY-MM-DD
 */

if ($method === "GET") {
  $status = strtolower(trim($_GET["status"] ?? ""));
  $trip_id = intval($_GET["trip_id"] ?? 0);
  $date = trim($_GET["date"] ?? "");

  $sql = "
  SELECT
    b.id AS booking_id,
    b.booking_reference,
    b.number_of_seats,
    b.total_price,
    b.booking_status,
    b.booking_date,
    b.travel_date,

    t.id AS trip_id,
    t.departure_date,
    t.departure_time,
    t.arrival_time,
    t.price AS trip_price,
    t.available_seats,

    r.origin,
    r.destination,
    r.route_code,
    r.distance_km,

    bs.id AS bus_id,
    bs.bus_number,
    bs.bus_name,
    bs.bus_type,

    u.id AS user_id,
    u.name AS passenger_name,
    u.email AS passenger_email,
    u.phone AS passenger_phone
  FROM bookings b
  JOIN trips t ON t.id = b.trip_id
  JOIN routes r ON r.id = t.route_id
  JOIN buses bs ON bs.id = t.bus_id
  JOIN users u ON u.id = b.user_id
  WHERE 1=1
  ";

  $params = [];
  $types = "";

  if ($status !== "") {
    $sql .= " AND b.booking_status = ?";
    $params[] = $status;
    $types .= "s";
  }

  if ($trip_id > 0) {
    $sql .= " AND t.id = ?";
    $params[] = $trip_id;
    $types .= "i";
  }

  if ($date !== "") {
    $sql .= " AND t.departure_date = ?";
    $params[] = $date;
    $types .= "s";
  }

  $sql .= " ORDER BY b.booking_date DESC";

  $stmt = $conn->prepare($sql);
  
  if (!empty($params)) {
    $stmt->bind_param($types, ...$params);
  }
  
  $stmt->execute();
  $result = $stmt->get_result();
  
  $bookings = [];
  while ($row = $result->fetch_assoc()) {
    // Get tickets for this booking
    $ticket_stmt = $conn->prepare("SELECT seat_number, passenger_name, ticket_status FROM tickets WHERE booking_id = ?");
    $ticket_stmt->bind_param("i", $row['booking_id']);
    $ticket_stmt->execute();
    $ticket_result = $ticket_stmt->get_result();
    
    $tickets = [];
    while ($ticket_row = $ticket_result->fetch_assoc()) {
      $tickets[] = $ticket_row;
    }
    $row['tickets'] = $tickets;
    $ticket_stmt->close();
    
    $bookings[] = $row;
  }
  
  // Return in same format as other admin APIs for consistency
  echo json_encode(["data" => $bookings]);
  exit;
}

// POST - Update booking status
if ($method === "POST") {
  $input = json_decode(file_get_contents("php://input"), true);
  $action = $input['action'] ?? '';
  
  if ($action === 'update_status') {
    $booking_id = intval($input['booking_id'] ?? 0);
    $new_status = strtolower($input['status'] ?? '');
    
    $allowed_statuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    
    if (!$booking_id || !in_array($new_status, $allowed_statuses)) {
      echo json_encode(["success" => false, "message" => "Invalid booking ID or status"]);
      exit;
    }
    
    $stmt = $conn->prepare("UPDATE bookings SET booking_status = ? WHERE id = ?");
    $stmt->bind_param("si", $new_status, $booking_id);
    
    if ($stmt->execute()) {
      echo json_encode(["success" => true, "message" => "Booking status updated"]);
    } else {
      echo json_encode(["success" => false, "message" => "Failed to update status"]);
    }
    exit;
  }
  
  if ($action === 'cancel_booking') {
    $booking_id = intval($input['booking_id'] ?? 0);
    
    if (!$booking_id) {
      echo json_encode(["success" => false, "message" => "Invalid booking ID"]);
      exit;
    }
    
    // Get booking details to restore seats
    $stmt = $conn->prepare("SELECT trip_id, number_of_seats FROM bookings WHERE id = ?");
    $stmt->bind_param("i", $booking_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $booking = $result->fetch_assoc();
    
    if ($booking) {
      // Update booking status
      $update_stmt = $conn->prepare("UPDATE bookings SET booking_status = 'cancelled' WHERE id = ?");
      $update_stmt->bind_param("i", $booking_id);
      $update_stmt->execute();
      
      // Restore available seats
      $trip_id = $booking['trip_id'];
      $seats = $booking['number_of_seats'];
      $seats_stmt = $conn->prepare("UPDATE trips SET available_seats = available_seats + ? WHERE id = ?");
      $seats_stmt->bind_param("ii", $seats, $trip_id);
      $seats_stmt->execute();
      
      // Cancel tickets
      $ticket_stmt = $conn->prepare("UPDATE tickets SET ticket_status = 'cancelled' WHERE booking_id = ?");
      $ticket_stmt->bind_param("i", $booking_id);
      $ticket_stmt->execute();
      
      echo json_encode(["success" => true, "message" => "Booking cancelled and seats restored"]);
    } else {
      echo json_encode(["success" => false, "message" => "Booking not found"]);
    }
    exit;
  }
  
  // Assign seats to booking
  if ($action === 'assign_seats') {
    $booking_id = intval($input['booking_id'] ?? 0);
    $seat_numbers = trim($input['seat_numbers'] ?? '');
    
    if (!$booking_id) {
      echo json_encode(["success" => false, "message" => "Invalid booking ID"]);
      exit;
    }
    
    if ($seat_numbers === '') {
      echo json_encode(["success" => false, "message" => "Seat numbers required"]);
      exit;
    }
    
    // Get booking details
    $stmt = $conn->prepare("SELECT user_id, trip_id, number_of_seats FROM bookings WHERE id = ?");
    $stmt->bind_param("i", $booking_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $booking = $result->fetch_assoc();
    
    if ($booking) {
      // Parse seat numbers
      $seats = array_map('trim', explode(',', $seat_numbers));
      
      // Get user info for passenger name
      $userStmt = $conn->prepare("SELECT name, username FROM users WHERE id = ?");
      $userStmt->bind_param("i", $booking['user_id']);
      $userStmt->execute();
      $userResult = $userStmt->get_result();
      $user = $userResult->fetch_assoc();
      $passengerName = $user['name'] ?? $user['username'] ?? 'Passenger';
      
      // Delete existing tickets for this booking
      $deleteTickets = $conn->prepare("DELETE FROM tickets WHERE booking_id = ?");
      $deleteTickets->bind_param("i", $booking_id);
      $deleteTickets->execute();
      
      // Insert new tickets for each seat
      $insertTicket = $conn->prepare("INSERT INTO tickets (booking_id, trip_id, seat_number, passenger_name, ticket_status) VALUES (?, ?, ?, ?, 'confirmed')");
      
      foreach ($seats as $seatNum) {
        if (!empty($seatNum)) {
          $insertTicket->bind_param("iiss", $booking_id, $booking['trip_id'], $seatNum, $passengerName);
          $insertTicket->execute();
        }
      }
      
      // Update booking with seat numbers
      $updateBooking = $conn->prepare("UPDATE bookings SET seat_numbers = ? WHERE id = ?");
      $updateBooking->bind_param("si", $seat_numbers, $booking_id);
      $updateBooking->execute();
      
      echo json_encode(["success" => true, "message" => "Seats assigned successfully", "seat_numbers" => $seat_numbers]);
    } else {
      echo json_encode(["success" => false, "message" => "Booking not found"]);
    }
    exit;
  }
  
  echo json_encode(["success" => false, "message" => "Unknown action"]);
  exit;
}

echo json_encode(["success" => false, "message" => "Method not allowed"]);
