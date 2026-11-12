<?php
declare(strict_types=1);
/** Fail closed until message handling, persistence and outbox are integrated. */
function processTelegramUpdate(PDO $db,array $update,array $settings): void {
    throw new LogicException('Telegram update processing is not implemented');
}
