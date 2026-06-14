<?php
// backend/migrate.php
require_once __DIR__ . '/config/database.php';

try {
    $db = getDatabaseConnection();
    
    echo "Starting database migration...\n";
    
    // 1. Resolve duplicate clients.phone
    echo "Cleaning duplicate client phone numbers...\n";
    $db->exec("UPDATE clients SET phone = '8147221487' WHERE id = 3");
    
    // 2. Resolve duplicate invoices.invoice_number
    echo "Cleaning duplicate invoice numbers...\n";
    $db->exec("UPDATE invoices SET invoice_number = 'INV-202606-0004' WHERE id = 2");
    
    // Helper function to safely drop index/constraint
    function dropIndexIfExists($db, $tableName, $indexName) {
        try {
            $db->exec("ALTER TABLE `$tableName` DROP INDEX `$indexName`");
            echo "Dropped index `$indexName` from `$tableName`.\n";
        } catch (PDOException $e) {
            // Ignore if index doesn't exist
        }
    }
    
    // 3. Alter clients table unique constraints
    echo "Altering clients table for UNIQUE constraints on email and phone...\n";
    
    // Try to drop old composite indexes if any
    dropIndexIfExists($db, 'clients', 'idx_client_email');
    dropIndexIfExists($db, 'clients', 'idx_client_phone');
    
    // Add unique indexes if they don't exist
    try {
        $db->exec("ALTER TABLE clients ADD UNIQUE KEY uq_client_email (email)");
        echo "Added UNIQUE constraint `uq_client_email` on clients.\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate key name') !== false) {
            echo "UNIQUE constraint `uq_client_email` already exists.\n";
        } else {
            throw $e;
        }
    }
    
    try {
        $db->exec("ALTER TABLE clients ADD UNIQUE KEY uq_client_phone (phone)");
        echo "Added UNIQUE constraint `uq_client_phone` on clients.\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate key name') !== false) {
            echo "UNIQUE constraint `uq_client_phone` already exists.\n";
        } else {
            throw $e;
        }
    }
    
    // 4. Alter invoices table unique constraints
    echo "Altering invoices table for GLOBAL UNIQUE constraint on invoice_number...\n";
    dropIndexIfExists($db, 'invoices', 'uq_user_invoice_number');
    
    try {
        $db->exec("ALTER TABLE invoices ADD UNIQUE KEY uq_invoice_number (invoice_number)");
        echo "Added UNIQUE constraint `uq_invoice_number` on invoices.\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate key name') !== false) {
            echo "UNIQUE constraint `uq_invoice_number` already exists.\n";
        } else {
            throw $e;
        }
    }
    
    echo "Database migration completed successfully!\n";
    
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
