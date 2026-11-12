<?php
declare(strict_types=1);
/** Validates fixed choices only; callers must persist and deduplicate Telegram updates. */
function screeningNext(int $step, string $choice): ?int
{
    $choices = [
        0 => ['urgent', 'soon', 'later'],
        1 => ['personal', 'business', 'secured'],
        2 => ['ready', 'questions', 'not_ready'],
    ];
    return isset($choices[$step]) && in_array($choice, $choices[$step], true) ? $step + 1 : null;
}
