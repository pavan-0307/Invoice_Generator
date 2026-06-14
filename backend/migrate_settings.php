<?php
// backend/migrate_settings.php
require_once __DIR__ . '/config/database.php';

try {
    $db = getDatabaseConnection();
    echo "Starting settings database migration...\n";

    $schema = "
    CREATE TABLE IF NOT EXISTS `business_settings` (
      `id` INT AUTO_INCREMENT PRIMARY KEY,
      `user_id` INT NOT NULL,
      `business_name` VARCHAR(255) NOT NULL,
      `owner_name` VARCHAR(255) NOT NULL,
      `phone` VARCHAR(50) DEFAULT NULL,
      `gst_number` VARCHAR(50) DEFAULT NULL,
      `address` TEXT DEFAULT NULL,
      `city` VARCHAR(100) DEFAULT NULL,
      `state` VARCHAR(100) DEFAULT NULL,
      `country` VARCHAR(100) DEFAULT NULL,
      `postal_code` VARCHAR(20) DEFAULT NULL,
      `logo_path` VARCHAR(255) DEFAULT NULL,
      `default_tax_rate` DECIMAL(5,2) DEFAULT 0.00,
      `default_currency` VARCHAR(10) DEFAULT 'INR',
      `invoice_prefix` VARCHAR(20) DEFAULT 'INV',
      `payment_terms` VARCHAR(50) DEFAULT '30 Days',
      `theme` VARCHAR(20) DEFAULT 'Light',
      `payment_notifications` TINYINT(1) DEFAULT 1,
      `invoice_notifications` TINYINT(1) DEFAULT 1,
      `client_notifications` TINYINT(1) DEFAULT 1,
      `email_notifications` TINYINT(1) DEFAULT 0,
      `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY `uq_user_settings` (`user_id`),
      FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";

    $db->exec($schema);
    echo "Table `business_settings` created successfully.\n";

    // Migrate existing users to have a settings row if they don't have one
    $usersStmt = $db->query("SELECT id, business_name, owner_name FROM users");
    $users = $usersStmt->fetchAll();
    
    $insertStmt = $db->prepare("
        INSERT IGNORE INTO business_settings (user_id, business_name, owner_name) 
        VALUES (?, ?, ?)
    ");
    
    foreach ($users as $u) {
        $insertStmt->execute([$u['id'], $u['business_name'], $u['owner_name']]);
        echo "Initialized default settings for user ID {$u['id']}.\n";
    }

    echo "Settings database migration completed successfully!\n";
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
