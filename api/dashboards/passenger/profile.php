<?php
require '../config/db.php';
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(200); exit; }

$method = $_SERVER['REQUEST_METHOD'];

// Assume we send ?user_id=ID for simplicity
$user_id = $_GET['user_id'] ?? null;

if(!$user_id){
    echo json_encode(['status'=>'error','message'=>'User ID required']);
    exit;
}

if($method === "GET"){
    $stmt = $conn->prepare("SELECT id, name, username, email, phone, gender, role FROM users WHERE id = ?");
    $stmt->bind_param("i",$user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    if($user){
        echo json_encode(['status'=>'success','user'=>$user]);
    } else {
        echo json_encode(['status'=>'error','message'=>'User not found']);
    }

    $stmt->close();

} elseif($method === "POST" || $method === "PUT"){
    // Update user info
    $data = json_decode(file_get_contents("php://input"), true);

    $name = $data['name'] ?? null;
    $phone = $data['phone'] ?? null;
    $password = $data['password'] ?? null;

    if(!$name && !$phone && !$password){
        echo json_encode(['status'=>'error','message'=>'Nothing to update']);
        exit;
    }

    $fields = [];
    $types = "";
    $values = [];

    if($name){
        $fields[] = "name=?";
        $types .= "s";
        $values[] = $name;
    }
    if($phone){
        $fields[] = "phone=?";
        $types .= "s";
        $values[] = $phone;
    }
    if($password){
        $fields[] = "password=?";
        $types .= "s";
        $values[] = password_hash($password, PASSWORD_DEFAULT);
    }

    $values[] = $user_id; // for WHERE
    $types .= "i";

    $sql = "UPDATE users SET ".implode(", ", $fields)." WHERE id=?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$values);

    if($stmt->execute()){
        echo json_encode(['status'=>'success','message'=>'Profile updated']);
    } else {
        echo json_encode(['status'=>'error','message'=>$stmt->error]);
    }

    $stmt->close();
}

$conn->close();
?>
