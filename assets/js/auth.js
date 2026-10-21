/**
 * Enterprise Workspace Portal - Client-Side Auth & Real-Time Verification
 */
document.addEventListener('DOMContentLoaded', function () {
    const FREE_DOMAINS = new Set([
        'gmail.com', 'googlemail.com', 'yahoo.com', 'ymail.com', 'rocketmail.com',
        'hotmail.com', 'outlook.com', 'live.com', 'msn.com', 'icloud.com', 'me.com',
        'mac.com', 'aol.com', 'aim.com', 'mail.com', 'email.com', 'zoho.com',
        'zohomail.com', 'proton.me', 'protonmail.com', 'protonmail.ch', 'gmx.com',
        'gmx.net', 'gmx.de', 'yandex.com', 'yandex.ru', 'fastmail.com', 'tutanota.com',
        'tutamail.com', 'tuta.io', 'inbox.com', 'lycos.com', 'rediffmail.com', 'web.de'
    ]);

    const BLOCKED_DOMAINS = new Set([
        'tsdsolution.com', 'newwavetech.ai', 'bikay.asia', 'bizsolution.com.kh',
        'mangobyte.com.kh', 'dotfusion.com', 'closo.asia', 'blue.com.kh',
        'kdigitalsolutions.com', 'odoo.com', 'cuscen.com'
    ]);

    // DOM Elements
    const authForm = document.getElementById('authForm');
    const nameGroup = document.getElementById('nameGroup');
    const nameInput = document.getElementById('nameInput');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const togglePasswordBtn = document.getElementById('togglePasswordBtn');
    const togglePasswordIcon = document.getElementById('togglePasswordIcon');
    const strengthContainer = document.getElementById('strengthContainer');
    const strengthLabel = document.getElementById('strengthLabel');
    const strengthSegments = document.querySelectorAll('.strength-segment');
    const signinExtras = document.getElementById('signinExtras');
    const globalError = document.getElementById('globalError');
    const errorText = document.getElementById('errorText');
    const emailStatusIcon = document.getElementById('emailStatusIcon');
    const emailFeedbackContainer = document.getElementById('emailFeedbackContainer');
    const typoHintContainer = document.getElementById('typoHintContainer');
    const authTitle = document.getElementById('authTitle');
    const authSubtitle = document.getElementById('authSubtitle');
    const primarySubmitBtn = document.getElementById('primarySubmitBtn');
    const secondaryToggleBtn = document.getElementById('secondaryToggleBtn');
    const successScreen = document.getElementById('successScreen');
    const authCardBody = document.getElementById('authCardBody');

    let currentMode = 'signup'; // 'signup' | 'signin'
    let isSubmitting = false;
    let mailboxCheckTimer = null;
    let lastCheckedEmail = '';
    let mailboxValidState = null; // null | true | false

    // Switch between Signup and Signin
    function setMode(mode) {
        currentMode = mode;
        clearGlobalError();

        if (mode === 'signup') {
            authTitle.textContent = 'Welcome!';
            authSubtitle.textContent = 'Create your enterprise account with company Google Workspace.';
            nameGroup.classList.remove('d-none');
            nameInput.setAttribute('required', 'required');
            strengthContainer.classList.remove('d-none');
            signinExtras.classList.add('d-none');
            primarySubmitBtn.textContent = 'Create account';
            secondaryToggleBtn.textContent = 'Sign in';
        } else {
            authTitle.textContent = 'Welcome back!';
            authSubtitle.textContent = 'Sign in to access your company dashboard.';
            nameGroup.classList.add('d-none');
            nameInput.removeAttribute('required');
            strengthContainer.classList.add('d-none');
            signinExtras.classList.remove('d-none');
            primarySubmitBtn.textContent = 'Sign in';
            secondaryToggleBtn.textContent = 'Create account';
        }
    }

    if (secondaryToggleBtn) {
        secondaryToggleBtn.addEventListener('click', function () {
            setMode(currentMode === 'signup' ? 'signin' : 'signup');
        });
    }

    // Toggle Password Visibility
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', function () {
            const isPassword = passwordInput.getAttribute('type') === 'password';
            passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
            togglePasswordIcon.className = isPassword ? 'bi bi-eye-slash' : 'bi bi-eye';
        });
    }

    // Calculate Password Strength
    function calculateStrength(pwd) {
        if (!pwd) return { score: 0, label: 'Too weak' };
        let score = 0;
        if (pwd.length >= 8) score += 1;
        if (pwd.length >= 12) score += 1;
        if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
        if (/[0-9]/.test(pwd)) score += 0.5;
        if (/[^A-Za-z0-9]/.test(pwd)) score += 0.5;

        const rounded = Math.min(4, Math.floor(score));
        const labels = ['Too weak', 'Weak', 'Medium', 'Strong', 'Enterprise'];
        return { score: rounded, label: labels[rounded] };
    }

    passwordInput.addEventListener('input', function () {
        const str = calculateStrength(this.value);
        if (strengthLabel) {
            strengthLabel.textContent = str.label;
        }
        strengthSegments.forEach((seg, idx) => {
            if (this.value.length > 0 && str.score >= idx + 1) {
                seg.classList.add('active');
            } else {
                seg.classList.remove('active');
            }
        });
    });

    // Detect Fake User Patterns
    function isLikelyFake(str) {
        if (!str) return false;
        const lp = str.toLowerCase().trim();
        if (/^(random|fake|test|temp|dummy|sample|testing|mock|trash|nobody|asdf|qwerty|xyz|nonexistent|user\d|test\d)/.test(lp)) return true;
        if (/random|fakeuser|fakemail|testmail|noreal|notreal|invalid|unknown|placeholder/.test(lp)) return true;
        if (/\d{3,}$/.test(lp)) return true;
        if (/^\d+$/.test(lp) || (lp.replace(/\D/g, '').length > 4 && lp.length < 10)) return true;
        if (/(.)\1{4,}/.test(lp)) return true;
        return false;
    }

    // Check blocked domain list
    function isDomainBlocked(dom) {
        if (!dom) return false;
        const d = dom.toLowerCase().trim();
        if (BLOCKED_DOMAINS.has(d)) return true;
        for (const b of BLOCKED_DOMAINS) {
            if (d.endsWith('.' + b)) return true;
        }
        return false;
    }

    // Detect local part typo (e.g. saless -> sales)
    function detectLocalTypo(email) {
        const parts = email.split('@');
        const local = (parts[0] || '').toLowerCase();
        const typos = {
            'saless': 'sales',
            'supportt': 'support',
            'adminn': 'admin',
            'infoo': 'info',
            'contactt': 'contact'
        };
        return typos[local] || null;
    }

    // Show Global Error
    function showGlobalError(msg) {
        if (!globalError) return;
        errorText.textContent = msg;
        globalError.classList.remove('d-none');
    }

    function clearGlobalError() {
        if (!globalError) return;
        globalError.classList.add('d-none');
        errorText.textContent = '';
    }

    // Live Email Validation Handler
    function handleEmailInput() {
        clearGlobalError();
        const email = emailInput.value.trim().toLowerCase();

        if (!email || !email.includes('@')) {
            emailFeedbackContainer.innerHTML = '';
            typoHintContainer.innerHTML = '';
            emailStatusIcon.innerHTML = '';
            emailInput.classList.remove('is-invalid-domain', 'is-valid-domain');
            mailboxValidState = null;
            return;
        }

        const [localPart, domain] = email.split('@');

        // Check Local Typo
        const typo = detectLocalTypo(email);
        if (typo && domain && !FREE_DOMAINS.has(domain)) {
            typoHintContainer.innerHTML = `
                <div class="p-2 rounded-3 bg-warning bg-opacity-25 border border-warning text-warning-emphasis small d-flex align-items-center justify-content-between mb-2">
                    <span><i class="bi bi-lightbulb me-1"></i> Typo hint: Did you mean <strong>${typo}@${domain}</strong>?</span>
                    <button type="button" class="btn btn-sm btn-link text-warning-emphasis fw-bold text-decoration-underline p-0 ms-2" id="fixTypoBtn">Auto-fix</button>
                </div>
            `;
            const fixBtn = document.getElementById('fixTypoBtn');
            if (fixBtn) {
                fixBtn.addEventListener('click', function () {
                    emailInput.value = `${typo}@${domain}`;
                    handleEmailInput();
                });
            }
        } else {
            typoHintContainer.innerHTML = '';
        }

        // 1. Block Free Domains (Gmail, Yahoo, etc.)
        if (domain && FREE_DOMAINS.has(domain)) {
            const isGmail = domain === 'gmail.com' || domain === 'googlemail.com';
            const msg = isGmail ? 'Free @gmail.com is not allowed!' : `Free @${domain} is not allowed!`;
            emailFeedbackContainer.innerHTML = `
                <div class="feedback-box feedback-danger">
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi bi-exclamation-circle-fill text-danger fs-6"></i>
                        <span class="fw-bold">${msg}</span>
                    </div>
                    <span class="feedback-pill-badge bg-danger bg-opacity-25 text-danger border border-danger">Not Allowed</span>
                </div>
            `;
            emailStatusIcon.innerHTML = '<i class="bi bi-exclamation-circle-fill text-danger"></i>';
            emailInput.classList.add('is-invalid-domain');
            emailInput.classList.remove('is-valid-domain');
            mailboxValidState = false;
            return;
        }

        // 2. Block Explicitly Blocked Corporate Domains
        if (isDomainBlocked(domain)) {
            emailFeedbackContainer.innerHTML = `
                <div class="feedback-box feedback-danger">
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi bi-exclamation-circle-fill text-danger fs-6"></i>
                        <span class="fw-bold">@${domain} is not allowed!</span>
                    </div>
                    <span class="feedback-pill-badge bg-danger bg-opacity-25 text-danger border border-danger">Not Allowed</span>
                </div>
            `;
            emailStatusIcon.innerHTML = '<i class="bi bi-exclamation-circle-fill text-danger"></i>';
            emailInput.classList.add('is-invalid-domain');
            emailInput.classList.remove('is-valid-domain');
            mailboxValidState = false;
            return;
        }

        // 3. Immediately Block Fake Users
        if (isLikelyFake(localPart)) {
            emailFeedbackContainer.innerHTML = `
                <div class="feedback-box feedback-danger">
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi bi-exclamation-circle-fill text-danger fs-6"></i>
                        <span class="fw-bold">Invalid: Mailbox does not exist on this server (Fake user).</span>
                    </div>
                    <span class="feedback-pill-badge bg-danger bg-opacity-25 text-danger border border-danger">Invalid</span>
                </div>
            `;
            emailStatusIcon.innerHTML = '<i class="bi bi-exclamation-circle-fill text-danger"></i>';
            emailInput.classList.add('is-invalid-domain');
            emailInput.classList.remove('is-valid-domain');
            mailboxValidState = false;
            return;
        }

        // If domain has no dot yet, don't ping DNS yet
        if (!domain || !domain.includes('.')) {
            emailFeedbackContainer.innerHTML = '';
            emailStatusIcon.innerHTML = '';
            emailInput.classList.remove('is-invalid-domain', 'is-valid-domain');
            return;
        }

        // Debounced Live Domain & Corporate Email Check
        clearTimeout(mailboxCheckTimer);
        emailFeedbackContainer.innerHTML = `
            <div class="feedback-box feedback-checking">
                <div class="d-flex align-items-center gap-2">
                    <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                    <span class="fw-medium">Verifying corporate domain...</span>
                </div>
            </div>
        `;
        emailStatusIcon.innerHTML = '<div class="spinner-border spinner-border-sm text-primary" role="status"></div>';

        mailboxCheckTimer = setTimeout(async function () {
            if (lastCheckedEmail === email && mailboxValidState !== null) return;
            lastCheckedEmail = email;

            try {
                const response = await fetch(`api/check-mailbox.php?email=${encodeURIComponent(email)}`);
                const data = await response.json();

                if (emailInput.value.trim().toLowerCase() !== email) return; // Stale query

                if (data.valid) {
                    mailboxValidState = true;
                    emailFeedbackContainer.innerHTML = `
                        <div class="feedback-box feedback-success">
                            <div class="d-flex align-items-center gap-2">
                                <i class="bi bi-check-circle-fill text-success fs-6"></i>
                                <span class="fw-bold">Valid: Corporate domain verified!</span>
                            </div>
                            <span class="feedback-pill-badge bg-success bg-opacity-25 text-success border border-success">Valid</span>
                        </div>
                    `;
                    emailStatusIcon.innerHTML = '<i class="bi bi-check-circle-fill text-success"></i>';
                    emailInput.classList.remove('is-invalid-domain');
                    emailInput.classList.add('is-valid-domain');
                } else {
                    mailboxValidState = false;
                    const reason = data.message || data.reason || 'Invalid: Mailbox does not exist on this server.';
                    emailFeedbackContainer.innerHTML = `
                        <div class="feedback-box feedback-danger">
                            <div class="d-flex align-items-center gap-2">
                                <i class="bi bi-exclamation-circle-fill text-danger fs-6"></i>
                                <span class="fw-bold">${reason}</span>
                            </div>
                            <span class="feedback-pill-badge bg-danger bg-opacity-25 text-danger border border-danger">Invalid</span>
                        </div>
                    `;
                    emailStatusIcon.innerHTML = '<i class="bi bi-exclamation-circle-fill text-danger"></i>';
                    emailInput.classList.add('is-invalid-domain');
                    emailInput.classList.remove('is-valid-domain');
                }
            } catch (err) {
                // Network error fallback
                emailFeedbackContainer.innerHTML = '';
                emailStatusIcon.innerHTML = '';
                emailInput.classList.remove('is-invalid-domain', 'is-valid-domain');
            }
        }, 400);
    }

    emailInput.addEventListener('input', handleEmailInput);

    // Form Submit Handler
    authForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        clearGlobalError();

        if (isSubmitting) return;

        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;
        const name = nameInput.value.trim();

        // 1. Pre-validation checks
        const [, domain] = email.split('@');
        if (!domain) {
            showGlobalError('Please enter a valid email address.');
            return;
        }

        if (FREE_DOMAINS.has(domain)) {
            showGlobalError(`Free email provider (@${domain}) is not allowed. Only company email is accepted.`);
            return;
        }

        if (isDomainBlocked(domain)) {
            showGlobalError(`Domain @${domain} is not allowed by organization policy.`);
            return;
        }

        if (isLikelyFake(email.split('@')[0])) {
            showGlobalError('Invalid: Mailbox does not exist on this server (Fake user).');
            return;
        }

        if (mailboxValidState === false) {
            showGlobalError('Invalid corporate email: Domain is not allowed or has no active mail servers.');
            return;
        }

        if (currentMode === 'signup') {
            if (!name) {
                showGlobalError('Please enter your full name.');
                return;
            }
            if (password.length < 8) {
                showGlobalError('Password must be at least 8 characters long.');
                return;
            }
        } else {
            if (!password) {
                showGlobalError('Please enter your password.');
                return;
            }
        }

        // Disable submit button and show spinner
        isSubmitting = true;
        const origBtnText = primarySubmitBtn.textContent;
        primarySubmitBtn.disabled = true;
        primarySubmitBtn.innerHTML = '<div class="spinner-border spinner-border-sm text-dark me-2" role="status"></div> Processing...';

        const endpoint = currentMode === 'signup' ? 'api/signup.php' : 'api/login.php';
        const payload = currentMode === 'signup' ? { name, email, password } : { email, password };

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok || data.error) {
                showGlobalError(data.error || 'Authentication failed. Please check your credentials.');
                isSubmitting = false;
                primarySubmitBtn.disabled = false;
                primarySubmitBtn.textContent = origBtnText;
                return;
            }

            // Show Success Transition Screen
            showSuccessScreen(data.user, currentMode);

        } catch (err) {
            showGlobalError('Server connection error. Please try again.');
            isSubmitting = false;
            primarySubmitBtn.disabled = false;
            primarySubmitBtn.textContent = origBtnText;
        }
    });

    // Render Success Screen with Countdown
    function showSuccessScreen(user, mode) {
        authCardBody.classList.add('d-none');
        successScreen.classList.remove('d-none');

        const successTitle = document.getElementById('successTitle');
        const successDesc = document.getElementById('successDesc');
        const successUserEmail = document.getElementById('successUserEmail');
        const successUserOrg = document.getElementById('successUserOrg');
        const successUserDomain = document.getElementById('successUserDomain');
        const countdownSpan = document.getElementById('countdownSpan');
        const enterWorkspaceBtn = document.getElementById('enterWorkspaceBtn');

        if (mode === 'signup') {
            successTitle.textContent = 'Account Created!';
            successDesc.textContent = `Welcome aboard, ${user.name}! Your enterprise account has been created.`;
        } else {
            successTitle.textContent = 'Signed In Successfully!';
            successDesc.textContent = `Welcome back, ${user.name}! Authenticated with your organization domain.`;
        }

        successUserEmail.textContent = user.email;
        successUserOrg.textContent = user.companyName;
        successUserDomain.textContent = user.domain;

        let seconds = 3;
        countdownSpan.textContent = seconds;

        const countdownInterval = setInterval(function () {
            seconds--;
            if (seconds <= 0) {
                clearInterval(countdownInterval);
                window.location.reload();
            } else {
                countdownSpan.textContent = seconds;
            }
        }, 1000);

        if (enterWorkspaceBtn) {
            enterWorkspaceBtn.addEventListener('click', function () {
                clearInterval(countdownInterval);
                window.location.reload();
            });
        }
    }
});
