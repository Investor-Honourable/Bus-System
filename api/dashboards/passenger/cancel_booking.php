<?php
require_once("../../config/db.php");

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
  http_response_code(200);
  exit;
}

// Get JSON input
$input = json_decode(file_get_contents("php://input"), true);

$trip_id   = isset($input["trip_id"]) ? intval($input["trip_id"]) : 0;
$user_id   = isset($input["user_id"]) ? intval($input["user_id"]) : 0;

if ($trip_id <= 0 || $user_id <= 0) {
  http_response_code(400);
  echo json_encode(["error" => "trip_id and user_id are required"]);
  exit;
}

// Check if user already booked this trip (active booking)
$checkSql = "SELECT id, booking_status FROM bookings WHERE user_id = ? AND trip_id = ?";
$stmt = $conn->prepare($checkSql);
$stmt->bind_param("ii", $user_id, $trip_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
  $existing = $result->fetch_assoc();
  if ($existing['booking_status'] !== 'cancelled') {
    http_response_code(409);
    echo json_encode(["error" => "You already booked this trip"]);
    exit;
  }
}

// Get trip info
$sqlTrip = "SELECT available_seats, price, departure_date, departure_time FROM trips WHERE id = ? LIMIT 1";
$stmt = $conn->prepare($sqlTrip);
$stmt->bind_param("i", $trip_id);
$stmt->execute();
$res = $stmt->get_result();
$trip = $res->fetch_assoc();

if (!$trip) {
  http_response_code(404);
  echo json_encode(["error" => "Trip not found"]);
  exit;
}

$available_seats = intval($trip["available_seats"]);
$price = $trip["price"];
$departure_date = $trip['departure_date'];

if ($available_seats <= 0) {
  http_response_code(409);
  echo json_encode(["error" => "Trip is full"]);
  exit;
}

// Find next seat number - count existing bookings for this trip
$sqlCount = "SELECT COUNT(*) as cnt FROM bookings WHERE trip_id = ? AND booking_status != 'cancelled'";
$stmt = $conn->prepare($sqlCount);
$stmt->bind_param("i", $trip_id);
$stmt->execute();
$res = $stmt->get_result();
$row = $res->fetch_assoc();
$seat_number = intval($row['cnt']) + 1;

// Generate booking reference
$booking_ref = "CT" . strtoupper(bin2hex(random_bytes(4)));

// Insert booking
$sqlIns = "INSERT INTO bookings (user_id, trip_id, booking_reference, number_of_seats, total_price, booking_status, booking_date, travel_date) VALUES (?, ?, ?, 1, ?, 'confirmed', NOW(), ?)";
$stmt = $conn->prepare($sqlIns);
$stmt->bind_param("iisis", $user_id, $trip_id, $booking_ref, $price, $departure_date);

if ($stmt->execute()) {
  $booking_id = $conn->insert_id;
  
  // Insert ticket
  $sqlTicket = "INSERT INTO tickets (booking_id, seat_number, passenger_name, ticket_status) VALUES (?, ?, '', 'valid')";
  $stmt2 = $conn->prepare($sqlTicket);
  $seat_str = (string)$seat_number;
  $stmt2->bind_param("is", $booking_id, $seat_str);
  $stmt2->execute();
  
  // Update available seats
  $sqlUpdate = "UPDATE trips SET available_seats = available_seats - 1 WHERE id = ?";
  $stmt3 = $conn->prepare($sqlUpdate);
  $stmt3->bind_param("i", $trip_id);
  $stmt3->execute();
  
  echo json_encode([
    "status" => "success",
    "data" => [
      "booking_id" => $booking_id,
      "booking_reference" => $booking_ref,
      "seat_number" => $seat_number,
      "total_price" => $price,
      "booking_status" => "confirmed"
    ]
  ]);
} else {
  http_response_code(500);
  echo json_encode(["error" => "Failed to create booking", "details" => $stmt->error]);
}
