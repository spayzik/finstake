<?php
declare(strict_types=1);
require_once __DIR__.'/repositories.php';
require_once __DIR__.'/telegram_flow.php';
require_once __DIR__.'/bot_menu.php';
function sql(PDO $db,string $query,array $values=[]): PDOStatement { $s=$db->prepare($query); $s->execute($values); return $s; }
function rowLock(PDO $db): string { return $db->getAttribute(PDO::ATTR_DRIVER_NAME)==='mysql'?' FOR UPDATE':''; }
function utcNow(): string { return gmdate('Y-m-d H:i:s'); }
function uniqueViolation(PDOException $e): bool { return in_array($e->getCode(),['23000','23505'],true); }
function linkToken(string $id,array $config): string { return rtrim(strtr(base64_encode(hash_hmac('sha256','lead:'.$id,$config['link_secret'],true)),'+/','-_'),'='); }
function enqueueTelegram(PDO $db,?string $leadId,string $key,string $method,array $payload): void {
    if (sql($db,'SELECT 1 FROM outbox WHERE dedupe_key=?',[$key])->fetchColumn()!==false) return;
    sql($db,'INSERT INTO outbox (lead_id,event_type,payload,status,attempts,available_at,created_at,dedupe_key,method) VALUES (?,?,?, ?,0,?,?,?,?)',[$leadId,'TELEGRAM',json_encode($payload,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR),'PENDING',utcNow(),utcNow(),$key,$method]);
}
function managerKeyboard(array $lead): array {
    $rows=[];
    foreach (['IN_PROGRESS'=>'Взять в работу','COMPLETED'=>'Завершить','CLOSED'=>'Закрыть'] as $status=>$label) {
        if (($lead['status']==='NEW' && in_array($status,['IN_PROGRESS','CLOSED'],true)) || ($lead['status']==='IN_PROGRESS' && in_array($status,['COMPLETED','CLOSED'],true))) {
            $rows[]=[['text'=>$label,'callback_data'=>'m:'.$lead['id'].':'.$lead['revision'].':'.$status]];
        }
    }
    return ['inline_keyboard'=>$rows];
}
function notifyManagers(PDO $db,string $id,string $event,array $config): void {
    $lead=sql($db,'SELECT id,status,revision,payload,created_at FROM leads WHERE id=?',[$id])->fetch(PDO::FETCH_ASSOC);
    $session=sql($db,'SELECT step,answers FROM telegram_sessions WHERE lead_id=?',[$id])->fetch(PDO::FETCH_ASSOC);
    $screen=$session['step']??0;
    $payload=json_decode($lead['payload'],true,32,JSON_THROW_ON_ERROR);
    $service=$payload['service'];
    $labels=['personal'=>'Личные цели','business'=>'Бизнес','secured'=>'Под залог','refinancing'=>'Рефинансирование'];
    $number=sql($db,'SELECT number FROM lead_numbers WHERE lead_id=?',[$id])->fetchColumn();
    $amount=is_int($payload['amountRub']??null)?number_format($payload['amountRub'],0,',',' ').' ₽':'обсудить';
    if(isset($payload['amountRange'])) $amount=botAmountRanges()[$payload['amountRange']]??'обсудить';
    $term=is_int($payload['termMonths']??null)?$payload['termMonths'].' мес.':'не указан';
    $source=($payload['source']??'')==='finstake-web'?'Сайт':'Бот / другое';
    $statuses=['NEW'=>'Новая','IN_PROGRESS'=>'В работе','COMPLETED'=>'Завершена','CLOSED'=>'Закрыта'];
    $answers=json_decode($session['answers']??'[]',true);
    $answerLabels=['urgent'=>'Как можно скорее','soon'=>'В ближайшее время','later'=>'Изучает варианты','personal'=>'Для себя','business'=>'Для бизнеса','secured'=>'С обеспечением','ready'=>'Готов к консультации','questions'=>'Есть вопросы','not_ready'=>'Пока не готов'];
    $summary='';foreach(['Срочность','Категория','Консультация'] as $i=>$label)if(isset($answers[$i]))$summary.="\n".$label.': '.($answerLabels[$answers[$i]]??'не указано');
    enqueueTelegram($db,$id,$event,'sendMessage',['chat_id'=>$config['crm_chat_id'],'message_thread_id'=>$config['leads_topic_id'],'text'=>'Заявка №'.$number."\nИсточник: ".$source."\nНаправление: ".($labels[$service]??'Не указано')."\nСумма: ".$amount."\nСрок: ".$term."\nСтатус: ".($statuses[$lead['status']]??$lead['status'])."\nОпрос: ".((int)$screen===3?'завершён':'не завершён').$summary."\nВремя UTC: ".utcNow(),'reply_markup'=>managerKeyboard($lead)]);
}
function acceptLead(PDO $db,array $payload,array $meta,string $key,array $config): array {
    $fingerprint=hash('sha256',json_encode([$payload,$meta],JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR));
    $repo=new LeadRepository($db); $db->beginTransaction();
    try {
        $old=$repo->byKey($key);
        if ($old) { if (!hash_equals($old['fingerprint'],$fingerprint)) throw new DomainException('conflict'); $id=$old['id']; }
        else {
            $id=bin2hex(random_bytes(16)); $repo->create($id,$key,$fingerprint,$payload,utcNow());
            sql($db,'INSERT INTO lead_numbers (lead_id) VALUES (?)',[$id]);
            (new ConsentRepository($db))->create($id,$meta,$payload['consent']['policyVersion'],utcNow());
            (new TelegramSessionRepository($db))->create($id,hash('sha256',linkToken($id,$config)),gmdate('Y-m-d H:i:s',time()+1800));
            notifyManagers($db,$id,'lead:'.$id,$config);
        }
        $session=sql($db,'SELECT token_hash,token_expires_at FROM telegram_sessions WHERE lead_id=?',[$id])->fetch(PDO::FETCH_ASSOC);
        $result=['status'=>'accepted','requestId'=>$id];
        $result['requestNumber']=(int)sql($db,'SELECT number FROM lead_numbers WHERE lead_id=?',[$id])->fetchColumn();
        if ($session && $session['token_hash']!==null && $session['token_expires_at']>utcNow()) $result['telegramUrl']='https://t.me/finstake_helperbot?start='.linkToken($id,$config);
        $db->commit(); return $result;
    } catch (PDOException $e) {
        if ($db->inTransaction()) $db->rollBack();
        // Only the idempotency-key race may be resolved to an existing receipt.
        if (uniqueViolation($e) && ($old=$repo->byKey($key))) {
            if (!hash_equals($old['fingerprint'],$fingerprint)) throw new DomainException('conflict');
            return ['status'=>'accepted','requestId'=>$old['id']];
        }
        throw $e;
    } catch (Throwable $e) { if ($db->inTransaction()) $db->rollBack(); throw $e; }
}
function persistTelegramUpdate(PDO $db,array $update,array $config): void {
    $updateId=$update['update_id']??null;
    if (!is_int($updateId)||$updateId<0) throw new InvalidArgumentException('Invalid update');
    $db->beginTransaction();
    try {
        try {(new TelegramUpdateRepository($db))->record($updateId,utcNow());}
        catch (PDOException $e) { if (uniqueViolation($e)) {$db->rollBack(); return;} throw $e; }
        $callback=$update['callback_query']??null; $message=$update['message']??null;
        if (is_array($callback)) {
            $callbackId=$callback['id']??null;
            if (!is_string($callbackId)||strlen($callbackId)>128) throw new InvalidArgumentException('Invalid callback');
            try {sql($db,'INSERT INTO telegram_callbacks (callback_id,received_at) VALUES (?,?)',[$callbackId,utcNow()]);}
            catch (PDOException $e) {if (uniqueViolation($e)) {$db->rollBack(); return;} throw $e;}
        }
        $chat=is_array($message)?($message['chat']??null):($callback['message']['chat']??null);
        $actor=is_array($message)?($message['from']['id']??null):($callback['from']['id']??null);
        $data=$callback['data']??null; $text=$message['text']??'';
        if (is_array($callback) && is_string($data) && preg_match('/^m:([a-f0-9]{32}):([0-9]{1,8}):(IN_PROGRESS|COMPLETED|CLOSED)$/D',$data,$m)) {
            $ack='Нет доступа к управлению этой заявкой.';
            if (is_int($actor) && in_array($actor,$config['manager_ids'],true) && ($chat['id']??null)===$config['crm_chat_id'] && ($callback['message']['message_thread_id']??null)===$config['leads_topic_id']) {
                $ack='Карточка устарела. Используйте кнопки в последней карточке заявки.';
                $lead=sql($db,'SELECT id,status,revision FROM leads WHERE id=?'.rowLock($db),[$m[1]])->fetch(PDO::FETCH_ASSOC);
                if ($lead && (int)$lead['revision']===(int)$m[2] && (($lead['status']==='NEW' && in_array($m[3],['IN_PROGRESS','CLOSED'],true)) || ($lead['status']==='IN_PROGRESS' && in_array($m[3],['COMPLETED','CLOSED'],true)))) {
                    (new LeadStatusRepository($db))->change($lead['id'],$lead['status'],$m[3],$actor,utcNow());
                    sql($db,'UPDATE leads SET revision=revision+1 WHERE id=?',[$lead['id']]);
                    notifyManagers($db,$lead['id'],'status:'.$updateId,$config);
                    enqueueTelegram($db,$lead['id'],'ack:'.$callbackId,'answerCallbackQuery',['callback_query_id'=>$callbackId,'text'=>'Статус сохранён']);
                    $ack=null;
                }
            }
            if ($ack!==null) enqueueTelegram($db,null,'ack:'.$callbackId,'answerCallbackQuery',['callback_query_id'=>$callbackId,'text'=>$ack]);
        } elseif (is_array($chat) && ($chat['type']??null)==='private' && is_int($chat['id']??null) && $chat['id']===$actor) {
            if(botMenuUpdate($db,$actor,$text,$data,$callbackId??null,$updateId,$config)){$db->commit();return;}
            if($data==='f:resume'){$text='/start';$data=null;}
            $session=null; $reply=null;
            if (is_string($text) && preg_match('/^\/start ([A-Za-z0-9_-]{20,64})$/D',$text,$m)) {
                $session=sql($db,'SELECT * FROM telegram_sessions WHERE token_hash=? AND token_expires_at>? AND chat_id IS NULL'.rowLock($db),[hash('sha256',$m[1]),utcNow()])->fetch(PDO::FETCH_ASSOC);
                if ($session) {sql($db,'UPDATE telegram_sessions SET token_hash=NULL,chat_id=?,cancelled=0 WHERE lead_id=?',[$actor,$session['lead_id']]);}
            } elseif (is_string($text) && in_array($text,['/start','/help','/cancel'],true)) {
                $session=sql($db,'SELECT s.* FROM telegram_sessions s JOIN leads l ON l.id=s.lead_id WHERE s.chat_id=? ORDER BY l.created_at DESC,l.id DESC LIMIT 1'.rowLock($db),[$actor])->fetch(PDO::FETCH_ASSOC);
                if ($session && $text==='/cancel') {sql($db,'UPDATE telegram_sessions SET cancelled=1 WHERE lead_id=?',[$session['lead_id']]); $reply='Опрос приостановлен. Заявка сохранена. /start — продолжить.';}
                elseif ($session && $text==='/help') {$reply='Отвечайте только кнопками. /cancel — пауза, /start — продолжить. Документы сюда не отправляйте.';}
                elseif ($session) {sql($db,'UPDATE telegram_sessions SET cancelled=0 WHERE lead_id=?',[$session['lead_id']]);}
            } elseif (is_string($data) && preg_match('/^q:([a-f0-9]{32}):([0-2]):([a-z_]{1,20})$/D',$data,$m)) {
                $session=sql($db,'SELECT * FROM telegram_sessions WHERE lead_id=? AND chat_id=?'.rowLock($db),[$m[1],$actor])->fetch(PDO::FETCH_ASSOC);
                if ($session && !(int)$session['cancelled'] && (int)$session['step']===(int)$m[2] && screeningNext((int)$m[2],$m[3])!==null) {
                    $answers=json_decode($session['answers']??'[]',true,32,JSON_THROW_ON_ERROR); $answers[]=$m[3]; $session['step']=(int)$session['step']+1;
                    sql($db,'UPDATE telegram_sessions SET step=?,answers=? WHERE lead_id=?',[$session['step'],json_encode($answers,JSON_THROW_ON_ERROR),$session['lead_id']]);
                    if ($session['step']===3) notifyManagers($db,$session['lead_id'],'screened:'.$session['lead_id'],$config);
                } else {$session=null;}
            }
            if (!$session && is_string($text) && str_starts_with($text,'/')) {
                enqueueTelegram($db,null,'welcome:'.$updateId,'sendMessage',['chat_id'=>$actor,'text'=>'Здравствуйте! Я помощник FinStake. Чтобы связать разговор с обращением, заполните форму на сайте и нажмите «Продолжить в Telegram». Затем задам три коротких вопроса. Документы и финансовые сведения сюда не отправляйте.','reply_markup'=>['inline_keyboard'=>[[['text'=>'Открыть сайт FinStake','url'=>'https://moneta.pluton-host.ru/']]]]]);
            }
            if ($session) {
                [$question]=questionForStep((int)$session['step']);
                $payload=['chat_id'=>$actor,'text'=>$reply??$question];
                if ($reply===null && (int)$session['step']<3) $payload['reply_markup']=telegramKeyboard((int)$session['step'],$session['lead_id']);
                enqueueTelegram($db,$session['lead_id'],'reply:'.$updateId,'sendMessage',$payload);
                if (is_array($callback)) enqueueTelegram($db,$session['lead_id'],'ack:'.$callbackId,'answerCallbackQuery',['callback_query_id'=>$callbackId]);
            }
        }
        $db->commit();
    } catch (Throwable $e) { if ($db->inTransaction()) $db->rollBack(); throw $e; }
}
