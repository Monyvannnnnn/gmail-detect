<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../includes/validator.php';
require_once __DIR__ . '/../includes/smtp.php';

// Parse POST input (JSON or form-data)
$rawInput = file_get_contents('php://input');
$body = json_decode($rawInput, true) ?: $_POST;

$name = trim($body['name'] ?? '');
$email = strtolower(trim($body['email'] ?? ''));
$password = $body['password'] ?? '';

if (empty($email)) {
    sendJsonResponse(['error' => 'Email is required'], 400);
}

if (empty($name)) {
    sendJsonResponse(['error' => 'Full name is required'], 400);
}

if (strlen($password) < 8) {
    sendJsonResponse(['error' => 'Password must be at least 8 characters long'], 400);
}

// 1. Corporate domain validation
$val = validateCorporateEmail($email);
if (!$val['isValid']) {
    sendJsonResponse(['error' => $val['error'] ?? 'Invalid corporate email'], 400);
}

$domain = $val['domain'];
$companyName = $val['companyName'] ?? formatCompanyNameFromDomain($domain);

// 2. Mailbox existence validation
$mailboxResult = checkMailboxExists($email);
if (!$mailboxResult['valid']) {
    sendJsonResponse([
        'error' => $mailboxResult['message'] ?? $mailboxResult['reason'] ?? 'Invalid corporate email.'
    ], 400);
}

// 3. Check if user already exists
$registeredUsers = getRegisteredUsers();
foreach ($registeredUsers as $existingUser) {
    if (strtolower($existingUser['email']) === $email) {
        sendJsonResponse([
            'error' => 'An account with this corporate email already exists. Please sign in instead.'
        ], 400);
    }
}

// 4. Save new user
$newUser = [
    'name' => $name,
    'email' => $email,
    'companyName' => $companyName,
    'domain' => $domain,
    'createdAt' => date('c'),
];

saveRegisteredUser($newUser);

// Establish session
$_SESSION['current_user'] = $newUser;

sendJsonResponse([
    'success' => true,
    'message' => 'Account created successfully!',
    'user' => $newUser
], 200);
