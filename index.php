<?php
/**
 * Main Entry Point (Raw PHP & Bootstrap 5)
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/illustration.php';

// If already authenticated, display dashboard
if (isset($_SESSION['current_user'])) {
    require __DIR__ . '/dashboard.php';
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enterprise Workspace Portal - Sign In / Sign Up</title>
    <!-- Google Fonts: Plus Jakarta Sans -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <!-- Custom CSS -->
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>

    <div class="min-vh-100 d-flex align-items-center justify-content-center p-3 p-sm-4 p-md-5">
        <main class="w-100 auth-split-card" style="max-width: 1040px;">
            <div class="row g-0 h-100">
                <!-- Left Column: Security Vector Illustration (Desktop / Large screen) -->
                <div class="col-12 col-lg-6 auth-illustration-col d-none d-lg-flex flex-column align-items-center justify-content-center">
                    <?php renderSecurityIllustration(); ?>
                </div>

                <!-- Right Column: Royal Blue Auth Form -->
                <div class="col-12 col-lg-6 auth-form-col p-4 p-sm-5 d-flex flex-column justify-content-between position-relative">
                    <!-- Glow effects -->
                    <div class="auth-form-glow-1"></div>
                    <div class="auth-form-glow-2"></div>

                    <!-- Auth Form Body -->
                    <div id="authCardBody" class="position-relative my-auto w-100" style="z-index: 10; max-width: 440px; margin: auto;">
                        <!-- Mobile-only Enterprise Badge -->
                        <div class="d-inline-flex align-items-center gap-1 px-3 py-1 rounded-pill bg-white bg-opacity-15 text-light small mb-3 border border-white border-opacity-25 d-lg-none">
                            <i class="bi bi-shield-check text-light"></i>
                            <span style="font-size: 0.75rem;">Google Workspace SSO Protected</span>
                        </div>

                        <!-- Header Title -->
                        <div class="mb-4">
                            <h1 id="authTitle" class="display-6 fw-extrabold text-white tracking-tight mb-1">
                                Welcome!
                            </h1>
                            <p id="authSubtitle" class="text-white-50 small mb-0">
                                Create your enterprise account with company Google Workspace.
                            </p>
                        </div>

                        <!-- Global Error Banner -->
                        <div id="globalError" class="alert alert-danger d-none py-2 px-3 rounded-4 small d-flex align-items-start gap-2 mb-3" role="alert">
                            <i class="bi bi-exclamation-triangle-fill text-danger flex-shrink-0 mt-0.5"></i>
                            <div id="errorText" class="lh-sm"></div>
                        </div>

                        <!-- Form Inputs -->
                        <form id="authForm" novalidate autocomplete="off">
                            <!-- 1. Name Input (Sign up mode) -->
                            <div class="mb-3" id="nameGroup">
                                <label for="nameInput" class="visually-hidden">Your name</label>
                                <div class="corp-input-group">
                                    <span class="corp-input-icon"><i class="bi bi-person"></i></span>
                                    <input type="text" class="corp-pill-input" id="nameInput" placeholder="Your name" autocomplete="name" required>
                                </div>
                            </div>

                            <!-- 2. Email Input -->
                            <div class="mb-3">
                                <label for="emailInput" class="visually-hidden">Your corporate e-mail</label>
                                <div class="corp-input-group">
                                    <span class="corp-input-icon"><i class="bi bi-envelope"></i></span>
                                    <input type="email" class="corp-pill-input" id="emailInput" placeholder="Your corporate e-mail" autocomplete="email" required>
                                    <span class="corp-input-status" id="emailStatusIcon"></span>
                                </div>

                                <!-- Typo Hint Box -->
                                <div id="typoHintContainer" class="mt-2"></div>

                                <!-- Real-time Feedback Alert Notification -->
                                <div id="emailFeedbackContainer" class="mt-2"></div>
                            </div>

                            <!-- 3. Password Input -->
                            <div class="mb-3">
                                <label for="passwordInput" class="visually-hidden">Password</label>
                                <div class="corp-input-group">
                                    <span class="corp-input-icon"><i class="bi bi-lock"></i></span>
                                    <input type="password" class="corp-pill-input" id="passwordInput" placeholder="Create password" autocomplete="new-password" required>
                                    <button type="button" class="corp-input-toggle" id="togglePasswordBtn" aria-label="Toggle password visibility">
                                        <i class="bi bi-eye" id="togglePasswordIcon"></i>
                                    </button>
                                </div>
                            </div>

                            <!-- Password Strength Indicator -->
                            <div class="mb-3 pt-1" id="strengthContainer">
                                <div class="d-flex justify-content-between text-white-50 small mb-1 px-1">
                                    <span class="text-white small fw-medium">Password strength</span>
                                    <span id="strengthLabel" class="text-white-50 fw-semibold" style="font-size: 0.75rem;">Too weak</span>
                                </div>
                                <div class="strength-bar-container">
                                    <div class="strength-segment"></div>
                                    <div class="strength-segment"></div>
                                    <div class="strength-segment"></div>
                                    <div class="strength-segment"></div>
                                </div>
                            </div>

                            <!-- Sign In Extras: Remember Me & Forgot Password -->
                            <div id="signinExtras" class="d-none d-flex justify-content-between align-items-center text-white-50 small mb-3 px-1">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="rememberMeCheckbox" checked>
                                    <label class="form-check-label text-white small" for="rememberMeCheckbox">
                                        Remember me
                                    </label>
                                </div>
                                <a href="#" onclick="alert('Password reset instructions will be dispatched to your corporate administrator.'); return false;" class="text-white-50 text-decoration-underline small">Forgot password?</a>
                            </div>

                            <!-- Action Buttons Pair -->
                            <div class="d-flex gap-2 pt-2">
                                <button type="submit" id="primarySubmitBtn" class="btn btn-corp-amber flex-grow-1">
                                    Create account
                                </button>
                                <button type="button" id="secondaryToggleBtn" class="btn btn-corp-outline-white flex-grow-1">
                                    Sign in
                                </button>
                            </div>
                        </form>
                    </div>

                    <!-- Success Screen Card (Triggered on valid auth) -->
                    <div id="successScreen" class="d-none success-screen-card position-relative p-4 p-sm-5 my-auto w-100" style="z-index: 10; max-width: 440px; margin: auto;">
                        <!-- Animated badge -->
                        <div class="mb-4">
                            <div class="pulse-badge d-inline-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-25 p-3 border border-success border-opacity-50">
                                <div class="rounded-circle bg-success text-white d-flex align-items-center justify-content-center" style="width: 54px; height: 54px;">
                                    <i class="bi bi-check-lg fs-2"></i>
                                </div>
                            </div>
                        </div>

                        <h2 id="successTitle" class="fw-bold text-white mb-2">Account Created!</h2>
                        <p id="successDesc" class="text-white-50 small mb-4">
                            Welcome aboard! Your enterprise account has been created.
                        </p>

                        <!-- Verification details summary -->
                        <div class="w-100 p-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-4 text-start mb-4 small">
                            <div class="d-flex justify-content-between py-1.5 border-bottom border-white border-opacity-15">
                                <span class="text-white-50">Email:</span>
                                <span id="successUserEmail" class="fw-semibold text-white font-monospace"></span>
                            </div>
                            <div class="d-flex justify-content-between py-1.5 border-bottom border-white border-opacity-15">
                                <span class="text-white-50">Organization:</span>
                                <span id="successUserOrg" class="fw-semibold text-white"></span>
                            </div>
                            <div class="d-flex justify-content-between py-1.5">
                                <span class="text-white-50">Domain Status:</span>
                                <span class="badge rounded-pill bg-success bg-opacity-25 text-success-emphasis border border-success border-opacity-50 fw-bold">
                                    <i class="bi bi-shield-check me-1"></i> Verified Google Workspace (@<span id="successUserDomain"></span>)
                                </span>
                            </div>
                        </div>

                        <!-- Enter button & countdown -->
                        <div class="w-100">
                            <button type="button" id="enterWorkspaceBtn" class="btn btn-corp-amber w-100 mb-3 d-flex align-items-center justify-content-center gap-2">
                                <span>Enter Workspace Now</span>
                                <i class="bi bi-arrow-right"></i>
                            </button>
                            <div class="text-white-50 small d-flex align-items-center justify-content-center gap-2">
                                <div class="spinner-border spinner-border-sm text-light" role="status"></div>
                                <span>Redirecting to dashboard in <span id="countdownSpan">3</span>s...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <!-- Bootstrap 5 JS Bundle -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <!-- Custom Auth Logic -->
    <script src="assets/js/auth.js"></script>
</body>
</html>
