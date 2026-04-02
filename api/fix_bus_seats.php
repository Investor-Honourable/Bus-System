<?php
/**
 * Fix Bus Seat Data
 * Ensures all buses have proper seat capacity data
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require_once 'config/db.php';

try {
    // Get all buses
    $stmt = $conn->query("SELECT id, bus_number, bus_name, total_seats FROM buses ORDER BY id");
    $buses = [];
    while ($row = $stmt->fetch_assoc()) {
        $buses[] = $row;
    }
    
    $results = [];
    $fixed = 0;
    
    foreach ($buses as $bus) {
        if (empty($bus['total_seats']) || $bus['total_seats'] == 0) {
            // Default seats based on bus type
            $default_seats = 50; // default
            if (stripos($bus['bus_name'], 'minibus') !== false) {
                $default_seats = 25;
            } elseif (stripos($bus['bus_name'], 'vip') !== false) {
                $default_seats = 30;
            } elseif (stripos($bus['bus_name'], 'luxury') !== false) {
                $default_seats = 45;
            }
            
            $conn->query("UPDATE buses SET total_seats = $default_seats WHERE id = {$bus['id']}");
            $results[] = "Fixed bus {$bus['bus_number']}: set seats to $default_seats";
            $fixed++;
        } else {
            $results[] = "Bus {$bus['bus_number']}: already has {$bus['total_seats']} seats";
        }
    }
    
    // Show all buses now
    $stmt = $conn->query("SELECT id, bus_number, bus_name, total_seats, available_seats FROM buses ORDER BY id");
    $buses_updated = [];
    while ($row = $stmt->fetch_assoc()) {
        $buses_updated[] = $row;
    }
    
    echo json_encode([
        'status' => 'success',
        'message' => "Fixed $fixed buses",
        'details' => $results,
        'buses' => $buses_updated
    ]);
    
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
