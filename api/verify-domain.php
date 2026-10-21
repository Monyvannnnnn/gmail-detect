<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../includes/validator.php';
require_once __DIR__ . '/../includes/smtp.php';

$domain = strtolower(trim($_GET['domain'] ?? ''));

if (empty($domain)) {
    sendJsonResponse(['error' => 'Domain is required'], 400);
}

try {
    $mxRecords = getDomainMxRecords($domain);
    $hasMx = !empty($mxRecords);

    $isGoogle = false;
    $isMicrosoft = false;

    foreach ($mxRecords as $mx) {
        $mxLower = strtolower($mx);
        if (str_contains($mxLower, 'google.com') || str_contains($mxLower, 'googlemail.com') || str_contains($mxLower, 'aspmx')) {
            $isGoogle = true;
        }
        if (str_contains($mxLower, 'outlook.com') || str_contains($mxLower, 'microsoft')) {
            $isMicrosoft = true;
        }
    }

    if ($hasMx) {
        sendJsonResponse([
            'domain' => $domain,
            'hasMx' => true,
            'mxRecords' => $mxRecords,
            'isGoogleWorkspace' => $isGoogle,
            'isMicrosoft365' => $isMicrosoft,
            'status' => 'OK'
        ]);
    } else {
        sendJsonResponse([
            'domain' => $domain,
            'hasMx' => false,
            'mxRecords' => [],
            'isGoogleWorkspace' => false,
            'isMicrosoft365' => false,
            'status' => 'NOT_FOUND',
            'suggestedDomain' => detectDomainTypo($domain)
        ]);
    }
} catch (Throwable $e) {
    sendJsonResponse(['error' => $e->getMessage()], 500);
}
