<?php
declare(strict_types=1);
// Test-only scaffold: disabled by default, never expose until complete and independently reviewed.
header('Content-Type: application/json'); header('Cache-Control: no-store');
http_response_code(503); echo '{"status":"unavailable"}';
