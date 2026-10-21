# Enterprise Workspace Portal (Raw PHP & Bootstrap 5)

Corporate authentication portal requiring company Google Workspace / corporate domains for sign up and sign in, converted to native Raw PHP and Bootstrap 5.

## Features
- **Raw PHP Backend**:
  - `index.php`: Main portal entry (redirects to dashboard if logged in).
  - `dashboard.php`: Authenticated Enterprise Dashboard view.
  - `config.php`: Configuration, environment loader, and user store.
  - `includes/validator.php`: Corporate domain rules, fake username patterns, and free email blocking.
  - `includes/smtp.php`: DNS MX record resolution and domain mail server checking.
  - `includes/illustration.php`: SVG vector security illustration component.
  - `api/verify-domain.php`: Real-time DNS MX lookup and Google Workspace verification.
  - `api/check-mailbox.php`: Corporate domain and mail server verification.
  - `api/signup.php` & `api/login.php` & `api/logout.php`: Session-backed authentication endpoints.
- **Bootstrap 5 & Vanilla JS Frontend**:
  - `assets/css/style.css`: Clean royal blue theme (`#0B63F6`), pill inputs, 4-bar password strength meter.
  - `assets/js/auth.js`: Real-time email validation, fake user detection, typo auto-fixing, and AJAX auth.

## Run Locally with PHP

**Prerequisites:** PHP 8.0+

1. Start the PHP built-in web server:
   ```bash
   php -S localhost:8000
   ```
2. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

Demo account:
- Email: `jordan.lee@nexuscorp.io`
- Password: any 8+ character password (e.g. `Password123!`)

