<?php
/**
 * Server-side Authentication Middleware
 * This file should be included at the beginning of all protected API endpoints.
 * It verifies that the user is logged in and has the appropriate role.
 */

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Check if user is authenticated
 * Returns user data if authenticated, false otherwise
 */
function requireAuth() {
    global $conn;
    
    // Check if user_id is in session
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode([
            'status' => 'error',
            'message' => 'Authentication required. Please log in.'
        ]);
        exit;
    }
    
    // Verify user still exists and is active
    $user_id = $_SESSION['user_id'];
    $stmt = $conn->prepare("SELECT id, name, email, role, status FROM users WHERE id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        http_response_code(401);
        echo json_encode([
            'status' => 'error',
            'message' => 'User not found. Please log in again.'
        ]);
        exit;
    }
    
    $user = $result->fetch_assoc();
    $stmt->close();
    
    // Check if user is active
    if (isset($user['status']) && $user['status'] === 'inactive') {
        http_response_code(403);
        echo json_encode([
            'status' => 'error',
            'message' => 'Account is inactive. Contact administrator.'
        ]);
        exit;
    }
    
    return $user;
}

/**
 * Check if user has specific role
 * @param string|array $roles - Single role or array of roles allowed
 */
function requireRole($roles) {
    $user = requireAuth();
    
    if (!is_array($roles)) {
        $roles = [$roles];
    }
    
    if (!in_array($user['role'], $roles)) {
        http_response_code(403);
        echo json_encode([
            'status' => 'error',
            'message' => 'Access denied. Insufficient permissions.'
        ]);
        exit;
    }
    
    return $user;
}

/**
 * Require admin role (admin or super_admin)
 */
function requireAdmin() {
    return requireRole(['admin', 'super_admin']);
}

/**
 * Require driver role
 */
function requireDriver() {
    return requireRole(['driver']);
}

/**
 * Get current authenticated user (returns null if not authenticated)
 */
function getCurrentUser() {
    if (!isset($_SESSION['user_id'])) {
        return null;
    }
    
    global $conn;
    $user_id = $_SESSION['user_id'];
    $stmt = $conn->prepare("SELECT id, name, email, role, phone FROM users WHERE id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    $stmt->close();
    
    return $user;
}

/**
 * Log out current user
 */
function logout() {
    // Unset all session variables
    $_SESSION = [];
    
    // Destroy the session
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    
    session_destroy();
}
