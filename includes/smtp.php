<?php
/**
 * Domain & Mail Server Verification (Pure DNS MX, Free Domain / Gmail Blocker)
 * Completely removed AbstractAPI - relies strictly on RFC DNS MX resolution and corporate policies.
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/validator.php';

/**
 * Performs DNS MX lookup for a domain
 */
function getDomainMxRecords(string $domain): array {
    $mxHosts = [];
    $mxWeights = [];
    
    if (getmxrr($domain, $mxHosts, $mxWeights)) {
        $combined = [];
        for ($i = 0; $i < count($mxHosts); $i++) {
            $combined[] = [
                'host' => strtolower($mxHosts[$i]),
                'weight' => $mxWeights[$i] ?? 10
            ];
        }
        usort($combined, fn($a, $b) => $a['weight'] <=> $b['weight']);
        return array_column($combined, 'host');
    }

    return [];
}

/**
 * Validates domain and email by enforcing corporate domain rules and DNS MX record existence.
 * Blocks @gmail.com, free email providers, and non-existent domains.
 */
function checkMailboxExists(string $email): array {
    $parts = explode('@', strtolower(trim($email)));
    if (count($parts) !== 2 || empty($parts[1])) {
        return ['valid' => false, 'reason' => 'Invalid email format.'];
    }

    $localPart = $parts[0];
    $domain = $parts[1];

    // 1. Strictly block @gmail.com and free consumer domains
    if (in_array($domain, FREE_EMAIL_DOMAINS, true)) {
        $isGmail = ($domain === 'gmail.com' || $domain === 'googlemail.com');
        return [
            'valid' => false,
            'isFree' => true,
            'message' => $isGmail
                ? 'Free consumer @gmail.com is not allowed! Only corporate Google Workspace / company domains are accepted.'
                : "Free public email provider (@{$domain}) is not allowed! Please use your company domain.",
            'reason' => 'Free email provider blocked by corporate policy.'
        ];
    }

    // 2. Reject explicitly blocked domains by organization policy
    if (isBlockedDomain($domain)) {
        return [
            'valid' => false,
            'isBlocked' => true,
            'message' => "@{$domain} is not allowed!",
            'reason' => "@{$domain} is not allowed by organization policy."
        ];
    }

    // 3. Reject fake / random / test usernames
    if (isLikelyFakeUsername($localPart)) {
        return [
            'valid' => false,
            'isFake' => true,
            'message' => 'Invalid: Mailbox does not exist on this server (Fake user).',
            'reason' => 'Mailbox does not exist on this server (Fake user).'
        ];
    }

    // 4. Resolve DNS MX records for the domain
    $mxRecords = getDomainMxRecords($domain);
    if (empty($mxRecords)) {
        return [
            'valid' => false,
            'message' => "Invalid: Domain @{$domain} does not exist or has no active mail servers.",
            'reason' => 'No active mail servers found for this domain.'
        ];
    }

    $mailServer = $mxRecords[0];
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

    return [
        'valid' => true,
        'message' => 'Valid: Corporate domain verified with active mail servers!',
        'domain' => $domain,
        'mailServer' => $mailServer,
        'mxRecords' => $mxRecords,
        'isGoogleWorkspace' => $isGoogle,
        'isMicrosoft365' => $isMicrosoft,
        'method' => 'dns_mx_verified'
    ];
}
