<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, [
        'ok' => false,
        'message' => 'Metodo no permitido.'
    ]);
}

$config = [
    'host' => 'mail.communitynetworkscr.com',
    'port' => 465,
    'encryption' => 'ssl', // ssl (465) o tls (587)
    'username' => 'testing@communitynetworkscr.com',
    'password' => 'CHANGE_THIS_PASSWORD',
    'to_email' => 'info@communitynetworkscr.com',
    'from_email' => 'testing@communitynetworkscr.com',
    'from_name' => 'Community Networks CR',
    'helo_domain' => 'communitynetworkscr.com',
    'timeout' => 20
];

if ($config['password'] === 'CHANGE_THIS_PASSWORD') {
    respond(500, [
        'ok' => false,
        'message' => 'Debe configurar la clave SMTP en api/contact.php.'
    ]);
}

$honeypot = trim((string)($_POST['website'] ?? ''));
if ($honeypot !== '') {
    respond(200, [
        'ok' => true,
        'message' => 'Consulta enviada.'
    ]);
}

$nombre = sanitizeSingleLine((string)($_POST['nombre'] ?? ''));
$correo = sanitizeEmail((string)($_POST['correo'] ?? ''));
$telefono = sanitizeSingleLine((string)($_POST['telefono'] ?? ''));
$empresa = sanitizeSingleLine((string)($_POST['empresa'] ?? ''));
$mensaje = sanitizeMultiline((string)($_POST['mensaje'] ?? ''));

$errors = [];
if ($nombre === '') {
    $errors[] = 'El nombre es obligatorio.';
}
if ($correo === '') {
    $errors[] = 'El correo es obligatorio y debe ser valido.';
}
if ($telefono === '') {
    $errors[] = 'El telefono es obligatorio.';
}
if ($mensaje === '') {
    $errors[] = 'El mensaje es obligatorio.';
}

if (!empty($errors)) {
    respond(422, [
        'ok' => false,
        'message' => implode(' ', $errors)
    ]);
}

$subject = 'Nuevo contacto web - ' . $nombre;
$bodyLines = [
    'Nuevo formulario de contacto recibido',
    '',
    'Nombre: ' . $nombre,
    'Correo: ' . $correo,
    'Telefono: ' . $telefono,
    'Empresa: ' . ($empresa !== '' ? $empresa : 'No indicada'),
    '',
    'Mensaje:',
    $mensaje
];

$body = implode("\r\n", $bodyLines);

try {
    smtpSend($config, $correo, $subject, $body);
    respond(200, [
        'ok' => true,
        'message' => 'Gracias. Su consulta fue enviada correctamente.'
    ]);
} catch (Throwable $error) {
    respond(500, [
        'ok' => false,
        'message' => 'No se pudo enviar el mensaje en este momento.'
    ]);
}

function sanitizeSingleLine(string $value): string
{
    $value = trim($value);
    $value = str_replace(["\r", "\n"], ' ', $value);
    $value = preg_replace('/\s+/', ' ', $value) ?? $value;
    return substr($value, 0, 180);
}

function sanitizeMultiline(string $value): string
{
    $value = trim($value);
    $value = str_replace(["\r\n", "\r"], "\n", $value);
    $value = preg_replace('/\n{3,}/', "\n\n", $value) ?? $value;
    return substr($value, 0, 4000);
}

function sanitizeEmail(string $value): string
{
    $value = trim(str_replace(["\r", "\n"], '', $value));
    if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
        return '';
    }
    return $value;
}

function respond(int $statusCode, array $payload): void
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function smtpSend(array $config, string $replyTo, string $subject, string $body): void
{
    $host = (string)$config['host'];
    $port = (int)$config['port'];
    $encryption = strtolower((string)$config['encryption']);
    $timeout = isset($config['timeout']) ? (int)$config['timeout'] : 20;
    $username = (string)$config['username'];
    $password = (string)$config['password'];
    $fromEmail = sanitizeEmail((string)$config['from_email']);
    $toEmail = sanitizeEmail((string)$config['to_email']);
    $fromName = sanitizeSingleLine((string)$config['from_name']);
    $heloDomain = sanitizeSingleLine((string)$config['helo_domain']);

    if ($fromEmail === '' || $toEmail === '' || $username === '' || $password === '' || $host === '' || $heloDomain === '') {
        throw new RuntimeException('Configuracion SMTP incompleta.');
    }

    $target = $encryption === 'ssl'
        ? sprintf('ssl://%s:%d', $host, $port)
        : sprintf('%s:%d', $host, $port);

    $socket = @stream_socket_client($target, $errno, $errstr, $timeout, STREAM_CLIENT_CONNECT);
    if (!is_resource($socket)) {
        throw new RuntimeException('No fue posible conectar al servidor SMTP.');
    }

    stream_set_timeout($socket, $timeout);

    try {
        expectCode($socket, [220]);
        sendCommand($socket, 'EHLO ' . $heloDomain, [250]);

        if ($encryption === 'tls') {
            sendCommand($socket, 'STARTTLS', [220]);
            $cryptoOk = stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            if ($cryptoOk !== true) {
                throw new RuntimeException('No se pudo iniciar TLS.');
            }
            sendCommand($socket, 'EHLO ' . $heloDomain, [250]);
        }

        sendCommand($socket, 'AUTH LOGIN', [334]);
        sendCommand($socket, base64_encode($username), [334]);
        sendCommand($socket, base64_encode($password), [235]);

        sendCommand($socket, 'MAIL FROM:<' . $fromEmail . '>', [250]);
        sendCommand($socket, 'RCPT TO:<' . $toEmail . '>', [250, 251]);
        sendCommand($socket, 'DATA', [354]);

        $headers = [
            'Date: ' . date(DATE_RFC2822),
            'From: ' . formatAddress($fromName, $fromEmail),
            'To: <' . $toEmail . '>',
            'Reply-To: <' . $replyTo . '>',
            'Subject: ' . encodeHeader($subject),
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: 8bit'
        ];

        $message = normalizeNewlines(implode("\r\n", $headers) . "\r\n\r\n" . $body);
        if (strpos($message, "\r\n.") !== false) {
            $message = str_replace("\r\n.", "\r\n..", $message);
        }
        if (strncmp($message, '.', 1) === 0) {
            $message = '.' . $message;
        }

        $written = fwrite($socket, $message . "\r\n.\r\n");
        if ($written === false) {
            throw new RuntimeException('No se pudo escribir el mensaje SMTP.');
        }

        expectCode($socket, [250]);
        sendCommand($socket, 'QUIT', [221]);
    } finally {
        fclose($socket);
    }
}

function sendCommand($socket, string $command, array $expectedCodes): string
{
    $written = fwrite($socket, $command . "\r\n");
    if ($written === false) {
        throw new RuntimeException('No se pudo enviar comando SMTP.');
    }
    return expectCode($socket, $expectedCodes);
}

function expectCode($socket, array $expectedCodes): string
{
    $response = '';

    while (!feof($socket)) {
        $line = fgets($socket, 2048);
        if ($line === false) {
            break;
        }

        $response .= $line;

        if (strlen($line) < 4 || $line[3] === ' ') {
            break;
        }
    }

    if ($response === '') {
        throw new RuntimeException('Sin respuesta del servidor SMTP.');
    }

    $code = (int)substr($response, 0, 3);
    if (!in_array($code, $expectedCodes, true)) {
        throw new RuntimeException('SMTP devolvio error: ' . trim($response));
    }

    return $response;
}

function encodeHeader(string $value): string
{
    if ($value === '') {
        return '';
    }

    if (function_exists('mb_encode_mimeheader')) {
        return mb_encode_mimeheader($value, 'UTF-8', 'B', "\r\n");
    }

    return '=?UTF-8?B?' . base64_encode($value) . '?=';
}

function formatAddress(string $name, string $email): string
{
    if ($name === '') {
        return '<' . $email . '>';
    }
    return encodeHeader($name) . ' <' . $email . '>';
}

function normalizeNewlines(string $value): string
{
    $value = str_replace(["\r\n", "\r"], "\n", $value);
    return str_replace("\n", "\r\n", $value);
}
