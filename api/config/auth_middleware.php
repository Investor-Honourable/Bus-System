<?php
/**
 * Authentication Middleware
 * Handles session-based authentication
 */

session_start();

/**
 * Check if user is logged in
 * @return bool
 */
function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

/**
 * Get current user ID
 * @return int|null
 */
function getCurrentUserId() {
    return $_SESSION['user_id'] ?? null;
}

/**
 * Get current user role
 * @return string|null
 */
function getCurrentUserRole() {
    return $_SESSION['user_role'] ?? null;
}

/**
 * Get current user name
 * @return string|null
 */
function getCurrentUserName() {
    return $_SESSION['user_name'] ?? null;
}

/**
 * Get current user email
 * @return string|null
 */
function getCurrentUserEmail() {
    return $_SESSION['user_email'] ?? null;
}

/**
 * Require authentication
 * Redirects to login if not authenticated
 */
function requireAuth() {
    if (!isLoggedIn()) {
        http_response_code(401);
        echo json_encode([
            'status' => 'error',
            'message' => 'Authentication required'
        ]);
        exit;
    }
}

/**
 * Require specific role
 * @param string|array $roles Required role(s)
 */
function requireRole($roles) {
    requireAuth();
    
    $user_role = getCurrentUserRole();
    
    if (is_array($roles)) {
        if (!in_array($user_role, $roles)) {
            http_response_code(403);
            echo json_encode([
                'status' => 'error',
                'message' => 'Insufficient permissions'
            ]);
            exit;
        }
    } else {
        if ($user_role !== $roles) {
            http_response_code(403);
            echo json_encode([
                'status' => 'error',
                'message' => 'Insufficient permissions'
            ]);
            exit;
        }
    }
}

/**
 * Require admin role
 */
function requireAdmin() {
    requireRole('admin');
}

/**
 * Require driver role
 */
function requireDriver() {
    requireRole('driver');
}

/**
 * Require passenger role
 */
function requirePassenger() {
    requireRole('passenger');
}

/**
 * Get user from request
 * @return array|null
 */
function getUserFromRequest() {
    $user_id = $_SERVER['HTTP_USER_ID'] ?? $_GET['user_id'] ?? null;
    
    if (!$user_id) {
        return null;
    }
    
    return [
        'id' => $user_id,
        'role' => getCurrentUserRole(),
        'name' => getCurrentUserName(),
        'email' => getCurrentUserEmail()
    ];
}

/**
 * Validate user access
 * @param int $user_id User ID to check
 * @return bool
 */
function validateUserAccess($user_id) {
    $current_user_id = getCurrentUserId();
    $current_user_role = getCurrentUserRole();
    
    // Admin can access any user
    if ($current_user_role === 'admin') {
        return true;
    }
    
    // Users can only access their own data
    return $current_user_id == $user_id;
}
