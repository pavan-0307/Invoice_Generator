<?php
// backend/controllers/DashboardController.php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class DashboardController {
    
    /**
     * Helper to update status of overdue invoices before loading dashboard metrics
     */
    private static function updateOverdueInvoices($userId, $db) {
        $today = date('Y-m-d');
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
     * GET /api/dashboard
     */
    public static function index() {
        $userId = requireAuth();
        $db = getDatabaseConnection();
        
        // Ensure overdue statuses are updated
        self::updateOverdueInvoices($userId, $db);
        
        // 1. Total Revenue (sum of all payments for invoices belonging to the user)
        $revenueQuery = "SELECT IFNULL(SUM(p.amount), 0.00) as total_revenue 
                         FROM payments p 
                         JOIN invoices i ON p.invoice_id = i.id 
                         WHERE i.user_id = :user_id";
        $stmt = $db->prepare($revenueQuery);
        $stmt->execute(['user_id' => $userId]);
        $totalRevenue = (float)$stmt->fetch()['total_revenue'];
        
        // 2. Pending Amount (balance of active non-Draft non-Paid invoices)
        $pendingQuery = "SELECT IFNULL(SUM(i.grand_total - IFNULL((SELECT SUM(amount) FROM payments WHERE invoice_id = i.id), 0.00)), 0.00) as pending_amount
                         FROM invoices i
                         WHERE i.user_id = :user_id 
                         AND i.status IN ('Pending', 'Partially Paid', 'Overdue')";
        $stmt = $db->prepare($pendingQuery);
        $stmt->execute(['user_id' => $userId]);
        $pendingAmount = (float)$stmt->fetch()['pending_amount'];
        
        // 3. Overdue Amount (balance of overdue invoices only)
        $overdueQuery = "SELECT IFNULL(SUM(i.grand_total - IFNULL((SELECT SUM(amount) FROM payments WHERE invoice_id = i.id), 0.00)), 0.00) as overdue_amount
                         FROM invoices i
                         WHERE i.user_id = :user_id 
                         AND i.status = 'Overdue'";
        $stmt = $db->prepare($overdueQuery);
        $stmt->execute(['user_id' => $userId]);
        $overdueAmount = (float)$stmt->fetch()['overdue_amount'];
        
        // 4. Total Clients count
        $clientsQuery = "SELECT COUNT(id) as total_clients FROM clients WHERE user_id = :user_id";
        $stmt = $db->prepare($clientsQuery);
        $stmt->execute(['user_id' => $userId]);
        $totalClients = (int)$stmt->fetch()['total_clients'];
        
        // 5. Total Invoices count
        $invoicesQuery = "SELECT COUNT(id) as total_invoices FROM invoices WHERE user_id = :user_id";
        $stmt = $db->prepare($invoicesQuery);
        $stmt->execute(['user_id' => $userId]);
        $totalInvoices = (int)$stmt->fetch()['total_invoices'];
        
        // 6. Monthly Revenue Trend (Last 6 Months)
        $trendQuery = "SELECT DATE_FORMAT(p.payment_date, '%Y-%m') as month, SUM(p.amount) as amount 
                       FROM payments p 
                       JOIN invoices i ON p.invoice_id = i.id 
                       WHERE i.user_id = :user_id 
                       AND p.payment_date >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
                       GROUP BY month 
                       ORDER BY month ASC";
        $stmt = $db->prepare($trendQuery);
        $stmt->execute(['user_id' => $userId]);
        $trendResults = $stmt->fetchAll();
        
        // Fill out empty months to ensure clean charts in frontend
        $monthlyTrends = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthStr = date('Y-m', strtotime("-$i months"));
            $monthlyTrends[$monthStr] = 0.00;
        }
        foreach ($trendResults as $row) {
            $monthlyTrends[$row['month']] = (float)$row['amount'];
        }
        
        $trendsFormatted = [];
        foreach ($monthlyTrends as $m => $val) {
            $trendsFormatted[] = [
                'name' => date('M Y', strtotime($m . "-01")),
                'revenue' => $val
            ];
        }
        
        // 7. Invoice Status Distribution
        $distQuery = "SELECT status, COUNT(id) as count 
                      FROM invoices 
                      WHERE user_id = :user_id 
                      GROUP BY status";
        $stmt = $db->prepare($distQuery);
        $stmt->execute(['user_id' => $userId]);
        $distResults = $stmt->fetchAll();
        
        $distribution = [
            'Draft' => 0,
            'Pending' => 0,
            'Partially Paid' => 0,
            'Paid' => 0,
            'Overdue' => 0
        ];
        foreach ($distResults as $row) {
            $distribution[$row['status']] = (int)$row['count'];
        }
        
        // 8. Recent Invoices (limit 5)
        $recentInvoicesQuery = "SELECT i.*, c.client_name 
                                FROM invoices i 
                                JOIN clients c ON i.client_id = c.id 
                                WHERE i.user_id = :user_id 
                                ORDER BY i.created_at DESC 
                                LIMIT 5";
        $stmt = $db->prepare($recentInvoicesQuery);
        $stmt->execute(['user_id' => $userId]);
        $recentInvoices = $stmt->fetchAll();
        
        // 9. Recent Payments (limit 5)
        $recentPaymentsQuery = "SELECT p.*, i.invoice_number, c.client_name 
                                FROM payments p 
                                JOIN invoices i ON p.invoice_id = i.id 
                                JOIN clients c ON i.client_id = c.id 
                                WHERE i.user_id = :user_id 
                                ORDER BY p.payment_date DESC, p.id DESC 
                                LIMIT 5";
        $stmt = $db->prepare($recentPaymentsQuery);
        $stmt->execute(['user_id' => $userId]);
        $recentPayments = $stmt->fetchAll();
        
        echo json_encode([
            "success" => true,
            "metrics" => [
                "total_revenue" => $totalRevenue,
                "pending_amount" => $pendingAmount,
                "overdue_amount" => $overdueAmount,
                "total_clients" => $totalClients,
                "total_invoices" => $totalInvoices
            ],
            "trends" => $trendsFormatted,
            "distribution" => $distribution,
            "recent_invoices" => $recentInvoices,
            "recent_payments" => $recentPayments
        ]);
    }
}
