<?php
// backend/middleware/AuthMiddleware.php

/**
 * Ensures the user is logged in. Returns the logged-in user's ID or exits with a 401.
 * @return int
 */
function requireAuth() {
    if (session_status() === PHP_SESSION_NONE) {
        // Set secure cookie policies. Note: SameSite=Lax works fine on localhost between ports.
        ini_set('session.cookie_httponly', 1);
        ini_set('session.use_only_cookies', 1);
        session_start();
    }

    if (!isset($_SESSION['user_id'])) {
        header('Content-Type: application/json');
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "Unauthorized. Session expired or not established. Please log in."
        ]);
        exit;
    }

    return (int)$_SESSION['user_id'];
}
