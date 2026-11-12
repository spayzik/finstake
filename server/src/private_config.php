<?php
declare(strict_types=1);
function loadPrivateConfiguration(string $file,string $webroot): array {
 $path=realpath($file); $root=realpath($webroot);
 if (!$path || !$root || str_starts_with(strtolower($path),strtolower($root).DIRECTORY_SEPARATOR)) throw new RuntimeException('Private configuration must be outside webroot');
 $config=json_decode(file_get_contents($path),true,32,JSON_THROW_ON_ERROR);
 if (!is_array($config)) throw new RuntimeException('Invalid private configuration');
 return $config;
}
