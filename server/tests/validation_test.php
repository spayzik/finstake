<?php
declare(strict_types=1);
require __DIR__ . '/../src/validation.php';
$sample = ['schemaVersion'=>1,'source'=>'finstake-web','service'=>'personal','amountRub'=>500000,'termMonths'=>60,'comment'=>'','contact'=>['name'=>'Тест Тестов','phone'=>'+447700900123','preferredChannel'=>'phone'],'consent'=>['accepted'=>true,'policyVersion'=>'test-policy']];
$headers = ['lead_consent_version'=>'test-consent','release_id'=>'test-release'];
$versions = ['policy'=>'test-policy','consent'=>'test-consent','release'=>'test-release'];
assert(validateLead($sample, $headers, $versions) === true);
$sample['consent']['accepted'] = false;
assert(validateLead($sample, $headers, $versions) === false);
$sample['consent']['accepted'] = true;
$headers['lead_consent_version'] = 'unknown';
assert(validateLead($sample, $headers, $versions) === false);
$headers = ['lead_consent_version'=>'','release_id'=>''];
$versions = ['policy'=>'','consent'=>'','release'=>''];
$sample['consent']['policyVersion'] = '';
assert(validateLead($sample, $headers, $versions) === false);
echo "validation ok\n";
