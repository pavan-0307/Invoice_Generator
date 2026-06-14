<?php
// backend/controllers/SettingsController.php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class SettingsController {
    
    /**
     * GET /api/settings
     */
    public static function get() {
        $userId = requireAuth();
        $db = getDatabaseConnection();
        
        $stmt = $db->prepare("SELECT * FROM business_settings WHERE user_id = ?");
        $stmt->execute([$userId]);
        $settings = $stmt->fetch();
        
        if (!$settings) {
            // Get defaults from users table
            $stmtUser = $db->prepare("SELECT business_name, owner_name, email FROM users WHERE id = ?");
            $stmtUser->execute([$userId]);
            $user = $stmtUser->fetch();
            
            if ($user) {
                // Initialize default settings row
                $stmtInsert = $db->prepare("INSERT INTO business_settings (user_id, business_name, owner_name) VALUES (?, ?, ?)");
                $stmtInsert->execute([$userId, $user['business_name'], $user['owner_name']]);
                
                // Fetch again
                $stmt = $db->prepare("SELECT * FROM business_settings WHERE user_id = ?");
                $stmt->execute([$userId]);
                $settings = $stmt->fetch();
            } else {
                http_response_code(404);
                echo json_encode(["success" => false, "message" => "User profile not found."]);
                return;
            }
        }
        
        // Fetch user email
        $stmtEmail = $db->prepare("SELECT email FROM users WHERE id = ?");
        $stmtEmail->execute([$userId]);
        $userObj = $stmtEmail->fetch();
        $settings['email'] = $userObj ? $userObj['email'] : '';
        
        echo json_encode(["success" => true, "settings" => $settings]);
    }
    
    /**
     * PUT /api/settings
     */
    public static function update() {
        $userId = requireAuth();
        $db = getDatabaseConnection();
        
        $data = json_decode(file_get_contents("php://input"), true);
        
        $business_name = isset($data['business_name']) ? htmlspecialchars(trim($data['business_name']), ENT_QUOTES, 'UTF-8') : '';
        $owner_name = isset($data['owner_name']) ? htmlspecialchars(trim($data['owner_name']), ENT_QUOTES, 'UTF-8') : '';
        $email = isset($data['email']) ? htmlspecialchars(trim($data['email']), ENT_QUOTES, 'UTF-8') : '';
        $phone = isset($data['phone']) ? htmlspecialchars(trim($data['phone']), ENT_QUOTES, 'UTF-8') : '';
        $gst_number = isset($data['gst_number']) ? htmlspecialchars(trim($data['gst_number']), ENT_QUOTES, 'UTF-8') : NULL;
        $address = isset($data['address']) ? htmlspecialchars(trim($data['address']), ENT_QUOTES, 'UTF-8') : '';
        $city = isset($data['city']) ? htmlspecialchars(trim($data['city']), ENT_QUOTES, 'UTF-8') : '';
        $state = isset($data['state']) ? htmlspecialchars(trim($data['state']), ENT_QUOTES, 'UTF-8') : '';
        $country = isset($data['country']) ? htmlspecialchars(trim($data['country']), ENT_QUOTES, 'UTF-8') : '';
        $postal_code = isset($data['postal_code']) ? htmlspecialchars(trim($data['postal_code']), ENT_QUOTES, 'UTF-8') : '';
        
        $default_tax_rate = isset($data['default_tax_rate']) ? (float)$data['default_tax_rate'] : 0.00;
        $default_currency = isset($data['default_currency']) ? htmlspecialchars(trim($data['default_currency']), ENT_QUOTES, 'UTF-8') : 'INR';
        $invoice_prefix = isset($data['invoice_prefix']) ? htmlspecialchars(trim($data['invoice_prefix']), ENT_QUOTES, 'UTF-8') : 'INV';
        $payment_terms = isset($data['payment_terms']) ? htmlspecialchars(trim($data['payment_terms']), ENT_QUOTES, 'UTF-8') : '30 Days';
        $stmtTheme = $db->prepare("SELECT theme FROM business_settings WHERE user_id = ?");
        $stmtTheme->execute([$userId]);
        $existingTheme = $stmtTheme->fetchColumn();
        $theme = isset($data['theme']) ? htmlspecialchars(trim($data['theme']), ENT_QUOTES, 'UTF-8') : ($existingTheme ?: 'Light');
        
        $payment_notifications = isset($data['payment_notifications']) ? (int)$data['payment_notifications'] : 1;
        $invoice_notifications = isset($data['invoice_notifications']) ? (int)$data['invoice_notifications'] : 1;
        $client_notifications = isset($data['client_notifications']) ? (int)$data['client_notifications'] : 1;
        $email_notifications = isset($data['email_notifications']) ? (int)$data['email_notifications'] : 0;
        
        // Required validation
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
            echo json_encode(["success" => false, "message" => "Business email is required"]);
            return;
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Please enter a valid email address"]);
            return;
        }
        
        if (empty($phone)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Phone number is required"]);
            return;
        }
        if (!preg_match('/^[6-9]\d{9}$/', $phone)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Phone number must be a valid 10-digit Indian mobile number."]);
            return;
        }
        
        if (empty($address)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Business address is required"]);
            return;
        }
        if (empty($city)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "City is required"]);
            return;
        }
        if (empty($state)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "State is required"]);
            return;
        }
        if (empty($country)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Country is required"]);
            return;
        }
        if (empty($postal_code)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Postal code is required"]);
            return;
        }
        
        if ($default_tax_rate < 0 || $default_tax_rate > 100) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Default tax rate must be between 0 and 100"]);
            return;
        }
        if (!in_array($default_currency, ['INR', 'USD', 'EUR', 'GBP'])) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid currency selected."]);
            return;
        }
        if (empty($invoice_prefix) || strlen($invoice_prefix) > 20) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invoice prefix is required and must not exceed 20 characters."]);
            return;
        }
        if (!in_array($payment_terms, ['7 Days', '15 Days', '30 Days'])) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid payment terms."]);
            return;
        }
        if (!in_array($theme, ['Light', 'Dark', 'System'])) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid theme selected."]);
            return;
        }
        
        // Check email uniqueness across user records
        $stmt = $db->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
        $stmt->execute([$email, $userId]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Duplicate Email"]);
            return;
        }
        
        try {
            $db->beginTransaction();
            
            // 1. Update users table (business_name, owner_name, email)
            $stmtUser = $db->prepare("UPDATE users SET business_name = ?, owner_name = ?, email = ? WHERE id = ?");
            $stmtUser->execute([$business_name, $owner_name, $email, $userId]);
            
            // 2. Update business_settings table
            $stmtSettings = $db->prepare("
                UPDATE business_settings 
                SET business_name = ?, owner_name = ?, phone = ?, gst_number = ?, address = ?, city = ?, state = ?, country = ?, postal_code = ?,
                    default_tax_rate = ?, default_currency = ?, invoice_prefix = ?, payment_terms = ?, theme = ?,
                    payment_notifications = ?, invoice_notifications = ?, client_notifications = ?, email_notifications = ?
                WHERE user_id = ?
            ");
            $stmtSettings->execute([
                $business_name, $owner_name, $phone, $gst_number, $address, $city, $state, $country, $postal_code,
                $default_tax_rate, $default_currency, $invoice_prefix, $payment_terms, $theme,
                $payment_notifications, $invoice_notifications, $client_notifications, $email_notifications,
                $userId
            ]);
            
            $db->commit();
            
            // Update session vars if session exists
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            $_SESSION['business_name'] = $business_name;
            $_SESSION['owner_name'] = $owner_name;
            $_SESSION['email'] = $email;
            
            echo json_encode(["success" => true, "message" => "Profile Updated Successfully"]);
        } catch (PDOException $e) {
            $db->rollBack();
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Database error during settings update: " . $e->getMessage()]);
        }
    }
    
    /**
     * POST /api/settings/logo
     */
    public static function uploadLogo() {
        $userId = requireAuth();
        $db = getDatabaseConnection();
        
        if (!isset($_FILES['logo'])) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "No logo file was uploaded."]);
            return;
        }
        
        $file = $_FILES['logo'];
        
        // File size check: 2MB limit
        if ($file['size'] > 2 * 1024 * 1024) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Logo file size must be less than 2MB."]);
            return;
        }
        
        // Format check: JPG, PNG, JPEG
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowed = ['jpg', 'jpeg', 'png'];
        if (!in_array($ext, $allowed)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid format. Only JPG, PNG, and JPEG are supported."]);
            return;
        }
        
        // Verify mime type is image
        $mime = mime_content_type($file['tmp_name']);
        if (strpos($mime, 'image/') !== 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "File is not a valid image."]);
            return;
        }
        
        // Ensure uploads directory exists
        $uploadDir = __DIR__ . '/../uploads/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        // Unique filename
        $fileName = 'logo_' . $userId . '_' . time() . '.' . $ext;
        $destPath = $uploadDir . $fileName;
        
        if (move_uploaded_file($file['tmp_name'], $destPath)) {
            $dbPath = 'uploads/' . $fileName;
            
            // Delete old logo if exists
            $stmtSelect = $db->prepare("SELECT logo_path FROM business_settings WHERE user_id = ?");
            $stmtSelect->execute([$userId]);
            $oldPath = $stmtSelect->fetchColumn();
            if ($oldPath && file_exists(__DIR__ . '/../' . $oldPath)) {
                @unlink(__DIR__ . '/../' . $oldPath);
            }
            
            // Update db
            $stmtUpdate = $db->prepare("UPDATE business_settings SET logo_path = ? WHERE user_id = ?");
            $stmtUpdate->execute([$dbPath, $userId]);
            
            echo json_encode([
                "success" => true,
                "message" => "Logo Uploaded Successfully",
                "logo_path" => $dbPath
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Failed to save logo file to destination."]);
        }
    }
    
    /**
     * PUT /api/settings/password
     */
    public static function changePassword() {
        $userId = requireAuth();
        $db = getDatabaseConnection();
        
        $data = json_decode(file_get_contents("php://input"), true);
        
        $current_password = isset($data['current_password']) ? trim($data['current_password']) : '';
        $new_password = isset($data['new_password']) ? trim($data['new_password']) : '';
        $confirm_password = isset($data['confirm_password']) ? trim($data['confirm_password']) : '';
        
        if (empty($current_password)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Current password is required"]);
            return;
        }
        if (empty($new_password)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "New password is required"]);
            return;
        }
        if ($new_password !== $confirm_password) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "New password and confirmation do not match."]);
            return;
        }
        
        // Strength check
        $hasUppercase = preg_match('@[A-Z]@', $new_password);
        $hasLowercase = preg_match('@[a-z]@', $new_password);
        $hasNumber    = preg_match('@[0-9]@', $new_password);
        $hasSpecial   = preg_match('@[^\w]@', $new_password);
        if (strlen($new_password) < 8 || !$hasUppercase || !$hasLowercase || !$hasNumber || !$hasSpecial) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Password must contain at least 8 characters, one uppercase letter, one number and one special character"]);
            return;
        }
        
        // Fetch current password hash
        $stmt = $db->prepare("SELECT password_hash FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        
        if (!$user || !password_verify($current_password, $user['password_hash'])) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Current password is incorrect."]);
            return;
        }
        
        // Hash and update
        $new_hash = password_hash($new_password, PASSWORD_BCRYPT);
        $stmtUpdate = $db->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
        $stmtUpdate->execute([$new_hash, $userId]);
        
        echo json_encode(["success" => true, "message" => "Password Changed Successfully"]);
    }
    
    /**
     * PUT /api/settings/theme
     */
    public static function updateTheme() {
        $userId = requireAuth();
        $db = getDatabaseConnection();
        $data = json_decode(file_get_contents("php://input"), true);
        
        $theme = isset($data['theme']) ? htmlspecialchars(trim($data['theme']), ENT_QUOTES, 'UTF-8') : '';
        if (!in_array($theme, ['Light', 'Dark', 'System'])) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid theme selected."]);
            return;
        }
        
        $stmt = $db->prepare("UPDATE business_settings SET theme = ? WHERE user_id = ?");
        $stmt->execute([$theme, $userId]);
        
        echo json_encode(["success" => true, "message" => "Theme Updated Successfully"]);
    }
}
