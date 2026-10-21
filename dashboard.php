<?php
/**
 * Enterprise Dashboard View (Raw PHP & Bootstrap 5)
 */
require_once __DIR__ . '/config.php';

$user = $_SESSION['current_user'] ?? null;
if (!$user) {
    header('Location: index.php');
    exit;
}

$companyName = htmlspecialchars($user['companyName'] ?? 'Workspace');
$domain = htmlspecialchars($user['domain'] ?? 'company.com');
$email = htmlspecialchars($user['email'] ?? '');
$name = htmlspecialchars($user['name'] ?? 'Enterprise Member');
$firstLetter = strtoupper(substr($companyName, 0, 1));
$sessionId = 'auth_corp_' . substr(md5(session_id() . $email), 0, 8);

$colleagues = [
    ['name' => $name, 'email' => $email, 'role' => 'Workspace Administrator (You)', 'status' => 'Active'],
    ['name' => 'Marcus Vance', 'email' => "m.vance@{$domain}", 'role' => 'Security Architect', 'status' => 'Active'],
    ['name' => 'Elena Rostova', 'email' => "elena@{$domain}", 'role' => 'Lead DevOps', 'status' => 'Active'],
    ['name' => 'David Kim', 'email' => "dkim@{$domain}", 'role' => 'Engineering Manager', 'status' => 'Active'],
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $companyName ?> - Enterprise Workspace Portal</title>
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <!-- Custom CSS -->
    <link rel="stylesheet" href="assets/css/style.css">
    <style>
        .dashboard-header {
            background: #ffffff;
            border-bottom: 1px solid #e2e8f0;
        }
        .corp-avatar {
            width: 42px;
            height: 42px;
            background: var(--corp-blue);
            color: #ffffff;
            font-weight: 800;
            font-size: 1.15rem;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 0.75rem;
        }
        .hero-banner {
            background: linear-gradient(135deg, #0B63F6 0%, #1d4ed8 100%);
            border-radius: 1.25rem;
            color: #ffffff;
            box-shadow: 0 10px 25px -5px rgba(11, 99, 246, 0.25);
        }
        .info-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 1rem;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .info-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.05);
        }
        .icon-box {
            width: 40px;
            height: 40px;
            border-radius: 0.65rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
        }
        .user-colleague-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: #dbeafe;
            color: #0B63F6;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.9rem;
        }
    </style>
</head>
<body class="bg-light">

    <!-- Toast Notification -->
    <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 1080;">
        <div id="authSuccessToast" class="toast align-items-center text-bg-dark border-0 shadow-lg" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex p-2">
                <div class="toast-body d-flex align-items-center gap-2">
                    <span class="badge rounded-circle bg-success p-2"><i class="bi bi-check-lg"></i></span>
                    <div>
                        <div class="fw-bold text-white small">Authentication Successful</div>
                        <div class="text-light small">Welcome, <?= $name ?>! Session established.</div>
                    </div>
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    </div>

    <!-- Top Corporate Navbar -->
    <header class="dashboard-header sticky-top py-2 px-3 px-md-4">
        <div class="container-fluid d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center gap-3">
                <div class="corp-avatar shadow-sm"><?= $firstLetter ?></div>
                <div>
                    <div class="d-flex align-items-center gap-2 flex-wrap">
                        <span class="fw-bold text-dark fs-6"><?= $companyName ?></span>
                        <span class="badge rounded-pill bg-success-subtle text-success border border-success-subtle fw-semibold d-none d-sm-inline-block">
                            Verified Google Workspace
                        </span>
                    </div>
                    <div class="text-muted small font-monospace">@<?= $domain ?></div>
                </div>
            </div>

            <div class="d-flex align-items-center gap-3">
                <div class="d-none d-md-flex align-items-center gap-2 px-3 py-1 bg-light rounded-pill border small">
                    <span class="p-1 bg-success rounded-circle"></span>
                    <span class="fw-medium text-dark font-monospace"><?= $email ?></span>
                </div>
                <a href="api/logout.php" class="btn btn-outline-secondary btn-sm px-3 rounded-pill fw-semibold d-flex align-items-center gap-1.5">
                    <i class="bi bi-box-arrow-right"></i>
                    <span>Sign Out</span>
                </a>
            </div>
        </div>
    </header>

    <!-- Main Dashboard Container -->
    <main class="container my-4 my-md-5">
        <!-- Hero Banner -->
        <div class="hero-banner p-4 p-md-5 mb-4 position-relative overflow-hidden">
            <div class="position-relative" style="z-index: 2; max-width: 680px;">
                <span class="badge rounded-pill bg-white bg-opacity-20 text-white mb-3 px-3 py-2 fw-medium border border-white border-opacity-25">
                    <i class="bi bi-shield-check me-1"></i> Corporate Identity Authorized
                </span>
                <h1 class="fw-extrabold display-6 tracking-tight mb-2">
                    Welcome to <?= $companyName ?> Workspace
                </h1>
                <p class="text-blue-100 opacity-90 mb-4 lh-base">
                    Your account has been successfully verified via your organization’s enterprise domain (<strong>@<?= $domain ?></strong>). Public webmail domains (@gmail.com, etc.) are restricted by organizational security policy.
                </p>
                <div class="d-flex flex-wrap gap-2">
                    <button type="button" id="copyEmailBtn" class="btn btn-light rounded-pill px-4 fw-bold text-primary shadow-sm d-flex align-items-center gap-2">
                        <i class="bi bi-clipboard" id="copyIcon"></i>
                        <span id="copyText">Copy Work Email</span>
                    </button>
                    <a href="api/logout.php" class="btn btn-outline-light rounded-pill px-4 fw-medium d-flex align-items-center gap-2">
                        <i class="bi bi-arrow-repeat"></i>
                        <span>Switch Account / Test Sign Up</span>
                    </a>
                </div>
            </div>
        </div>

        <!-- 3 Info Cards Grid -->
        <div class="row g-3 g-md-4 mb-4">
            <!-- Card 1: Domain Verification -->
            <div class="col-12 col-md-4">
                <div class="info-card p-4 h-100">
                    <div class="d-flex align-items-center gap-3 mb-3">
                        <div class="icon-box bg-primary bg-opacity-10 text-primary">
                            <i class="bi bi-building"></i>
                        </div>
                        <div>
                            <h6 class="fw-bold mb-0 text-dark">Domain Verification</h6>
                            <span class="text-muted small">Google Workspace DNS</span>
                        </div>
                    </div>
                    <ul class="list-unstyled mb-0 small">
                        <li class="d-flex justify-content-between py-1.5 border-bottom">
                            <span class="text-muted">Domain:</span>
                            <span class="fw-semibold font-monospace">@<?= $domain ?></span>
                        </li>
                        <li class="d-flex justify-content-between py-1.5 border-bottom">
                            <span class="text-muted">Public @gmail:</span>
                            <span class="text-danger fw-bold">Restricted (403)</span>
                        </li>
                        <li class="d-flex justify-content-between py-1.5">
                            <span class="text-muted">MX Provider:</span>
                            <span class="text-success fw-bold">Google Workspace (Enterprise)</span>
                        </li>
                    </ul>
                </div>
            </div>

            <!-- Card 2: Security Invariants -->
            <div class="col-12 col-md-4">
                <div class="info-card p-4 h-100">
                    <div class="d-flex align-items-center gap-3 mb-3">
                        <div class="icon-box bg-warning bg-opacity-10 text-warning">
                            <i class="bi bi-shield-lock"></i>
                        </div>
                        <div>
                            <h6 class="fw-bold mb-0 text-dark">Security Invariants</h6>
                            <span class="text-muted small">Zero-Trust Directory</span>
                        </div>
                    </div>
                    <ul class="list-unstyled mb-0 small">
                        <li class="d-flex justify-content-between py-1.5 border-bottom">
                            <span class="text-muted">Authentication:</span>
                            <span class="fw-semibold">SAML 2.0 / OAuth</span>
                        </li>
                        <li class="d-flex justify-content-between py-1.5 border-bottom">
                            <span class="text-muted">Password Policy:</span>
                            <span class="fw-semibold">Min 8 chars, 4-tier check</span>
                        </li>
                        <li class="d-flex justify-content-between py-1.5">
                            <span class="text-muted">Session ID:</span>
                            <span class="font-monospace text-muted"><?= $sessionId ?></span>
                        </li>
                    </ul>
                </div>
            </div>

            <!-- Card 3: Directory Provisioning -->
            <div class="col-12 col-md-4">
                <div class="info-card p-4 h-100">
                    <div class="d-flex align-items-center gap-3 mb-3">
                        <div class="icon-box bg-info bg-opacity-10 text-info">
                            <i class="bi bi-people"></i>
                        </div>
                        <div>
                            <h6 class="fw-bold mb-0 text-dark">Directory Provisioning</h6>
                            <span class="text-muted small">Company Seat Allocation</span>
                        </div>
                    </div>
                    <ul class="list-unstyled mb-0 small">
                        <li class="d-flex justify-content-between py-1.5 border-bottom">
                            <span class="text-muted">Role:</span>
                            <span class="fw-semibold">Authorized Employee</span>
                        </li>
                        <li class="d-flex justify-content-between py-1.5 border-bottom">
                            <span class="text-muted">Joined:</span>
                            <span class="fw-semibold">Today</span>
                        </li>
                        <li class="d-flex justify-content-between py-1.5">
                            <span class="text-muted">License:</span>
                            <span class="text-primary fw-bold">Enterprise Standard</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- Directory Members Table -->
        <div class="info-card overflow-hidden">
            <div class="p-4 border-bottom d-flex align-items-center justify-content-between">
                <div>
                    <h5 class="fw-bold text-dark mb-1">Workspace Colleagues</h5>
                    <p class="text-muted small mb-0">Members authorized with company domain @<?= $domain ?></p>
                </div>
                <span class="badge bg-light text-dark border px-3 py-2 rounded-pill font-monospace">
                    <?= count($colleagues) ?> Accounts
                </span>
            </div>
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <tbody class="divide-y">
                        <?php foreach ($colleagues as $c): ?>
                        <tr>
                            <td class="ps-4 py-3">
                                <div class="d-flex align-items-center gap-3">
                                    <div class="user-colleague-avatar">
                                        <?= strtoupper(substr($c['name'], 0, 1)) ?>
                                    </div>
                                    <div>
                                        <div class="fw-bold text-dark small"><?= htmlspecialchars($c['name']) ?></div>
                                        <div class="text-muted small font-monospace"><?= htmlspecialchars($c['email']) ?></div>
                                    </div>
                                </div>
                            </td>
                            <td class="text-muted small"><?= htmlspecialchars($c['role']) ?></td>
                            <td class="pe-4 text-end">
                                <span class="badge rounded-pill bg-success-subtle text-success border border-success-subtle px-2.5 py-1">
                                    <?= htmlspecialchars($c['status']) ?>
                                </span>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </main>

    <!-- Bootstrap 5 Bundle JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        // Trigger Toast on load
        document.addEventListener('DOMContentLoaded', function () {
            const toastEl = document.getElementById('authSuccessToast');
            if (toastEl) {
                const toast = new bootstrap.Toast(toastEl, { delay: 4500 });
                toast.show();
            }

            // Copy Email Button
            const copyBtn = document.getElementById('copyEmailBtn');
            const copyIcon = document.getElementById('copyIcon');
            const copyText = document.getElementById('copyText');
            if (copyBtn) {
                copyBtn.addEventListener('click', function () {
                    navigator.clipboard.writeText('<?= $email ?>');
                    copyIcon.className = 'bi bi-check-lg text-success';
                    copyText.textContent = 'Copied!';
                    setTimeout(function () {
                        copyIcon.className = 'bi bi-clipboard';
                        copyText.textContent = 'Copy Work Email';
                    }, 2000);
                });
            }
        });
    </script>
</body>
</html>
