<?php
// Prevent multiple inclusions
if (defined('APP_CONFIG_LOADED')) {
    return;
}
define('APP_CONFIG_LOADED', true);

// Start PHP session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Load environment variables from .env.local or .env if present
function loadEnvFile($path) {
    if (!file_exists($path)) {
        return false;
    }
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            $key = trim($parts[0]);
            $val = trim($parts[1]);
            // Remove wrapping quotes if present
            if ((str_starts_with($val, '"') && str_ends_with($val, '"')) ||
                (str_starts_with($val, "'") && str_ends_with($val, "'"))) {
                $val = substr($val, 1, -1);
            }
            if (!getenv($key)) {
                putenv("$key=$val");
                $_ENV[$key] = $val;
            }
        }
    }
    return true;
}

loadEnvFile(__DIR__ . '/.env.local');
loadEnvFile(__DIR__ . '/.env');


// JSON Users storage
define('USERS_FILE_PATH', __DIR__ . '/data/users.json');

/**
 * Initialize and load registered users
 */
function getRegisteredUsers() {
    $dir = dirname(USERS_FILE_PATH);
    if (!is_dir($dir)) {
        mkdir($dir, 0777, true);
    }

    if (!file_exists(USERS_FILE_PATH)) {
        $defaultUsers = [
            [
                'name' => 'Jordan Lee',
                'email' => 'jordan.lee@nexuscorp.io',
                'companyName' => 'Nexus Corp',
                'domain' => 'nexuscorp.io',
                'createdAt' => '2026-03-01T10:00:00.000Z'
            ]
        ];
        file_put_contents(USERS_FILE_PATH, json_encode($defaultUsers, JSON_PRETTY_PRINT));
        return $defaultUsers;
    }

    $json = file_get_contents(USERS_FILE_PATH);
    $data = json_decode($json, true);
    return is_array($data) ? $data : [];
}

/**
 * Save user to registered users list
 */
function saveRegisteredUser($user) {
    $users = getRegisteredUsers();
    $email = strtolower(trim($user['email']));

    // Check if already exists
    foreach ($users as &$u) {
        if (strtolower($u['email']) === $email) {
            $u = array_merge($u, $user);
            file_put_contents(USERS_FILE_PATH, json_encode($users, JSON_PRETTY_PRINT));
            return;
        }
    }

    array_unshift($users, $user);
    file_put_contents(USERS_FILE_PATH, json_encode($users, JSON_PRETTY_PRINT));
}

/**
 * Helper to output JSON response
 */
function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}
