<?php
// backend/controllers/AuthController.php

require_once __DIR__ . '/../config/database.php';

class AuthController {
    
    /**
     * POST /api/register
     */
    public static function register() {
        $db = getDatabaseConnection();
        $data = json_decode(file_get_contents("php://input"), true);
        
        $business_name = isset($data['business_name']) ? htmlspecialchars(trim($data['business_name']), ENT_QUOTES, 'UTF-8') : '';
        $owner_name = isset($data['owner_name']) ? htmlspecialchars(trim($data['owner_name']), ENT_QUOTES, 'UTF-8') : '';
        $email = isset($data['email']) ? htmlspecialchars(trim($data['email']), ENT_QUOTES, 'UTF-8') : '';
        $password = isset($data['password']) ? trim($data['password']) : '';
        
        // Validation
        if (empty($business_name)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Business name is required"]);
            return;
        }
        if (strlen($business_name) < 3 || strlen($business_name) > 100) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Business name must be between 3 and 100 characters"]);
            return;
        }
        
        if (empty($owner_name)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Owner name is required"]);
            return;
        }
        if (strlen($owner_name) < 3) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Owner name must be at least 3 characters"]);
            return;
        }
        if (!preg_match('/^[a-zA-Z\s]+$/', $owner_name)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Owner name must contain only alphabets and spaces"]);
            return;
        }
        
        if (empty($email)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Please enter your email"]);
            return;
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Please enter a valid email address"]);
            return;
        }
        
        if (empty($password)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Password is required"]);
            return;
        }
        $hasUppercase = preg_match('@[A-Z]@', $password);
        $hasLowercase = preg_match('@[a-z]@', $password);
        $hasNumber    = preg_match('@[0-9]@', $password);
        $hasSpecial   = preg_match('@[^\w]@', $password);
        if (strlen($password) < 8 || !$hasUppercase || !$hasLowercase || !$hasNumber || !$hasSpecial) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Password must contain at least 8 characters, one uppercase letter, one number and one special character"]);
            return;
        }
        
        // Check if email already exists
        $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Duplicate Email"]);
            return;
        }
        
        // Hash password with Bcrypt
        $password_hash = password_hash($password, PASSWORD_BCRYPT);
        
        // Insert user and business settings
        try {
            $db->beginTransaction();
            $stmt = $db->prepare("INSERT INTO users (business_name, owner_name, email, password_hash) VALUES (?, ?, ?, ?)");
            $stmt->execute([$business_name, $owner_name, $email, $password_hash]);
            
            $userId = $db->lastInsertId();
            
            $stmtSettings = $db->prepare("INSERT INTO business_settings (user_id, business_name, owner_name) VALUES (?, ?, ?)");
            $stmtSettings->execute([$userId, $business_name, $owner_name]);
            
            $db->commit();
            
            echo json_encode([
                "success" => true,
                "message" => "Registration Successful"
            ]);
        } catch (PDOException $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Server Error: " . $e->getMessage()]);
        }
    }
    
    /**
     * POST /api/login
     */
    public static function login() {
        $db = getDatabaseConnection();
        $data = json_decode(file_get_contents("php://input"), true);
        
        $email = isset($data['email']) ? htmlspecialchars(trim($data['email']), ENT_QUOTES, 'UTF-8') : '';
        $password = isset($data['password']) ? trim($data['password']) : '';
        
        if (empty($email)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Please enter your email"]);
            return;
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Please enter a valid email address"]);
            return;
        }
        
        if (empty($password)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Please enter your password"]);
            return;
        }
        
        // Fetch user
        $stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if (!$user || !password_verify($password, $user['password_hash'])) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid email or password"]);
            return;
        }
        
        // Fetch or create business settings
        $stmtSettings = $db->prepare("SELECT * FROM business_settings WHERE user_id = ?");
        $stmtSettings->execute([$user['id']]);
        $settings = $stmtSettings->fetch();
        if (!$settings) {
            $stmtInsert = $db->prepare("INSERT INTO business_settings (user_id, business_name, owner_name) VALUES (?, ?, ?)");
            $stmtInsert->execute([$user['id'], $user['business_name'], $user['owner_name']]);
            
            $stmtSettings = $db->prepare("SELECT * FROM business_settings WHERE user_id = ?");
            $stmtSettings->execute([$user['id']]);
            $settings = $stmtSettings->fetch();
        }

        // Start session
        if (session_status() === PHP_SESSION_NONE) {
            ini_set('session.cookie_httponly', 1);
            ini_set('session.use_only_cookies', 1);
            session_start();
        }
        
        // Set session parameters
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['business_name'] = $settings['business_name'];
        $_SESSION['owner_name'] = $settings['owner_name'];
        $_SESSION['email'] = $user['email'];
        
        echo json_encode([
            "success" => true,
            "message" => "Login Successful",
            "user" => [
                "id" => $user['id'],
                "business_name" => $settings['business_name'],
                "owner_name" => $settings['owner_name'],
                "email" => $user['email'],
                "settings" => $settings
            ]
        ]);
    }
    
    /**
     * POST /api/logout
     */
    public static function logout() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        // Unset session and destroy session cookie
        $_SESSION = array();
        
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        
        session_destroy();
        
        echo json_encode([
            "success" => true,
            "message" => "Logged out successfully."
        ]);
    }
    
    /**
     * GET /api/me
     */
    public static function me() {
        if (session_status() === PHP_SESSION_NONE) {
            ini_set('session.cookie_httponly', 1);
            ini_set('session.use_only_cookies', 1);
            session_start();
        }
        
        if (isset($_SESSION['user_id'])) {
            $userId = $_SESSION['user_id'];
            $db = getDatabaseConnection();
            
            $stmt = $db->prepare("SELECT * FROM business_settings WHERE user_id = ?");
            $stmt->execute([$userId]);
            $settings = $stmt->fetch();
            
            if (!$settings) {
                // Initialize default
                $stmtInsert = $db->prepare("INSERT INTO business_settings (user_id, business_name, owner_name) VALUES (?, ?, ?)");
                $stmtInsert->execute([$userId, $_SESSION['business_name'], $_SESSION['owner_name']]);
                
                $stmt = $db->prepare("SELECT * FROM business_settings WHERE user_id = ?");
                $stmt->execute([$userId]);
                $settings = $stmt->fetch();
            }
            
            echo json_encode([
                "success" => true,
                "user" => [
                    "id" => $userId,
                    "business_name" => $settings['business_name'],
                    "owner_name" => $settings['owner_name'],
                    "email" => $_SESSION['email'],
                    "settings" => $settings
                ]
            ]);
        } else {
            echo json_encode([
                "success" => false,
                "message" => "Not authenticated."
            ]);
        }
    }
}
