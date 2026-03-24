<?php
// Turn off error display to return JSON instead of HTML on errors
error_reporting(0);
ini_set('display_errors', 0);

require_once("../../config/db.php");

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(200); exit; }

$method = $_SERVER["REQUEST_METHOD"];

/**
 * GET  -> list users
 * POST -> update user role and ensure profile exists (drivers/passengers)
 * DELETE -> delete user
 */

if ($method === "GET") {
  $sql = "SELECT id, name, username, email, role, phone, gender, status, created_at FROM users ORDER BY id DESC";
  $res = $conn->query($sql);

  if (!$res) {
    http_response_code(500);
    echo json_encode(["error" => "Query failed", "details" => $conn->error]);
    exit;
  }

  $data = [];
  while ($row = $res->fetch_assoc()) {
    // Default status to 'active' if not set
    if (!isset($row['status']) || $row['status'] === null || $row['status'] === '') {
      $row['status'] = 'active';
    }
    $data[] = $row;
  }

  echo json_encode(["data" => $data]);
  exit;
}

if ($method === "POST") {
  $input = json_decode(file_get_contents("php://input"), true);

  $user_id = intval($input["user_id"] ?? 0);
  $role    = strtolower(trim($input["role"] ?? ""));
  $phone   = trim($input["phone"] ?? "");
  $status  = strtolower(trim($input["status"] ?? "active"));
  $username = trim($input["username"] ?? "");

  $allowed_roles = ["passenger","driver","admin"];
  $allowed_status = ["active","blocked"];

  // If updating role
  if ($role !== "" && in_array($role, $allowed_roles, true)) {
    if ($user_id <= 0) {
      http_response_code(400);
      echo json_encode(["error" => "user_id is required for role update"]);
      exit;
    }

    $stmt = $conn->prepare("UPDATE users SET role = ? WHERE id = ?");
    if (!$stmt) {
      http_response_code(500);
      echo json_encode(["error" => "Prepare failed", "details" => $conn->error]);
      exit;
    }
    $stmt->bind_param("si", $role, $user_id);
    $stmt->execute();

    // Ensure profile exists based on role
    if ($role === "driver") {
      $check = $conn->prepare("SELECT id FROM drivers WHERE user_id = ? LIMIT 1");
      $check->bind_param("i", $user_id);
      $check->execute();
      $exists = $check->get_result()->fetch_assoc();

      if (!$exists) {
        $u = $conn->prepare("SELECT username, email FROM users WHERE id = ? LIMIT 1");
        $u->bind_param("i", $user_id);
        $u->execute();
        $user = $u->get_result()->fetch_assoc();

        $name = $user["username"] ?? "Driver";
        $email = $user["email"] ?? "";

        $ins = $conn->prepare("INSERT INTO drivers (user_id, name, email) VALUES (?, ?, ?)");
        $ins->bind_param("iss", $user_id, $name, $email);
        $ins->execute();
      }
    }

    if ($role === "passenger") {
      $check = $conn->prepare("SELECT user_id FROM passengers WHERE user_id = ? LIMIT 1");
      $check->bind_param("i", $user_id);
      $check->execute();
      $exists = $check->get_result()->fetch_assoc();

      if (!$exists) {
        $u = $conn->prepare("SELECT username, email FROM users WHERE id = ? LIMIT 1");
        $u->bind_param("i", $user_id);
        $u->execute();
        $user = $u->get_result()->fetch_assoc();

        $name = $user["username"] ?? "Passenger";
        $email = $user["email"] ?? "";

        $ins = $conn->prepare("INSERT INTO passengers (user_id, name, email) VALUES (?, ?, ?)");
        $ins->bind_param("iss", $user_id, $name, $email);
        $ins->execute();
      }
    }

    echo json_encode(["message" => "User role updated", "data" => ["user_id" => $user_id, "role" => $role]]);
    exit;
  }

  // If updating status
  if ($status !== "" && in_array($status, $allowed_status, true)) {
    if ($user_id <= 0) {
      http_response_code(400);
      echo json_encode(["error" => "user_id is required for status update"]);
      exit;
    }

    $stmt = $conn->prepare("UPDATE users SET status = ? WHERE id = ?");
    if (!$stmt) {
      http_response_code(500);
      echo json_encode(["error" => "Prepare failed", "details" => $conn->error]);
      exit;
    }
    $stmt->bind_param("si", $status, $user_id);
    $stmt->execute();

    echo json_encode(["message" => "User status updated", "data" => ["user_id" => $user_id, "status" => $status]]);
    exit;
  }

  // If updating phone or username
  if ($user_id > 0) {
    $updates = [];
    $params = [];
    $types = "";

    if ($username !== "") {
      $updates[] = "username = ?";
      $params[] = $username;
      $types .= "s";
    }
    if ($phone !== "") {
      $updates[] = "phone = ?";
      $params[] = $phone;
      $types .= "s";
    }

    if (count($updates) > 0) {
      $params[] = $user_id;
      $types .= "i";
      $sql = "UPDATE users SET " . implode(", ", $updates) . " WHERE id = ?";
      $stmt = $conn->prepare($sql);
      $stmt->bind_param($types, ...$params);
      $stmt->execute();
    }

    echo json_encode(["message" => "User updated", "data" => ["user_id" => $user_id]]);
    exit;
  }

  http_response_code(400);
  echo json_encode(["error" => "Invalid request"]);
  exit;
}

// DELETE user
if ($method === "DELETE") {
  $input = json_decode(file_get_contents("php://input"), true);
  $user_id = intval($input["user_id"] ?? 0);

  if ($user_id <= 0) {
    http_response_code(400);
    echo json_encode(["error" => "user_id is required"]);
    exit;
  }

  $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
  if (!$stmt) {
    http_response_code(500);
    echo json_encode(["error" => "Prepare failed", "details" => $conn->error]);
    exit;
  }
  $stmt->bind_param("i", $user_id);
  
  if ($stmt->execute()) {
    echo json_encode(["message" => "User deleted", "success" => true]);
  } else {
    http_response_code(500);
    echo json_encode(["error" => "Delete failed", "details" => $stmt->error]);
  }
  exit;
}

http_response_code(405);
echo json_encode(["error" => "Method not allowed"]);
