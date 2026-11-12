<?php
declare(strict_types=1);
require_once __DIR__.'/screening.php';
/** Stateless UI for the stored screening state; no free text is accepted. */
function questionForStep(int $step): array {
    return match($step) {
      0 => ['Когда планируете обратиться?', [['Как можно скорее','urgent'],['В ближайшее время','soon'],['Пока изучаю','later']]],
      1 => ['Для кого рассматриваете финансирование?', [['Для себя','personal'],['Для бизнеса','business'],['С обеспечением','secured']]],
      2 => ['Готовы обсудить задачу?', [['Да','ready'],['Есть вопросы','questions'],['Пока нет','not_ready']]],
      default => ['Спасибо. Ответы сохранены. Решение о кредите принимает кредитор.', []],
    };
}
function parseScreeningCallback(string $data): ?array {
    if (!preg_match('/^q:([0-2]):([a-z_]{1,20})$/D',$data,$m)) return null;
    $step=(int)$m[1]; return screeningNext($step,$m[2]) === null ? null : [$step,$m[2]];
}
function telegramKeyboard(int $step, ?string $leadId = null): array {
    [, $options]=questionForStep($step); $rows=[];
    $prefix = $leadId === null ? 'q' : 'q:'.$leadId;
    foreach ($options as [$title,$value]) $rows[]=[['text'=>$title,'callback_data'=>"$prefix:$step:$value"]];
    return ['inline_keyboard'=>$rows];
}
