<?php
// backend/controllers/PaymentController.php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/InvoiceController.php';

class PaymentController {
    
    /**
     * POST /api/payments
     */
    public static function create() {
        $userId = requireAuth();
        $db = getDatabaseConnection();
        $data = json_decode(file_get_contents("php://input"), true);
        
        $invoice_id = isset($data['invoice_id']) ? (int)$data['invoice_id'] : 0;
        $amount = isset($data['amount']) ? (float)$data['amount'] : 0.00;
        $payment_date = isset($data['payment_date']) ? htmlspecialchars(trim($data['payment_date']), ENT_QUOTES, 'UTF-8') : '';
        $payment_method = isset($data['payment_method']) ? htmlspecialchars(trim($data['payment_method']), ENT_QUOTES, 'UTF-8') : '';
        $reference_number = isset($data['reference_number']) ? htmlspecialchars(trim($data['reference_number']), ENT_QUOTES, 'UTF-8') : '';
        $notes = isset($data['notes']) ? htmlspecialchars(trim($data['notes']), ENT_QUOTES, 'UTF-8') : '';
        
        if ($invoice_id <= 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invoice is required"]);
            return;
        }
        if ($amount <= 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Amount must be greater than 0"]);
            return;
        }
        if (empty($payment_date)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Payment Date is required"]);
            return;
        }
        if (empty($payment_method)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Payment Method is required"]);
            return;
        }
        if (strlen($reference_number) > 50) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Reference number cannot exceed 50 characters"]);
            return;
        }
        
        // Verify invoice ownership
        $stmt = $db->prepare("SELECT id, status, grand_total FROM invoices WHERE id = ? AND user_id = ?");
        $stmt->execute([$invoice_id, $userId]);
        $invoice = $stmt->fetch();
        
        if (!$invoice) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invoice not found or unauthorized."]);
            return;
        }
        
        if ($invoice['status'] === 'Draft') {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Cannot register payments for draft invoices."]);
            return;
        }
        
        // Get sum of existing payments for this invoice
        $stmt = $db->prepare("SELECT SUM(amount) as payments_received FROM payments WHERE invoice_id = ?");
        $stmt->execute([$invoice_id]);
        $payments_received = (float)($stmt->fetch()['payments_received'] ?? 0.00);
        $grand_total = (float)$invoice['grand_total'];
        $outstanding_balance = max($grand_total - $payments_received, 0.00);
        
        if ($amount > $outstanding_balance + 0.01) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Payment amount cannot exceed outstanding balance"]);
            return;
        }
        
        // Transaction safety
        try {
            $db->beginTransaction();
            
            // Insert Payment
            $stmt = $db->prepare("INSERT INTO payments (invoice_id, amount, payment_date, payment_method, reference_number, notes) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$invoice_id, $amount, $payment_date, $payment_method, $reference_number, $notes]);
            
            $db->commit();
            
            // Recalculate status of the invoice
            InvoiceController::recalculateInvoiceStatus($invoice_id, $db);
            
            echo json_encode([
                "success" => true,
                "message" => "Payment Recorded Successfully"
            ]);
            
        } catch (PDOException $e) {
            $db->rollBack();
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Server Error"]);
        }
    }
    
    /**
     * GET /api/payments/{invoiceId}
     */
    public static function getInvoicePayments($invoiceId) {
        $userId = requireAuth();
        $db = getDatabaseConnection();
        $invoiceId = (int)$invoiceId;
        
        // Verify invoice ownership
        $stmt = $db->prepare("SELECT id FROM invoices WHERE id = ? AND user_id = ?");
        $stmt->execute([$invoiceId, $userId]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Invoice not found or unauthorized."]);
            return;
        }
        
        $stmt = $db->prepare("SELECT * FROM payments WHERE invoice_id = ? ORDER BY payment_date DESC, id DESC");
        $stmt->execute([$invoiceId]);
        $payments = $stmt->fetchAll();
        
        echo json_encode(["success" => true, "payments" => $payments]);
    }
    
    /**
     * DELETE /api/payments/{id}
     */
    public static function delete($id) {
        $userId = requireAuth();
        $db = getDatabaseConnection();
        $id = (int)$id;
        
        // Find payment and verify user ownership of its invoice
        $stmt = $db->prepare("SELECT p.*, i.user_id FROM payments p JOIN invoices i ON p.invoice_id = i.id WHERE p.id = ?");
        $stmt->execute([$id]);
        $payment = $stmt->fetch();
        
        if (!$payment) {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Payment record not found."]);
            return;
        }
        
        if ((int)$payment['user_id'] !== $userId) {
            http_response_code(403);
            echo json_encode(["success" => false, "message" => "Unauthorized to delete this payment."]);
            return;
        }
        
        try {
            $db->beginTransaction();
            
            $stmt = $db->prepare("DELETE FROM payments WHERE id = ?");
            $stmt->execute([$id]);
            
            $db->commit();
            
            // Recalculate status of the invoice
            InvoiceController::recalculateInvoiceStatus($payment['invoice_id'], $db);
            
            echo json_encode([
                "success" => true,
                "message" => "Payment deleted successfully."
            ]);
        } catch (PDOException $e) {
            $db->rollBack();
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Database failure: " . $e->getMessage()]);
        }
    }
}
