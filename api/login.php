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

$rawInput = file_get_contents('php://input');
$body = json_decode($rawInput, true) ?: $_POST;

$email = strtolower(trim($body['email'] ?? ''));
$password = $body['password'] ?? '';

if (empty($email)) {
    sendJsonResponse(['error' => 'Email is required'], 400);
}

if (empty($password)) {
    sendJsonResponse(['error' => 'Password is required'], 400);
}

// 1. Corporate domain validation
$val = validateCorporateEmail($email);
if (!$val['isValid']) {
    sendJsonResponse(['error' => $val['error'] ?? 'Invalid corporate email'], 400);
}

$domain = $val['domain'];
$companyName = $val['companyName'] ?? formatCompanyNameFromDomain($domain);

// 2. Look up in registered users or authenticate for demo
$registeredUsers = getRegisteredUsers();
$foundUser = null;
foreach ($registeredUsers as $u) {
    if (strtolower($u['email']) === $email) {
        $foundUser = $u;
        break;
    }
}

if (!$foundUser) {
    // For corporate demo flexibility, if valid corporate email, provision member
    $foundUser = [
        'name' => 'Enterprise Member',
        'email' => $email,
        'companyName' => $companyName,
        'domain' => $domain,
        'createdAt' => date('c'),
    ];
    saveRegisteredUser($foundUser);
}

// Establish session
$_SESSION['current_user'] = $foundUser;

sendJsonResponse([
    'success' => true,
    'message' => 'Signed in successfully!',
    'user' => $foundUser
], 200);
