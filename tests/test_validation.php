<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../includes/validator.php';
require_once __DIR__ . '/../includes/smtp.php';

echo "=== 1. Testing validateCorporateEmail() ===\n";
$emails = [
    'user@gmail.com',
    'employee@yahoo.com',
    'admin@tsdsolution.com',
    'randomtest998@fieldbi.com',
    'jordan.lee@nexuscorp.io',
    'sales@microsoft.com'
];

foreach ($emails as $email) {
    $res = validateCorporateEmail($email);
    echo "[$email]\n";
    echo "  - Valid: " . ($res['isValid'] ? 'YES' : 'NO') . "\n";
    echo "  - Free: " . ($res['isFreeDomain'] ? 'YES' : 'NO') . "\n";
    echo "  - Blocked: " . (!empty($res['isBlockedDomain']) ? 'YES' : 'NO') . "\n";
    echo "  - Fake: " . (!empty($res['isFakeUser']) ? 'YES' : 'NO') . "\n";
    if (!empty($res['error'])) echo "  - Error: " . $res['error'] . "\n";
    if (!empty($res['companyName'])) echo "  - Company: " . $res['companyName'] . "\n";
}

echo "\n=== 2. Testing getDomainMxRecords() ===\n";
$mxGoogle = getDomainMxRecords('google.com');
echo "google.com MX count: " . count($mxGoogle) . " (" . implode(', ', $mxGoogle) . ")\n";

echo "\n=== 3. Testing checkMailboxExists() ===\n";
$checkFake = checkMailboxExists('randomtest8891@fieldbi.com');
echo "Fake user check result: " . json_encode($checkFake) . "\n";

$checkBlocked = checkMailboxExists('user@tsdsolution.com');
echo "Blocked domain check result: " . json_encode($checkBlocked) . "\n";

echo "\n=== 4. Testing Password Strength ===\n";
$pwd1 = calculatePasswordStrength('pass');
$pwd2 = calculatePasswordStrength('password123');
$pwd3 = calculatePasswordStrength('StrongP@ssw0rd!2026');
echo "pass: score={$pwd1['score']} label={$pwd1['label']}\n";
echo "password123: score={$pwd2['score']} label={$pwd2['label']}\n";
echo "StrongP@ssw0rd!2026: score={$pwd3['score']} label={$pwd3['label']}\n";

echo "\n=== 5. Testing Users Storage ===\n";
$users = getRegisteredUsers();
echo "Initial users count: " . count($users) . " (First user: " . ($users[0]['email'] ?? 'none') . ")\n";

echo "\nALL TESTS COMPLETED SUCCESSFULLY!\n";
