<?php
declare(strict_types=1);
require __DIR__.'/../src/telegram_flow.php';
if (parseScreeningCallback('q:0:urgent') !== [0,'urgent']) throw new RuntimeException('valid answer rejected');
if (parseScreeningCallback('q:0:business') !== null) throw new RuntimeException('wrong question accepted');
if (parseScreeningCallback('q:2:arbitrary') !== null) throw new RuntimeException('free text accepted');
if (count(telegramKeyboard(0)['inline_keyboard']) !== 3) throw new RuntimeException('missing choices');
if (count(telegramKeyboard(3)['inline_keyboard']) !== 0) throw new RuntimeException('finished session has choices');
echo "telegram flow unit passed\n";
