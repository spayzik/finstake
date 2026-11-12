<?php
declare(strict_types=1);
/** Connects only with deployment-supplied settings. Never expose these settings in webroot. */
function mysqlConnection(array $config): PDO {
    if (($config['driver'] ?? null) !== 'mysql' || empty($config['host']) || empty($config['database']) || empty($config['user']) || !isset($config['password'])) {
        throw new RuntimeException('Database configuration incomplete');
    }
    $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $config['host'], $config['port'] ?? 3306, $config['database']);
    return new PDO($dsn, $config['user'], $config['password'], [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES=>false]);
}
