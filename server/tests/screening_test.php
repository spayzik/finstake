<?php
declare(strict_types=1);
require __DIR__.'/../src/screening.php';
function check(bool $value): void { if (!$value) throw new RuntimeException('screening check failed'); }
check(screeningNext(0, 'urgent') === 1);
check(screeningNext(1, 'business') === 2);
check(screeningNext(2, 'ready') === 3);
check(screeningNext(0, 'business') === null);
check(screeningNext(1, 'ready') === null);
check(screeningNext(2, 'free text') === null);
check(screeningNext(3, 'ready') === null);
echo "screening validation passed\n";
