<?php
/**
 * Скопируйте в mail-config.php и укажите SMTP_PASS.
 * mail-config.php не коммитится (см. .gitignore).
 */
return [
  'to' => 'zdanovich.daniil@gmail.com',
  'from' => 'info@ratingseo.ru',
  'from_name' => 'RatingSEO',
  'smtp_host' => 'smtp.beget.com',
  'smtp_port' => 465,
  'smtp_user' => 'info@ratingseo.ru',
  'smtp_pass' => '', // пароль ящика из панели Beget
];
