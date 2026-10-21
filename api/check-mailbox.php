<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../includes/validator.php';
require_once __DIR__ . '/../includes/smtp.php';

// Support GET query or POST JSON/form-urlencoded
$email = $_GET['email'] ?? '';
if (empty($email)) {
    $rawInput = file_get_contents('php://input');
    if ($rawInput) {
        $json = json_decode($rawInput, true);
        if (isset($json['email'])) {
            $email = $json['email'];
        }
    }
}
if (empty($email) && isset($_POST['email'])) {
    $email = $_POST['email'];
}

$email = strtolower(trim($email));

if (empty($email) || !str_contains($email, '@')) {
    sendJsonResponse(['valid' => false, 'reason' => 'Valid email is required'], 400);
}

$result = checkMailboxExists($email);
sendJsonResponse($result, 200);
