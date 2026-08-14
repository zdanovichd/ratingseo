<?php
/**
 * Отправка заявок RatingSEO (Beget SMTP).
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
  exit;
}

$configFile = __DIR__ . '/mail-config.php';
if (!is_file($configFile)) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'mail-config.php не найден']);
  exit;
}

$cfg = require $configFile;
$TO = $cfg['to'] ?? 'zdanovich.daniil@gmail.com';
$FROM = $cfg['from'] ?? 'info@ratingseo.ru';
$FROM_NAME = $cfg['from_name'] ?? 'RatingSEO';
$SMTP_HOST = $cfg['smtp_host'] ?? 'smtp.beget.com';
$SMTP_PORT = (int) ($cfg['smtp_port'] ?? 465);
$SMTP_USER = $cfg['smtp_user'] ?? $FROM;
$SMTP_PASS = $cfg['smtp_pass'] ?? '';

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
  $data = $_POST;
}

if (!is_array($data) || count($data) === 0) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Empty payload']);
  exit;
}

if (!empty($data['_honey']) || !empty($data['website_hp'])) {
  echo json_encode(['ok' => true]);
  exit;
}

function clean_mail($value) {
  $value = is_scalar($value) ? (string) $value : '';
  $value = trim($value);
  $value = str_replace(["\r", "\n", "%0a", "%0d"], ' ', $value);
  return mb_substr($value, 0, 2000);
}

$formType = clean_mail($data['form_type'] ?? 'Заявка с сайта');
$subject = clean_mail($data['_subject'] ?? ('RatingSEO — ' . $formType));

if (empty($data['privacy']) && empty($data['privacy_agree'])) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Нужно согласие с политикой конфиденциальности']);
  exit;
}

$skip = ['_subject', '_template', '_captcha', '_honey', 'website_hp', '_to', 'privacy', 'privacy_agree'];
$lines = [];
$lines[] = 'Тип формы: ' . $formType;
$lines[] = 'Дата: ' . date('d.m.Y H:i:s');
$lines[] = 'IP: ' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$lines[] = 'Согласие с политикой: да';
$lines[] = str_repeat('-', 40);

foreach ($data as $key => $value) {
  if (in_array($key, $skip, true)) {
    continue;
  }
  $val = clean_mail($value);
  if ($val === '') {
    continue;
  }
  $lines[] = clean_mail($key) . ': ' . $val;
}

$body = implode("\n", $lines);

$replyTo = '';
foreach (['email', 'contact'] as $field) {
  if (!empty($data[$field])) {
    $candidate = clean_mail($data[$field]);
    if (filter_var($candidate, FILTER_VALIDATE_EMAIL)) {
      $replyTo = $candidate;
      break;
    }
  }
}

function smtp_expect($fp, $codes) {
  $response = '';
  while (($line = fgets($fp, 515)) !== false) {
    $response .= $line;
    if (isset($line[3]) && $line[3] === ' ') {
      break;
    }
  }
  $code = (int) substr($response, 0, 3);
  if (!in_array($code, (array) $codes, true)) {
    throw new RuntimeException('SMTP error: ' . trim($response));
  }
  return $response;
}

function smtp_cmd($fp, $cmd, $codes) {
  fwrite($fp, $cmd . "\r\n");
  return smtp_expect($fp, $codes);
}

function send_via_smtp($host, $port, $user, $pass, $from, $fromName, $to, $subject, $body, $replyTo) {
  if ($pass === '') {
    throw new RuntimeException('Укажите smtp_pass в mail-config.php (пароль ящика info@ratingseo.ru)');
  }

  $remote = 'ssl://' . $host . ':' . $port;
  $fp = @stream_socket_client($remote, $errno, $errstr, 20, STREAM_CLIENT_CONNECT);
  if (!$fp) {
    throw new RuntimeException("SMTP connect failed: $errstr ($errno)");
  }
  stream_set_timeout($fp, 20);

  smtp_expect($fp, 220);
  smtp_cmd($fp, 'EHLO ratingseo.ru', 250);
  smtp_cmd($fp, 'AUTH LOGIN', 334);
  smtp_cmd($fp, base64_encode($user), 334);
  smtp_cmd($fp, base64_encode($pass), 235);
  smtp_cmd($fp, 'MAIL FROM:<' . $from . '>', 250);
  smtp_cmd($fp, 'RCPT TO:<' . $to . '>', [250, 251]);
  smtp_cmd($fp, 'DATA', 354);

  $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
  $encodedFrom = '=?UTF-8?B?' . base64_encode($fromName) . '?= <' . $from . '>';

  $headers = [];
  $headers[] = 'Date: ' . date('r');
  $headers[] = 'From: ' . $encodedFrom;
  $headers[] = 'To: <' . $to . '>';
  $headers[] = 'Subject: ' . $encodedSubject;
  $headers[] = 'MIME-Version: 1.0';
  $headers[] = 'Content-Type: text/plain; charset=UTF-8';
  $headers[] = 'Content-Transfer-Encoding: 8bit';
  $headers[] = 'Message-ID: <' . uniqid('ratingseo_', true) . '@ratingseo.ru>';
  if ($replyTo !== '') {
    $headers[] = 'Reply-To: ' . $replyTo;
  }

  $safeBody = str_replace(["\r\n", "\r"], "\n", $body);
  $safeBody = preg_replace('/^\./m', '..', $safeBody);
  $message = implode("\r\n", $headers) . "\r\n\r\n" . str_replace("\n", "\r\n", $safeBody) . "\r\n.";

  fwrite($fp, $message . "\r\n");
  smtp_expect($fp, 250);
  smtp_cmd($fp, 'QUIT', [221, 250]);
  fclose($fp);
}

try {
  send_via_smtp(
    $SMTP_HOST,
    $SMTP_PORT,
    $SMTP_USER,
    $SMTP_PASS,
    $FROM,
    $FROM_NAME,
    $TO,
    $subject,
    $body,
    $replyTo
  );
  echo json_encode(['ok' => true]);
} catch (Throwable $e) {
  @file_put_contents(
    __DIR__ . '/mail-error.log',
    date('c') . ' ' . $e->getMessage() . "\n",
    FILE_APPEND
  );
  http_response_code(500);
  echo json_encode([
    'ok' => false,
    'error' => $e->getMessage(),
  ]);
}
