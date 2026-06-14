<?php
// backend/controllers/ClientController.php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class ClientController {
    
    /**
     * GET /api/clients
     */
    public static function index() {
        $userId = requireAuth();
        $db = getDatabaseConnection();
        
        $search = isset($_GET['search']) ? htmlspecialchars(trim($_GET['search']), ENT_QUOTES, 'UTF-8') : '';
        
        if (!empty($search)) {
            $query = "SELECT * FROM clients 
                      WHERE user_id = :user_id 
                      AND (client_name LIKE :search 
                           OR email LIKE :search 
                           OR phone LIKE :search) 
                      ORDER BY client_name ASC";
            $stmt = $db->prepare($query);
            $stmt->execute([
                'user_id' => $userId,
                'search' => '%' . $search . '%'
            ]);
        } else {
            $query = "SELECT * FROM clients WHERE user_id = :user_id ORDER BY client_name ASC";
            $stmt = $db->prepare($query);
            $stmt->execute(['user_id' => $userId]);
        }
        
        $clients = $stmt->fetchAll();
        echo json_encode(["success" => true, "clients" => $clients]);
    }
    
    /**
     * POST /api/clients
     */
    public static function create() {
        $userId = requireAuth();
        $db = getDatabaseConnection();
        $data = json_decode(file_get_contents("php://input"), true);
        
        $client_name = isset($data['client_name']) ? htmlspecialchars(trim($data['client_name']), ENT_QUOTES, 'UTF-8') : '';
        $email = isset($data['email']) ? htmlspecialchars(trim($data['email']), ENT_QUOTES, 'UTF-8') : '';
        $phone = isset($data['phone']) ? htmlspecialchars(trim($data['phone']), ENT_QUOTES, 'UTF-8') : '';
        $address = isset($data['address']) ? htmlspecialchars(trim($data['address']), ENT_QUOTES, 'UTF-8') : '';
        
        if (empty($client_name)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Client name is required"]);
            return;
        }
        if (strlen($client_name) < 3 || strlen($client_name) > 100) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Client name must be between 3 and 100 characters"]);
            return;
        }
        
        if (empty($email)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Email address is required"]);
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
            echo json_encode(["success" => false, "message" => "Enter a valid 10-digit mobile number"]);
            return;
        }
        
        if (empty($address)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Address is required"]);
            return;
        }
        if (strlen($address) < 10) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Address must be at least 10 characters"]);
            return;
        }
        
        // Prevent duplicate clients having same email
        $stmt = $db->prepare("SELECT id FROM clients WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Duplicate Email"]);
            return;
        }
        
        // Prevent duplicate clients having same phone number
        $stmt = $db->prepare("SELECT id FROM clients WHERE phone = ?");
        $stmt->execute([$phone]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Duplicate Phone Number"]);
            return;
        }
        
        try {
            $stmt = $db->prepare("INSERT INTO clients (user_id, client_name, email, phone, address) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$userId, $client_name, $email, $phone, $address]);
            $clientId = $db->lastInsertId();
            
            echo json_encode([
                "success" => true,
                "message" => "Client Added Successfully",
                "client_id" => $clientId
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Server Error"]);
        }
    }
    
    /**
     * PUT /api/clients/{id}
     */
    public static function update($id) {
        $userId = requireAuth();
        $db = getDatabaseConnection();
        $data = json_decode(file_get_contents("php://input"), true);
        
        $id = (int)$id;
        
        // Verify ownership
        $stmt = $db->prepare("SELECT user_id FROM clients WHERE id = ?");
        $stmt->execute([$id]);
        $client = $stmt->fetch();
        
        if (!$client) {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Client not found."]);
            return;
        }
        
        if ((int)$client['user_id'] !== $userId) {
            http_response_code(403);
            echo json_encode(["success" => false, "message" => "Unauthorized access to this client."]);
            return;
        }
        
        $client_name = isset($data['client_name']) ? htmlspecialchars(trim($data['client_name']), ENT_QUOTES, 'UTF-8') : '';
        $email = isset($data['email']) ? htmlspecialchars(trim($data['email']), ENT_QUOTES, 'UTF-8') : '';
        $phone = isset($data['phone']) ? htmlspecialchars(trim($data['phone']), ENT_QUOTES, 'UTF-8') : '';
        $address = isset($data['address']) ? htmlspecialchars(trim($data['address']), ENT_QUOTES, 'UTF-8') : '';
        
        if (empty($client_name)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Client name is required"]);
            return;
        }
        if (strlen($client_name) < 3 || strlen($client_name) > 100) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Client name must be between 3 and 100 characters"]);
            return;
        }
        
        if (empty($email)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Email address is required"]);
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
            echo json_encode(["success" => false, "message" => "Enter a valid 10-digit mobile number"]);
            return;
        }
        
        if (empty($address)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Address is required"]);
            return;
        }
        if (strlen($address) < 10) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Address must be at least 10 characters"]);
            return;
        }
        
        // Prevent duplicate clients having same email
        $stmt = $db->prepare("SELECT id FROM clients WHERE email = ? AND id != ?");
        $stmt->execute([$email, $id]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Duplicate Email"]);
            return;
        }
        
        // Prevent duplicate clients having same phone number
        $stmt = $db->prepare("SELECT id FROM clients WHERE phone = ? AND id != ?");
        $stmt->execute([$phone, $id]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Duplicate Phone Number"]);
            return;
        }
        
        try {
            $stmt = $db->prepare("UPDATE clients SET client_name = ?, email = ?, phone = ?, address = ? WHERE id = ? AND user_id = ?");
            $stmt->execute([$client_name, $email, $phone, $address, $id, $userId]);
            
            echo json_encode([
                "success" => true,
                "message" => "Client Updated Successfully"
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Server Error"]);
        }
    }
    
    /**
     * DELETE /api/clients/{id}
     */
    public static function delete($id) {
        $userId = requireAuth();
        $db = getDatabaseConnection();
        $id = (int)$id;
        
        // Verify ownership
        $stmt = $db->prepare("SELECT user_id FROM clients WHERE id = ?");
        $stmt->execute([$id]);
        $client = $stmt->fetch();
        
        if (!$client) {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Client not found."]);
            return;
        }
        
        if ((int)$client['user_id'] !== $userId) {
            http_response_code(403);
            echo json_encode(["success" => false, "message" => "Unauthorized access to this client."]);
            return;
        }
        
        try {
            $stmt = $db->prepare("DELETE FROM clients WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $userId]);
            
            echo json_encode([
                "success" => true,
                "message" => "Client deleted successfully."
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Failed to delete client. " . $e->getMessage()]);
        }
    }
}
