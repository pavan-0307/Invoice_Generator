<?php
// backend/index.php

// 1. Session and Security policies
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
// 2. CORS handling for SPA architecture
$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: http://localhost:5173");
}
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header('Content-Type: application/json');

// 3. Routing engine
$request_uri = $_SERVER['REQUEST_URI'] ?? '';
$parsed_url = parse_url($request_uri);
$path = $parsed_url['path'] ?? '';

// Strip index.php if present in path (e.g. running on Apache/subfolders)
$path = preg_replace('/^.*?index\.php/', '', $path);
$path = trim($path, '/');

$parts = explode('/', $path);

// Validate base endpoint
if (count($parts) < 2 || $parts[0] !== 'api') {
    http_response_code(404);
    echo json_encode(["success" => false, "message" => "REST API Endpoint not found."]);
    exit;
}

$resource = $parts[1];
$id = $parts[2] ?? null;
$method = $_SERVER['REQUEST_METHOD'];

try {
    // Health Check & Database Check Route
    if ($resource === 'health' && $method === 'GET') {
        require_once __DIR__ . '/config/database.php';
        getDatabaseConnection(); // Test DB connection (will exit with 500 if fail)
        http_response_code(200);
        echo json_encode(["success" => true, "message" => "Backend Running"]);
        exit;
    } elseif ($resource === 'db-test' && $method === 'GET') {
        require_once __DIR__ . '/config/database.php';
        getDatabaseConnection();
        http_response_code(200);
        echo json_encode(["success" => true, "message" => "Database connected successfully to invoice_portal"]);
        exit;
    }
    
    // Authentication Routes
    elseif (($resource === 'register' || ($resource === 'auth' && $id === 'register')) && $method === 'POST') {
        require_once __DIR__ . '/controllers/AuthController.php';
        AuthController::register();
    } elseif (($resource === 'login' || ($resource === 'auth' && $id === 'login')) && $method === 'POST') {
        require_once __DIR__ . '/controllers/AuthController.php';
        AuthController::login();
    } elseif (($resource === 'logout' || ($resource === 'auth' && $id === 'logout')) && $method === 'POST') {
        require_once __DIR__ . '/controllers/AuthController.php';
        AuthController::logout();
    } elseif (($resource === 'me' || ($resource === 'auth' && $id === 'me')) && $method === 'GET') {
        require_once __DIR__ . '/controllers/AuthController.php';
        AuthController::me();
    } 

    // Clients Routes
    elseif ($resource === 'clients') {
        require_once __DIR__ . '/controllers/ClientController.php';
        if ($method === 'GET') {
            ClientController::index();
        } elseif ($method === 'POST') {
            ClientController::create();
        } elseif ($method === 'PUT' && $id) {
            ClientController::update($id);
        } elseif ($method === 'DELETE' && $id) {
            ClientController::delete($id);
        } else {
            http_response_code(405);
            echo json_encode(["success" => false, "message" => "Method not allowed."]);
        }
    }

    // Invoices Routes
    elseif ($resource === 'invoices') {
        require_once __DIR__ . '/controllers/InvoiceController.php';
        if ($method === 'GET') {
            if ($id) {
                InvoiceController::show($id);
            } else {
                InvoiceController::index();
            }
        } elseif ($method === 'POST') {
            InvoiceController::create();
        } elseif ($method === 'PUT' && $id) {
            InvoiceController::update($id);
        } elseif ($method === 'DELETE' && $id) {
            InvoiceController::delete($id);
        } else {
            http_response_code(405);
            echo json_encode(["success" => false, "message" => "Method not allowed."]);
        }
    }

    // Payments Routes
    elseif ($resource === 'payments') {
        require_once __DIR__ . '/controllers/PaymentController.php';
        if ($method === 'POST') {
            PaymentController::create();
        } elseif ($method === 'GET' && $id) {
            PaymentController::getInvoicePayments($id);
        } elseif ($method === 'DELETE' && $id) {
            PaymentController::delete($id);
        } else {
            http_response_code(405);
            echo json_encode(["success" => false, "message" => "Method not allowed."]);
        }
    }

    // Dashboard Routes
    elseif ($resource === 'dashboard' && $method === 'GET') {
        require_once __DIR__ . '/controllers/DashboardController.php';
        DashboardController::index();
    }
    
    // Settings Routes
    elseif ($resource === 'settings') {
        require_once __DIR__ . '/controllers/SettingsController.php';
        if ($method === 'GET') {
            SettingsController::get();
        } elseif ($method === 'PUT') {
            if ($id === 'password') {
                SettingsController::changePassword();
            } elseif ($id === 'theme') {
                SettingsController::updateTheme();
            } else {
                SettingsController::update();
            }
        } elseif ($method === 'POST' && $id === 'logo') {
            SettingsController::uploadLogo();
        } else {
            http_response_code(405);
            echo json_encode(["success" => false, "message" => "Method not allowed."]);
        }
    }

    // No route matched
    else {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Resource not found."]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "An internal server error occurred: " . $e->getMessage()]);
}
