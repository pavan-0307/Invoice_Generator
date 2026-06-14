<?php
// backend/controllers/InvoiceController.php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class InvoiceController {
    
    /**
     * Helper to update status of overdue invoices before displaying
     */
    private static function checkAndUpdateOverdueInvoices($userId, $db) {
        $today = date('Y-m-d');
        // If an invoice is Pending or Partially Paid, and its due date is in the past, mark it Overdue.
        $query = "UPDATE invoices 
                  SET status = 'Overdue' 
                  WHERE user_id = :user_id 
                  AND status IN ('Pending', 'Partially Paid') 
                  AND due_date < :today";
        $stmt = $db->prepare($query);
        $stmt->execute([
            'user_id' => $userId,
            'today' => $today
        ]);
    }
    
    /**
     * GET /api/invoices
     */
    public static function index() {
        $userId = requireAuth();
        $db = getDatabaseConnection();
        
        // Auto update overdue status first
        self::checkAndUpdateOverdueInvoices($userId, $db);
        
        $status = isset($_GET['status']) ? htmlspecialchars(trim($_GET['status']), ENT_QUOTES, 'UTF-8') : 'All';
        $search = isset($_GET['search']) ? htmlspecialchars(trim($_GET['search']), ENT_QUOTES, 'UTF-8') : '';
        
        $query = "SELECT i.*, c.client_name 
                  FROM invoices i 
                  JOIN clients c ON i.client_id = c.id 
                  WHERE i.user_id = :user_id";
        
        $params = ['user_id' => $userId];
        
        if ($status !== 'All' && in_array($status, ['Draft', 'Pending', 'Partially Paid', 'Paid', 'Overdue'])) {
            $query .= " AND i.status = :status";
            $params['status'] = $status;
        }
        
        if (!empty($search)) {
            $query .= " AND (i.invoice_number LIKE :search OR c.client_name LIKE :search)";
            $params['search'] = '%' . $search . '%';
        }
        
        $query .= " ORDER BY i.invoice_date DESC, i.id DESC";
        
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $invoices = $stmt->fetchAll();
        
        echo json_encode(["success" => true, "invoices" => $invoices]);
    }
    
    /**
     * GET /api/invoices/{id}
     */
    public static function show($id) {
        $userId = requireAuth();
        $db = getDatabaseConnection();
        $id = (int)$id;
        
        // Get invoice header details along with user profile settings
        $query = "SELECT i.*, c.client_name, c.email as client_email, c.phone as client_phone, c.address as client_address,
                         u.email as business_email,
                         COALESCE(bs.business_name, u.business_name) as business_name,
                         COALESCE(bs.owner_name, u.owner_name) as owner_name,
                         bs.phone as business_phone, bs.gst_number as business_gst, 
                         bs.address as business_address, bs.city as business_city, bs.state as business_state, 
                         bs.country as business_country, bs.postal_code as business_postal_code, bs.logo_path
                  FROM invoices i 
                  JOIN clients c ON i.client_id = c.id 
                  JOIN users u ON i.user_id = u.id
                  LEFT JOIN business_settings bs ON u.id = bs.user_id
                  WHERE i.id = :id AND i.user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->execute([
            'id' => $id,
            'user_id' => $userId
        ]);
        $invoice = $stmt->fetch();
        
        if (!$invoice) {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Invoice not found."]);
            return;
        }
        
        // Fetch items
        $stmt = $db->prepare("SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY id ASC");
        $stmt->execute([$id]);
        $items = $stmt->fetchAll();
        
        // Fetch payments
        $stmt = $db->prepare("SELECT * FROM payments WHERE invoice_id = ? ORDER BY payment_date DESC, id DESC");
        $stmt->execute([$id]);
        $payments = $stmt->fetchAll();
        
        echo json_encode([
            "success" => true,
            "invoice" => $invoice,
            "items" => $items,
            "payments" => $payments
        ]);
    }
    
    /**
     * POST /api/invoices
     */
    public static function create() {
        $userId = requireAuth();
        $db = getDatabaseConnection();
        $data = json_decode(file_get_contents("php://input"), true);
        
        $client_id = isset($data['client_id']) ? (int)$data['client_id'] : 0;
        $invoice_date = isset($data['invoice_date']) ? trim($data['invoice_date']) : '';
        $due_date = isset($data['due_date']) ? trim($data['due_date']) : '';
        $tax_rate = isset($data['tax_rate']) ? (float)$data['tax_rate'] : 0.00;
        $items = isset($data['items']) ? $data['items'] : [];
        $status = isset($data['status']) && in_array($data['status'], ['Draft', 'Pending']) ? $data['status'] : 'Pending';
        
        if ($client_id <= 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid client selection."]);
            return;
        }
        if (empty($invoice_date)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invoice date is required"]);
            return;
        }
        if (empty($due_date)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Due date is required"]);
            return;
        }
        if (strtotime($due_date) < strtotime($invoice_date)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Due date must be greater than or equal to Invoice Date"]);
            return;
        }
        if ($tax_rate < 0 || $tax_rate > 100) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Tax rate must be between 0 and 100"]);
            return;
        }
        if (empty($items)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "At least one invoice item is required"]);
            return;
        }
        
        // Verify client belongs to this user
        $stmt = $db->prepare("SELECT id FROM clients WHERE id = ? AND user_id = ?");
        $stmt->execute([$client_id, $userId]);
        if (!$stmt->fetch()) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invalid client selection."]);
            return;
        }
        
        // Fetch user custom invoice prefix
        $settingsStmt = $db->prepare("SELECT invoice_prefix FROM business_settings WHERE user_id = ?");
        $settingsStmt->execute([$userId]);
        $settings = $settingsStmt->fetch();
        $prefix = $settings && !empty($settings['invoice_prefix']) ? $settings['invoice_prefix'] : 'INV';
        
        // Auto-generate globally unique invoice number
        $year = date('Y', strtotime($invoice_date));
        $stmt = $db->query("SELECT COUNT(id) as total FROM invoices");
        $totalCount = (int)$stmt->fetch()['total'];
        $count = 0;
        do {
            $count++;
            $invoice_number = $prefix . "-" . $year . "-" . str_pad($totalCount + $count, 4, '0', STR_PAD_LEFT);
            $checkStmt = $db->prepare("SELECT id FROM invoices WHERE invoice_number = ?");
            $checkStmt->execute([$invoice_number]);
        } while ($checkStmt->fetch());
        
        // Calculate Totals
        $subtotal = 0.00;
        $validatedItems = [];
        
        foreach ($items as $item) {
            $desc = isset($item['description']) ? htmlspecialchars(trim($item['description']), ENT_QUOTES, 'UTF-8') : '';
            $qty = isset($item['quantity']) ? (float)$item['quantity'] : 0.00;
            $price = isset($item['unit_price']) ? (float)$item['unit_price'] : 0.00;
            
            if (empty($desc)) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Description is required"]);
                return;
            }
            if ($qty <= 0) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Quantity must be greater than zero"]);
                return;
            }
            if ($price <= 0) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Unit price must be greater than zero"]);
                return;
            }
            
            $total = $qty * $price;
            $subtotal += $total;
            
            $validatedItems[] = [
                'description' => $desc,
                'quantity' => $qty,
                'unit_price' => $price,
                'total' => $total
            ];
        }
        
        $tax_amount = $subtotal * ($tax_rate / 100);
        $grand_total = $subtotal + $tax_amount;
        
        // Transaction safety
        try {
            $db->beginTransaction();
            
            // Insert Invoice Header
            $stmt = $db->prepare("INSERT INTO invoices (user_id, client_id, invoice_number, invoice_date, due_date, tax_rate, subtotal, tax_amount, grand_total, status) 
                                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $userId,
                $client_id,
                $invoice_number,
                $invoice_date,
                $due_date,
                $tax_rate,
                $subtotal,
                $tax_amount,
                $grand_total,
                $status
            ]);
            
            $invoiceId = $db->lastInsertId();
            
            // Insert Line Items
            $stmt = $db->prepare("INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?)");
            foreach ($validatedItems as $item) {
                $stmt->execute([
                    $invoiceId,
                    $item['description'],
                    $item['quantity'],
                    $item['unit_price'],
                    $item['total']
                ]);
            }
            
            $db->commit();
            
            echo json_encode([
                "success" => true,
                "message" => "Invoice Created Successfully",
                "invoice_id" => $invoiceId,
                "invoice_number" => $invoice_number
            ]);
            
        } catch (PDOException $e) {
            $db->rollBack();
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Database failure during creation: " . $e->getMessage()]);
        }
    }
    
    /**
     * PUT /api/invoices/{id}
     */
    public static function update($id) {
        $userId = requireAuth();
        $db = getDatabaseConnection();
        $id = (int)$id;
        
        // Verify ownership
        $stmt = $db->prepare("SELECT status, grand_total FROM invoices WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        $existingInvoice = $stmt->fetch();
        
        if (!$existingInvoice) {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Invoice not found."]);
            return;
        }
        
        $data = json_decode(file_get_contents("php://input"), true);
        
        $invoice_date = isset($data['invoice_date']) ? trim($data['invoice_date']) : '';
        $due_date = isset($data['due_date']) ? trim($data['due_date']) : '';
        $tax_rate = isset($data['tax_rate']) ? (float)$data['tax_rate'] : 0.00;
        $items = isset($data['items']) ? $data['items'] : [];
        $status = isset($data['status']) && in_array($data['status'], ['Draft', 'Pending', 'Partially Paid', 'Paid', 'Overdue']) ? $data['status'] : '';
        
        if (empty($invoice_date)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Invoice date is required"]);
            return;
        }
        if (empty($due_date)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Due date is required"]);
            return;
        }
        if (strtotime($due_date) < strtotime($invoice_date)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Due date must be greater than or equal to Invoice Date"]);
            return;
        }
        if ($tax_rate < 0 || $tax_rate > 100) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Tax rate must be between 0 and 100"]);
            return;
        }
        if (empty($items)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "At least one invoice item is required"]);
            return;
        }
        
        // Calculate Totals
        $subtotal = 0.00;
        $validatedItems = [];
        
        foreach ($items as $item) {
            $desc = isset($item['description']) ? htmlspecialchars(trim($item['description']), ENT_QUOTES, 'UTF-8') : '';
            $qty = isset($item['quantity']) ? (float)$item['quantity'] : 0.00;
            $price = isset($item['unit_price']) ? (float)$item['unit_price'] : 0.00;
            
            if (empty($desc)) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Description is required"]);
                return;
            }
            if ($qty <= 0) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Quantity must be greater than zero"]);
                return;
            }
            if ($price <= 0) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Unit price must be greater than zero"]);
                return;
            }
            
            $total = $qty * $price;
            $subtotal += $total;
            
            $validatedItems[] = [
                'description' => $desc,
                'quantity' => $qty,
                'unit_price' => $price,
                'total' => $total
            ];
        }
        
        $tax_amount = $subtotal * ($tax_rate / 100);
        $grand_total = $subtotal + $tax_amount;
        
        // Transaction safety
        try {
            $db->beginTransaction();
            
            // Delete existing line items
            $stmt = $db->prepare("DELETE FROM invoice_items WHERE invoice_id = ?");
            $stmt->execute([$id]);
            
            // Insert updated line items
            $stmt = $db->prepare("INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total) VALUES (?, ?, ?, ?, ?)");
            foreach ($validatedItems as $item) {
                $stmt->execute([
                    $id,
                    $item['description'],
                    $item['quantity'],
                    $item['unit_price'],
                    $item['total']
                ]);
            }
            
            // Update invoice header (don't overwrite status if it's already managed by payments, or recalculate status if provided)
            if (empty($status)) {
                $status = $existingInvoice['status'];
            }
            
            $stmt = $db->prepare("UPDATE invoices 
                                  SET invoice_date = ?, due_date = ?, tax_rate = ?, subtotal = ?, tax_amount = ?, grand_total = ?, status = ? 
                                  WHERE id = ? AND user_id = ?");
            $stmt->execute([
                $invoice_date,
                $due_date,
                $tax_rate,
                $subtotal,
                $tax_amount,
                $grand_total,
                $status,
                $id,
                $userId
            ]);
            
            $db->commit();
            
            // Recalculate status based on payments if payments exist
            self::recalculateInvoiceStatus($id, $db);
            
            echo json_encode([
                "success" => true,
                "message" => "Invoice updated successfully."
            ]);
            
        } catch (PDOException $e) {
            $db->rollBack();
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Database failure during edit: " . $e->getMessage()]);
        }
    }
    
    /**
     * DELETE /api/invoices/{id}
     */
    public static function delete($id) {
        $userId = requireAuth();
        $db = getDatabaseConnection();
        $id = (int)$id;
        
        // Verify ownership
        $stmt = $db->prepare("SELECT id FROM invoices WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        if (!$stmt->fetch()) {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Invoice not found."]);
            return;
        }
        
        try {
            $stmt = $db->prepare("DELETE FROM invoices WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $userId]);
            
            echo json_encode([
                "success" => true,
                "message" => "Invoice deleted successfully."
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Failed to delete invoice. " . $e->getMessage()]);
        }
    }
    
    /**
     * Recalculates and updates the invoice status based on payment transactions
     */
    public static function recalculateInvoiceStatus($invoiceId, $db) {
        // Fetch invoice info
        $stmt = $db->prepare("SELECT grand_total, due_date, status FROM invoices WHERE id = ?");
        $stmt->execute([$invoiceId]);
        $invoice = $stmt->fetch();
        
        if (!$invoice) return;
        
        // If Draft, don't auto-transition unless explicitly published or paid
        if ($invoice['status'] === 'Draft') return;
        
        $grand_total = (float)$invoice['grand_total'];
        $due_date = $invoice['due_date'];
        
        // Get sum of payments (Payments Received)
        $stmt = $db->prepare("SELECT SUM(amount) as payments_received FROM payments WHERE invoice_id = ?");
        $stmt->execute([$invoiceId]);
        $payments_received = (float)($stmt->fetch()['payments_received'] ?? 0.00);
        
        $outstanding_balance = max($grand_total - $payments_received, 0.00);
        
        if ($outstanding_balance == 0.00) {
            $status = 'Paid';
        } elseif ($outstanding_balance < $grand_total && $outstanding_balance > 0.00) {
            $status = 'Partially Paid';
        } else {
            // Outstanding Balance = Invoice Total
            $today = date('Y-m-d');
            if ($today > $due_date) {
                $status = 'Overdue';
            } else {
                $status = 'Pending';
            }
        }
        
        $stmt = $db->prepare("UPDATE invoices SET status = ? WHERE id = ?");
        $stmt->execute([$status, $invoiceId]);
    }
}
