<?php
// backend/alter_theme_default.php
require_once __DIR__ . '/config/database.php';

try {
    $db = getDatabaseConnection();
    echo "Altering theme default to Light...\n";
    
    // Modify column default
    $db->exec("ALTER TABLE business_settings MODIFY COLUMN theme VARCHAR(20) DEFAULT 'Light'");
    echo "Column default modified successfully.\n";
    
    // Update existing users to Light mode
    $db->exec("UPDATE business_settings SET theme = 'Light'");
    echo "All existing profiles set to Light theme.\n";
    
} catch (Exception $e) {
    echo "Failed to alter theme default: " . $e->getMessage() . "\n";
    exit(1);
}
