<?php
declare(strict_types=1);
$db=new PDO('sqlite:'.$argv[1], null, null, [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
echo json_encode($db->query('SELECT id, consent_version, release_id FROM leads')->fetchAll(PDO::FETCH_ASSOC));
