<?php
/**
 * Vector Security Illustration Component (matches React IllustrationLeft)
 */
function renderSecurityIllustration($companyName = '') {
?>
<div class="illustration-container position-relative d-flex flex-column align-items-center justify-content-center p-4 p-lg-5 user-select-none overflow-hidden h-100 w-100">
    <!-- Ambient background glow accents -->
    <div class="ambient-glow glow-top"></div>
    <div class="ambient-glow glow-bottom"></div>

    <!-- Main SVG Vector Artwork -->
    <svg viewBox="0 0 540 500" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-100 illustration-svg">
        <!-- Soft background botanical leaves -->
        <path d="M60 380 C 40 320, 20 280, 50 260 C 70 245, 95 285, 85 360 Z" fill="#DBEAFE" opacity="0.85" />
        <path d="M45 400 L75 290" stroke="#93C5FD" stroke-width="2.5" stroke-linecap="round" />
        <path d="M65 330 L85 320" stroke="#93C5FD" stroke-width="2" stroke-linecap="round" />
        <path d="M55 365 L40 355" stroke="#93C5FD" stroke-width="2" stroke-linecap="round" />

        <!-- Top dashed security dots card -->
        <rect x="105" y="42" width="135" height="46" rx="6" stroke="#2563EB" stroke-width="2" stroke-dasharray="4 4" fill="#FFFFFF" />
        <!-- Passcode dots inside card -->
        <circle cx="123" cy="65" r="4.5" fill="#BFDBFE" />
        <circle cx="141" cy="65" r="4.5" fill="#BFDBFE" />
        <circle cx="159" cy="65" r="4.5" fill="#BFDBFE" />
        <circle cx="177" cy="65" r="4.5" fill="#BFDBFE" />
        <circle cx="195" cy="65" r="4.5" fill="#BFDBFE" />
        <circle cx="213" cy="65" r="4.5" fill="#BFDBFE" />

        <!-- Dashed curved orbit lines connecting security elements -->
        <path d="M90 120 C 75 160, 80 200, 95 230" stroke="#2563EB" stroke-width="1.8" stroke-dasharray="4 4" stroke-linecap="round" />
        <path d="M215 170 C 230 135, 275 110, 315 130 C 345 145, 355 180, 345 220" stroke="#2563EB" stroke-width="1.8" stroke-dasharray="4 4" stroke-linecap="round" />

        <!-- Floating circular Key icon badge -->
        <g transform="translate(285, 115)">
            <circle cx="18" cy="18" r="22" fill="#FFFFFF" stroke="#93C5FD" stroke-width="1.5" />
            <circle cx="24" cy="12" r="5" stroke="#0B63F6" stroke-width="2.5" />
            <path d="M20 16 L12 24 L14 26 M14 22 L16 24" stroke="#0B63F6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        </g>

        <!-- Floating Cog / Gear element -->
        <g transform="translate(198, 125)">
            <path d="M25 5 L30 5 L31 10 L36 12 L40 8 L44 12 L40 16 L42 21 L47 22 L47 28 L42 29 L40 34 L44 38 L40 42 L36 38 L31 40 L30 45 L25 45 L24 40 L19 38 L15 42 L11 38 L15 34 L13 29 L8 28 L8 22 L13 21 L15 16 L11 12 L15 8 L19 12 L24 10 Z" fill="#0B63F6" />
            <circle cx="27.5" cy="25" r="8" fill="#FFFFFF" />
        </g>
        <g transform="translate(240, 142)">
            <path d="M22 6 L26 6 L27 10 L31 11 L34 8 L37 11 L34 14 L35 18 L39 19 L39 23 L35 24 L34 28 L37 31 L34 34 L31 31 L27 32 L26 36 L22 36 L21 32 L17 31 L14 34 L11 31 L14 28 L13 24 L9 23 L9 19 L13 18 L14 14 L11 11 L14 8 L17 11 L21 10 Z" fill="#DBEAFE" stroke="#2563EB" stroke-width="1.5" />
            <circle cx="24" cy="21" r="6" fill="#FFFFFF" />
        </g>

        <!-- Human Figure on Left -->
        <!-- Head & Hair -->
        <circle cx="140" cy="155" r="14" fill="#FFFFFF" stroke="#0B63F6" stroke-width="2.5" />
        <path d="M130 152 C 132 142, 144 140, 150 144 C 153 146, 154 153, 149 156 C 145 158, 137 159, 130 152 Z" fill="#0B63F6" />
        <!-- Neck -->
        <rect x="137" y="168" width="6" height="8" fill="#FFFFFF" stroke="#0B63F6" stroke-width="2" />

        <!-- Blue Torso / Sweater -->
        <path d="M112 182 C 120 174, 160 174, 168 182 C 178 194, 185 240, 172 260 C 160 262, 120 262, 108 260 C 95 240, 102 194, 112 182 Z" fill="#0B63F6" />

        <!-- Left arm & hand -->
        <path d="M110 188 C 100 215, 96 235, 100 258 C 103 270, 116 280, 126 270 C 122 255, 122 235, 122 225" fill="#0B63F6" />
        <path d="M110 260 C 114 274, 124 286, 126 278 C 128 270, 122 258, 118 254" fill="#FFFFFF" stroke="#0B63F6" stroke-width="2" />
        <line x1="116" y1="264" x2="120" y2="276" stroke="#0B63F6" stroke-width="1.5" />
        <line x1="120" y1="264" x2="123" y2="274" stroke="#0B63F6" stroke-width="1.5" />

        <!-- White Trousers / Legs -->
        <path d="M115 260 L115 385 C 115 390, 128 390, 128 385 L137 285 L145 385 C 145 390, 158 390, 158 385 L158 260 Z" fill="#FFFFFF" stroke="#0B63F6" stroke-width="2.5" />
        <line x1="121" y1="285" x2="121" y2="380" stroke="#0B63F6" stroke-width="1.5" />
        <line x1="151" y1="285" x2="151" y2="380" stroke="#0B63F6" stroke-width="1.5" />

        <!-- Feet / Shoes -->
        <path d="M114 385 L129 385 L132 396 L110 396 Z" fill="#0B63F6" />
        <path d="M144 385 L159 385 L162 396 L140 396 Z" fill="#0B63F6" />

        <!-- Central Big Login Screen Card -->
        <g id="screen-card">
            <rect x="160" y="195" width="190" height="195" rx="4" fill="#D9EAFD" />
            <rect x="195" y="186" width="16" height="10" rx="1" fill="#FFFFFF" stroke="#0B63F6" stroke-width="1.5" />
            <line x1="200" y1="188" x2="200" y2="194" stroke="#0B63F6" stroke-width="1" />
            <line x1="205" y1="188" x2="205" y2="194" stroke="#0B63F6" stroke-width="1" />

            <rect x="185" y="230" width="140" height="20" rx="3" fill="#FFFFFF" />
            <rect x="185" y="260" width="140" height="20" rx="3" fill="#FFFFFF" />
            <rect x="185" y="290" width="140" height="20" rx="3" fill="#FFFFFF" />

            <rect x="210" y="335" width="85" height="22" rx="3" fill="#0B63F6" />
            <?php if (!empty($companyName)): ?>
                <text x="252" y="350" fill="#FFFFFF" font-size="9" font-weight="bold" text-anchor="middle">
                    <?= htmlspecialchars(strtoupper(substr($companyName, 0, 10))) ?>
                </text>
            <?php else: ?>
                <line x1="225" y1="346" x2="280" y2="346" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" />
            <?php endif; ?>
        </g>

        <!-- Security Plant in Pot on Foreground Right -->
        <g transform="translate(300, 240)">
            <line x1="42" y1="130" x2="42" y2="70" stroke="#0B63F6" stroke-width="2.5" />
            <circle cx="42" cy="50" r="28" fill="#FFFFFF" stroke="#0B63F6" stroke-width="2.5" />
            <circle cx="42" cy="50" r="23" stroke="#93C5FD" stroke-width="1.5" />

            <!-- Lock icon inside circle -->
            <path d="M36 46 L36 42 C 36 38.7 38.7 36 42 36 C 45.3 36 48 38.7 48 42 L48 46 Z" stroke="#0B63F6" stroke-width="2.5" fill="none" />
            <rect x="33" y="46" width="18" height="15" rx="3" fill="#0B63F6" />
            <circle cx="42" cy="52" r="2" fill="#FFFFFF" />
            <line x1="42" y1="53" x2="42" y2="57" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" />

            <!-- Leaves -->
            <path d="M42 110 C 30 100, 15 105, 18 118 C 22 125, 36 122, 42 110 Z" fill="#0B63F6" />
            <path d="M42 110 C 54 100, 69 105, 66 118 C 62 125, 48 122, 42 110 Z" fill="#0B63F6" />

            <!-- Pot -->
            <path d="M12 125 L72 125 L72 135 L12 135 Z" fill="#FFFFFF" stroke="#0B63F6" stroke-width="2.5" />
            <path d="M18 135 L24 175 L60 175 L66 135 Z" fill="#0B63F6" />
        </g>

        <!-- Baseline -->
        <line x1="80" y1="396" x2="420" y2="396" stroke="#93C5FD" stroke-width="2" stroke-linecap="round" />
    </svg>

    <!-- Policy reassurance below illustration -->
    <div class="mt-3 text-center px-3" style="max-width: 380px;">
        <span class="badge rounded-pill bg-light text-primary border border-primary-subtle py-2 px-3 fw-medium">
            <i class="bi bi-shield-check me-1"></i> Google Workspace Enterprise SSO
        </span>
        <p class="mt-2 text-muted small lh-sm mb-0">
            Access is strictly reserved for verified company domains. Personal email providers are automatically blocked.
        </p>
    </div>
</div>
<?php
}
