<?php
declare(strict_types=1);
if (PHP_SAPI!=='cli') exit(1);
require __DIR__.'/../src/bootstrap.php';
try { $c=appConfiguration(); $db=appDatabase($c); if ($db->getAttribute(PDO::ATTR_DRIVER_NAME)!=='mysql') throw new RuntimeException('MySQL required');
$db->exec('CREATE TABLE IF NOT EXISTS schema_migrations (version VARCHAR(80) PRIMARY KEY, applied_at DATETIME NOT NULL) ENGINE=InnoDB');
foreach (glob(__DIR__.'/../migrations/*.sql') as $file) {
 $name=basename($file); $s=$db->prepare('SELECT 1 FROM schema_migrations WHERE version=?');$s->execute([$name]); if ($s->fetchColumn()) continue;
 $db->exec(file_get_contents($file)); $s=$db->prepare('INSERT INTO schema_migrations VALUES (?,?)');$s->execute([$name,gmdate('Y-m-d H:i:s')]); echo $name.PHP_EOL;
}} catch (Throwable $e) {fwrite(STDERR,"Migration failed; inspect database before retrying\n");exit(1);}
