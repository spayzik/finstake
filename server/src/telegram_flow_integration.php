<?php
declare(strict_types=1);
require_once __DIR__.'/telegram_flow.php';
/** Synthetic-only transaction: updates, session and mock delivery commit together. */
function processTelegramUpdate(PDO $db,array $update,array $settings=[]): void {
    $id=$update['update_id']??null;
    if (!is_int($id) || $id<0) throw new InvalidArgumentException('invalid update');
    $db->beginTransaction();
    try {
        $s=$db->prepare('SELECT 1 FROM telegram_updates WHERE update_id=?'); $s->execute([$id]);
        if ($s->fetchColumn()!==false) { $db->commit(); return; }
        $message=$update['message']??null; $callback=$update['callback_query']??null;
        $chat=is_array($message)?($message['chat']??null):($callback['message']['chat']??null);
        $from=is_array($message)?($message['from']['id']??null):($callback['from']['id']??null);
        if (is_array($chat) && ($chat['type']??null)==='private' && is_int($chat['id']??null) && $chat['id']===$from) {
            $chatId=$chat['id']; $step=null;
            if (is_array($message) && is_string($message['text']??null) && preg_match('/^\/start ([A-Za-z0-9_-]{20,64})$/D',$message['text'],$m)) {
                $s=$db->prepare('UPDATE telegram_sessions SET chat_id=?, token_hash=NULL WHERE token_hash=? AND token_expires_at>? AND chat_id IS NULL');
                $s->execute([$chatId,hash('sha256',$m[1]),gmdate('Y-m-d H:i:s')]); if ($s->rowCount()===1) $step=0;
            } elseif (is_array($callback) && is_string($callback['data']??null)) {
                $choice=parseScreeningCallback($callback['data']);
                if ($choice!==null) {
                    $s=$db->prepare('SELECT lead_id,step,answers FROM telegram_sessions WHERE chat_id=?'); $s->execute([$chatId]); $row=$s->fetch(PDO::FETCH_ASSOC);
                    if ($row && (int)$row['step']===$choice[0]) {
                        $answers=json_decode($row['answers']??'[]',true,512,JSON_THROW_ON_ERROR); $answers[]=$choice[1]; $step=$choice[0]+1;
                        $s=$db->prepare('UPDATE telegram_sessions SET step=?,answers=? WHERE lead_id=? AND step=?'); $s->execute([$step,json_encode($answers,JSON_THROW_ON_ERROR),$row['lead_id'],$choice[0]]);
                        if ($s->rowCount()!==1) $step=null;
                    }
                }
            }
            if ($step!==null) {
                [$text]=questionForStep($step); $payload=['method'=>'sendMessage','text'=>$text,'reply_markup'=>telegramKeyboard($step)];
                $s=$db->prepare('INSERT INTO mock_messages (chat_id,payload) VALUES (?,?)'); $s->execute([$chatId,json_encode($payload,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR)]);
            }
        }
        $s=$db->prepare('INSERT INTO telegram_updates (update_id,received_at) VALUES (?,?)'); $s->execute([$id,gmdate('Y-m-d H:i:s')]); $db->commit();
    } catch (Throwable $e) { if ($db->inTransaction()) $db->rollBack(); throw $e; }
}
