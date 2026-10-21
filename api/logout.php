<?php
require_once __DIR__ . '/../config.php';

unset($_SESSION['current_user']);
session_destroy();

if (isset($_SERVER['HTTP_ACCEPT']) && str_contains($_SERVER['HTTP_ACCEPT'], 'application/json')) {
    sendJsonResponse(['success' => true, 'message' => 'Logged out']);
}

header('Location: ../index.php');
exit;
