<?php
declare(strict_types=1);
function botAmountRanges(): array {
 return ['r500_3'=>'500 тыс. — до 3 млн ₽','r3_5'=>'3 — до 5 млн ₽','r5_10'=>'5 — до 10 млн ₽','r10_50'=>'10 — до 50 млн ₽','r50plus'=>'50 млн ₽ и больше','other'=>'Обсудить с менеджером'];
}
function botMenuKeyboard(): array {
 return ['inline_keyboard'=>[
  [['text'=>'Заявка с сайта','callback_data'=>'f:site'],['text'=>'Оставить заявку','callback_data'=>'b:new']],
  [['text'=>'О FinStake','callback_data'=>'f:about'],['text'=>'Как работаем','callback_data'=>'f:work']],
  [['text'=>'Оплата','callback_data'=>'f:payment'],['text'=>'Документы','callback_data'=>'f:documents']],
  [['text'=>'Связаться','callback_data'=>'f:contacts']],
  [['text'=>'Моя заявка','callback_data'=>'f:status'],['text'=>'Продолжить опрос','callback_data'=>'f:resume']]
 ]];
}
/** Called inside the update transaction. Only synthetic pilot accounts reach this handler via poll.php. */
function botMenuUpdate(PDO $db,int $actor,mixed $text,mixed $data,?string $callbackId,int $updateId,array $c): bool {
 if($text==='/cancel') {
  $draft=sql($db,"SELECT actor_id FROM bot_drafts WHERE actor_id=? AND stage<>'done'".rowLock($db),[$actor])->fetchColumn();
  if($draft!==false) {
   sql($db,"UPDATE bot_drafts SET stage='done',updated_at=? WHERE actor_id=?",[utcNow(),$actor]);
   if ($keyboard!==botMenuKeyboard()) $keyboard['inline_keyboard'][]=[['text'=>'Главное меню','callback_data'=>'f:menu']];
 enqueueTelegram($db,null,'menu:'.$updateId,'sendMessage',['chat_id'=>$actor,'text'=>'Начало обращения отменено. Уже созданные заявки сохранены.','reply_markup'=>botMenuKeyboard()]);
   return true;
  }
 }
 $command=is_string($text)&&in_array($text,['/start','/help','/menu'],true);
 if (!$command && (!is_string($data)||(!str_starts_with($data,'f:')&&!str_starts_with($data,'b:')))) return false;
 if ($data==='f:resume') return false;
 $reply='Здравствуйте! FinStake помогает подобрать финансирование и сопровождает оформление. Вы пришли с сайта или хотите начать здесь? Сейчас работает тестовый контур: реальные данные клиентов не вводите.';
 $keyboard=botMenuKeyboard();
 $faq=[
  'f:about'=>'FinStake — независимый кредитный брокер. Помогаем получить кредит: анализируем вашу ситуацию, ищем возможности для нужной суммы и лучших доступных условий, готовим документы и сопровождаем до получения средств. Наш интерес совпадает с вашим: без предоплаты, оплата после результата. Окончательное решение и условия определяет кредитор.',
  'f:work'=>'Разбираем задачу → подбираем варианты → помогаем с документами → сопровождаем до получения кредита. Большая сумма или одобрение не гарантируются.',
  'f:payment'=>'Без предоплаты. Вознаграждение — после получения кредита, по заранее согласованным условиям. Размер и порядок оплаты обсуждаем до начала работы.',
  'f:documents'=>'Список зависит от направления и требований кредитора. Менеджер уточнит его после консультации. Паспорт, выписки и кредитные отчёты в бот не загружайте.',
  'f:contacts'=>'Рабочий email FinStake: finstake@mail.ru. Не отправляйте паспортные данные и кредитные отчёты без согласованного защищённого способа передачи.',
  'f:site'=>'Если заявка уже принята на сайте, откройте кнопку «Продолжить в Telegram» в её подтверждении. Так мы свяжем именно вашу заявку; повторно оформлять её не нужно.'
 ];
 if(isset($faq[$data??''])) $reply=$faq[$data];
 elseif($data==='f:status') {
  $r=sql($db,'SELECT l.status,n.number,s.step FROM telegram_sessions s JOIN leads l ON l.id=s.lead_id JOIN lead_numbers n ON n.lead_id=l.id WHERE s.chat_id=? ORDER BY n.number DESC LIMIT 1',[$actor])->fetch(PDO::FETCH_ASSOC);
  $labels=['NEW'=>'новая','IN_PROGRESS'=>'в работе','COMPLETED'=>'завершена','CLOSED'=>'закрыта'];
  $reply=$r?'Заявка №'.$r['number'].': '.($labels[$r['status']]??$r['status']).'. Опрос '.((int)$r['step']===3?'завершён.':'не завершён.'):'Связанной заявки пока нет. Если вы с сайта, используйте ссылку из подтверждения. Иначе выберите «Бот / другое».';
 } elseif($data==='b:new' || (is_string($data)&&str_starts_with($data,'b:'))) {
  $d=sql($db,'SELECT * FROM bot_drafts WHERE actor_id=?'.rowLock($db),[$actor])->fetch(PDO::FETCH_ASSOC);
  if($data==='b:new' && (!$d||$d['stage']==='done')) {
   $nonce=bin2hex(random_bytes(8));
   if($d) sql($db,"UPDATE bot_drafts SET nonce=?,stage='consent',service=NULL,consent_at=NULL,lead_id=NULL,updated_at=? WHERE actor_id=?",[$nonce,utcNow(),$actor]);
   else sql($db,"INSERT INTO bot_drafts(actor_id,nonce,stage,updated_at) VALUES (?,?,'consent',?)",[$actor,$nonce,utcNow()]);
   $d=['nonce'=>$nonce,'stage'=>'consent'];
  }
  if($d && preg_match('/^b:(consent|service|amount):([a-f0-9]{16})(?::([a-z0-9_]+))?$/D',(string)$data,$m) && hash_equals($d['nonce'],$m[2])) {
   if($m[1]==='consent' && $d['stage']==='consent') {
    sql($db,"UPDATE bot_drafts SET stage='service',consent_at=?,updated_at=? WHERE actor_id=?",[utcNow(),utcNow(),$actor]);$d['stage']='service';
   } elseif($m[1]==='service' && $d['stage']==='service' && in_array($m[3]??'',['personal','business','secured','refinancing'],true)) {
    sql($db,"UPDATE bot_drafts SET stage='amount',service=?,updated_at=? WHERE actor_id=?",[$m[3],utcNow(),$actor]);$d['service']=$m[3];$d['stage']='amount';
   } elseif($m[1]==='amount' && $d['stage']==='amount' && in_array($m[3]??'',array_keys(botAmountRanges()),true)) {
    $id=bin2hex(random_bytes(16));$key=bin2hex(random_bytes(16));
    $payload=['schemaVersion'=>1,'source'=>'telegram-bot','service'=>$d['service'],'amountRub'=>null,'amountRange'=>$m[3],'termMonths'=>null,'comment'=>'','contact'=>['preferredChannel'=>'telegram'],'consent'=>['accepted'=>true,'policyVersion'=>'test-policy']];
    (new LeadRepository($db))->create($id,$key,hash('sha256',json_encode($payload)),$payload,utcNow());
    sql($db,'INSERT INTO lead_numbers(lead_id) VALUES (?)',[$id]);
    (new ConsentRepository($db))->create($id,['lead_consent_version'=>'test-consent','release_id'=>'test-release'],'test-policy',$d['consent_at']);
    sql($db,'INSERT INTO telegram_sessions(lead_id,chat_id,step) VALUES (?,?,0)',[$id,$actor]);
    sql($db,"UPDATE bot_drafts SET stage='done',lead_id=?,updated_at=? WHERE actor_id=?",[$id,utcNow(),$actor]);
    notifyManagers($db,$id,'lead:'.$id,$c);
    [$question]=questionForStep(0);$reply='Тестовая заявка создана. '.$question;$keyboard=telegramKeyboard(0,$id);$d['stage']='created';
   }
  }
  if(!$d) $reply='Откройте меню и начните обращение заново: /menu';
  elseif($d['stage']==='consent') {$reply='Это тестовое обращение без имени, телефона и документов. Будут сохранены выбранные ответы и технический Telegram ID для связи с тестом. Настоящие клиентские данные пока не принимаются.';$keyboard=['inline_keyboard'=>[[['text'=>'Начать тестовое обращение','callback_data'=>'b:consent:'.$d['nonce']]], [['text'=>'Назад','callback_data'=>'f:about']]]];}
  elseif($d['stage']==='service') {$reply='Какое направление вас интересует?';$keyboard=['inline_keyboard'=>[]];foreach(['personal'=>'Личные цели','business'=>'Для бизнеса','secured'=>'Под залог','refinancing'=>'Рефинансирование'] as $v=>$label)$keyboard['inline_keyboard'][]=[['text'=>$label,'callback_data'=>'b:service:'.$d['nonce'].':'.$v]];}
  elseif($d['stage']==='amount') {$reply='Выберите подходящий диапазон суммы:';$keyboard=['inline_keyboard'=>[]];foreach(botAmountRanges() as $v=>$label)$keyboard['inline_keyboard'][]=[['text'=>$label,'callback_data'=>'b:amount:'.$d['nonce'].':'.$v]];}
  elseif($d['stage']==='done') $reply='Эта заявка уже создана. Посмотреть состояние можно кнопкой «Моя заявка»; для отдельной новой задачи начните через меню.';
 }
 if ($keyboard!==botMenuKeyboard()) $keyboard['inline_keyboard'][]=[['text'=>'Главное меню','callback_data'=>'f:menu']];
 enqueueTelegram($db,null,'menu:'.$updateId,'sendMessage',['chat_id'=>$actor,'text'=>$reply,'reply_markup'=>$keyboard]);
 if($callbackId!==null) enqueueTelegram($db,null,'ack:'.$callbackId,'answerCallbackQuery',['callback_query_id'=>$callbackId]);
 return true;
}
