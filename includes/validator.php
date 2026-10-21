<?php
/**
 * Corporate Email & Domain Validation Utilities (PHP Implementation)
 * Specifically designed to enforce company Google Workspace / corporate domains
 * and strictly block free consumer email domains (e.g. @gmail.com, @yahoo.com, etc.)
 */

// Popular free/consumer public email provider domains
const FREE_EMAIL_DOMAINS = [
    'gmail.com',
    'googlemail.com',
    'yahoo.com',
    'ymail.com',
    'rocketmail.com',
    'hotmail.com',
    'outlook.com',
    'live.com',
    'msn.com',
    'icloud.com',
    'me.com',
    'mac.com',
    'aol.com',
    'aim.com',
    'mail.com',
    'email.com',
    'zoho.com',
    'zohomail.com',
    'proton.me',
    'protonmail.com',
    'protonmail.ch',
    'gmx.com',
    'gmx.net',
    'gmx.de',
    'yandex.com',
    'yandex.ru',
    'fastmail.com',
    'tutanota.com',
    'tutamail.com',
    'tuta.io',
    'inbox.com',
    'lycos.com',
    'rediffmail.com',
    'web.de'
];

// Explicitly blocked domains by organizational policy
const BLOCKED_DOMAINS = [
    'tsdsolution.com',
    'newwavetech.ai',
    'bikay.asia',
    'bizsolution.com.kh',
    'mangobyte.com.kh',
    'dotfusion.com',
    'closo.asia',
    'blue.com.kh',
    'kdigitalsolutions.com',
    'odoo.com',
    'cuscen.com'
];

/**
 * Check if domain is in the organization blocked list
 */
function isBlockedDomain(string $domain): bool {
    if (empty($domain)) {
        return false;
    }
    $d = strtolower(trim($domain));
    if (in_array($d, BLOCKED_DOMAINS, true)) {
        return true;
    }
    foreach (BLOCKED_DOMAINS as $blocked) {
        if (str_ends_with($d, '.' . $blocked)) {
            return true;
        }
    }
    return false;
}

/**
 * Detect fake / test / random email user patterns
 */
function isLikelyFakeUsername(string $localPart): bool {
    if (empty($localPart)) {
        return false;
    }
    $lp = strtolower(trim($localPart));

    // 1. Explicit fake/test/random prefix or keywords
    if (preg_match('/^(random|fake|test|temp|dummy|sample|testing|mock|trash|nobody|asdf|qwerty|xyz|nonexistent|user\d|test\d)/i', $lp)) {
        return true;
    }

    // 2. Contains explicit fake/random terms
    if (preg_match('/random|fakeuser|fakemail|testmail|noreal|notreal|invalid|unknown|placeholder/i', $lp)) {
        return true;
    }

    // 3. Trailing random numbers (3 or more digits at end, e.g. randomtest99812, user12345, test998)
    if (preg_match('/\d{3,}$/', $lp)) {
        return true;
    }

    // 4. Pure digits or excessive numbers
    $onlyDigits = preg_replace('/\D/', '', $lp);
    if (preg_match('/^\d+$/', $lp) || (strlen($onlyDigits) > 4 && strlen($lp) < 10)) {
        return true;
    }

    // 5. Repeated characters (e.g. aaaaa, zzzzz)
    if (preg_match('/(.)\1{4,}/', $lp)) {
        return true;
    }

    return false;
}

/**
 * Extracts and cleans the domain from an email address
 */
function extractDomain(string $email): string {
    if (empty($email) || !str_contains($email, '@')) {
        return '';
    }
    $parts = explode('@', strtolower(trim($email)));
    return count($parts) > 1 ? trim($parts[1]) : '';
}

/**
 * Formats a raw domain like 'stripe.com' into a human-friendly Company Name
 */
function formatCompanyNameFromDomain(string $domain): string {
    if (empty($domain)) {
        return '';
    }
    $parts = explode('.', $domain);
    $mainPart = $parts[0] ?: $domain;
    $words = preg_split('/[-_.]/', $mainPart);
    $capitalized = array_map('ucfirst', $words);
    return implode(' ', $capitalized);
}

/**
 * Validates whether an email belongs to a corporate/company domain
 */
function validateCorporateEmail(string $email): array {
    $trimmed = strtolower(trim($email));

    if (empty($trimmed)) {
        return [
            'isValid' => false,
            'isFreeDomain' => false,
            'domain' => '',
            'error' => 'Please enter your corporate email address.'
        ];
    }

    if (!filter_var($trimmed, FILTER_VALIDATE_EMAIL)) {
        return [
            'isValid' => false,
            'isFreeDomain' => false,
            'domain' => extractDomain($trimmed),
            'error' => 'Please enter a valid email address format (e.g. name@company.com).'
        ];
    }

    $parts = explode('@', $trimmed);
    $localPart = $parts[0] ?? '';
    $domain = $parts[1] ?? '';

    // Check if username is a fake / test / random user
    if (isLikelyFakeUsername($localPart)) {
        return [
            'isValid' => false,
            'isFreeDomain' => false,
            'isFakeUser' => true,
            'domain' => $domain,
            'error' => 'Invalid: Mailbox does not exist on this server (Fake user).'
        ];
    }

    // Check if domain is in the list of explicitly blocked domains
    if (isBlockedDomain($domain)) {
        return [
            'isValid' => false,
            'isFreeDomain' => true,
            'isBlockedDomain' => true,
            'domain' => $domain,
            'error' => "@{$domain} is not allowed!",
            'suggestedAction' => 'Please use an authorized corporate email domain.'
        ];
    }

    // Check if domain is in the list of free consumer providers
    if (in_array($domain, FREE_EMAIL_DOMAINS, true)) {
        $isGmail = ($domain === 'gmail.com' || $domain === 'googlemail.com');
        return [
            'isValid' => false,
            'isFreeDomain' => true,
            'domain' => $domain,
            'error' => $isGmail
                ? 'Free consumer @gmail.com is not allowed. Only corporate Google Workspace / company domains are accepted.'
                : "Free public email provider (@{$domain}) is not allowed. Please use your official company domain.",
            'suggestedAction' => $isGmail
                ? 'Use your organization’s Google Workspace email (e.g. yourname@yourcompany.com).'
                : 'Enter your business or organization email address.'
        ];
    }

    // Valid company domain
    $companyName = formatCompanyNameFromDomain($domain);
    return [
        'isValid' => true,
        'isFreeDomain' => false,
        'domain' => $domain,
        'companyName' => $companyName
    ];
}

/**
 * Common domain typo detector
 */
function detectDomainTypo(string $domain): ?string {
    $d = strtolower(trim($domain));
    if (str_ends_with($d, '.cm') && !str_ends_with($d, '.com.cm')) {
        return preg_replace('/\.cm$/', '.com', $d);
    }
    if (str_ends_with($d, '.cmo')) {
        return preg_replace('/\.cmo$/', '.com', $d);
    }
    if ($d === 'gmal.com' || $d === 'gmaill.com' || $d === 'gmial.com') {
        return 'gmail.com';
    }
    if ($d === 'yaho.com' || $d === 'yahooo.com') {
        return 'yahoo.com';
    }
    if ($d === 'hotmial.com' || $d === 'hotmai.com') {
        return 'hotmail.com';
    }
    if ($d === 'outlok.com' || $d === 'outloo.com') {
        return 'outlook.com';
    }
    return null;
}

/**
 * Common local part typo detector (e.g. saless -> sales)
 */
function detectLocalPartTypo(string $email): ?string {
    $parts = explode('@', $email);
    $localPart = $parts[0] ?? '';
    if (empty($localPart)) {
        return null;
    }
    $l = strtolower($localPart);
    $commonTypos = [
        'saless' => 'sales',
        'supportt' => 'support',
        'adminn' => 'admin',
        'infoo' => 'info',
        'contactt' => 'contact'
    ];
    return $commonTypos[$l] ?? null;
}

/**
 * Calculate password strength score (0 to 4)
 */
function calculatePasswordStrength(string $password): array {
    if (empty($password)) {
        return ['score' => 0, 'label' => 'Too weak', 'feedback' => 'Enter at least 8 characters'];
    }

    $score = 0;
    if (strlen($password) >= 8) $score += 1;
    if (strlen($password) >= 12) $score += 1;
    if (preg_match('/[A-Z]/', $password) && preg_match('/[a-z]/', $password)) $score += 1;
    if (preg_match('/[0-9]/', $password)) $score += 0.5;
    if (preg_match('/[^A-Za-z0-9]/', $password)) $score += 0.5;

    $rounded = min(4, (int)floor($score));

    switch ($rounded) {
        case 1:
            return ['score' => 1, 'label' => 'Weak', 'feedback' => 'Add capital letters & numbers'];
        case 2:
            return ['score' => 2, 'label' => 'Medium', 'feedback' => 'Good, add special characters for security'];
        case 3:
            return ['score' => 3, 'label' => 'Strong', 'feedback' => 'Strong password'];
        case 4:
            return ['score' => 4, 'label' => 'Enterprise', 'feedback' => 'Meets enterprise security guidelines'];
        case 0:
        default:
            return ['score' => 0, 'label' => 'Too weak', 'feedback' => 'Must be at least 8 characters'];
    }
}
