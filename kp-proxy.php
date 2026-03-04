<?php
/**
 * kp-proxy.php — прокси к Kinopoisk Unofficial API.
 *
 * Назначение:
 * - обход CORS (браузер ходит к вашему домену, сервер — к API Kinopoisk);
 * - хранение API-токена на сервере, без передачи во фронтенд.
 *
 * Пример:
 *   /kp-proxy.php?path=/v1.4/movie/301
 *   /kp-proxy.php?path=/api/v2.2/films/301/images&page=1&type=STILL
 *
 * Ограничения:
 * - проксируется только path, начинающийся с /api/ или /v<версия>/;
 * - запрещены абсолютные URL (https://...) и попытки ../.
 *
 * Совместимость:
 * - без strict_types и без новых языковых возможностей,
 *   чтобы не ломать запуск на старых конфигурациях PHP.
 */

header("X-Content-Type-Options: nosniff");

function json_error($status, $payload)
{
    http_response_code($status);
    header("Content-Type: application/json; charset=utf-8");
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Возвращает значение заголовка (после двоеточия), если строка заголовка начинается с $headerPrefix.
 * Иначе возвращает null.
 */
function extract_header_value($line, $headerPrefix)
{
    if (stripos($line, $headerPrefix) !== 0) {
        return null;
    }

    return trim(substr($line, strlen($headerPrefix)));
}

/**
 * Возвращает первый непустой токен из окружения/конфига по списку ключей.
 *
 * @param array $cfg
 * @param array $keys
 * @return array [token, source]
 */
function resolve_token($cfg, $keys)
{
    foreach ($keys as $key) {
        $env = getenv($key);
        if ($env !== false && trim((string)$env) !== "") {
            return array((string)$env, "getenv:" . $key);
        }

        if (isset($_SERVER[$key]) && trim((string)$_SERVER[$key]) !== "") {
            return array((string)$_SERVER[$key], "_SERVER:" . $key);
        }

        if (isset($_ENV[$key]) && trim((string)$_ENV[$key]) !== "") {
            return array((string)$_ENV[$key], "_ENV:" . $key);
        }

        if (isset($cfg[$key]) && trim((string)$cfg[$key]) !== "") {
            return array((string)$cfg[$key], "config:" . $key);
        }
    }

    return array("", "none");
}

// ====== Загрузка конфигурации ======
$cfgFile = __DIR__ . "/kp-proxy.config.php";
$cfg = array();
$cfgLoaded = false;
if (is_file($cfgFile) && is_readable($cfgFile)) {
    $tmp = @include $cfgFile;
    if (is_array($tmp)) {
        $cfg = $tmp;
        $cfgLoaded = true;
    }
}

$upstreamUnofficial = isset($cfg["UPSTREAM_UNOFFICIAL"])
    ? (string)$cfg["UPSTREAM_UNOFFICIAL"]
    : (isset($cfg["UPSTREAM"]) ? (string)$cfg["UPSTREAM"] : "https://kinopoiskapiunofficial.tech");

// ====== Валидация входных параметров ======
$path = isset($_GET["path"]) ? trim((string)$_GET["path"]) : "";
if ($path === "") {
    json_error(400, array("error" => "missing 'path' query param"));
}

// Path должен быть относительным и в пределах /api/*.
if (preg_match('~^https?://~i', $path)) {
    json_error(400, array("error" => "absolute URL is not allowed"));
}
if (strpos($path, "..") !== false) {
    json_error(400, array("error" => "invalid path"));
}
if (substr($path, 0, 1) !== "/") {
    $path = "/" . $path;
}

// Разрешаем ветки /api/* и /v<версия>/*.
$isUnofficial = (strpos($path, "/api/") === 0);
$isVersioned = (bool)preg_match('~^/v\d+(?:\.\d+)?/~i', $path);

if (!$isUnofficial && !$isVersioned) {
    json_error(403, array("error" => "forbidden path (allowed only /api/* or /v*/*)"));
}

$resolved = resolve_token($cfg, array("KP_UNOFFICIAL_TOKEN", "KP_TOKEN"));
$token = trim((string)$resolved[0]);
$tokenSource = (string)$resolved[1];
$upstream = $upstreamUnofficial;

// Диагностика без раскрытия токена.
header("X-KP-Proxy-Config: " . ($cfgLoaded ? "loaded" : "missing"));
header("X-KP-Proxy-Mode: " . ($isVersioned ? "versioned" : "unofficial"));
header("X-KP-Proxy-Token-Source: " . ($tokenSource !== "" ? $tokenSource : "none"));

if ($token === "") {
    $required = "KP_UNOFFICIAL_TOKEN (или KP_TOKEN)";
    error_log("[kp-proxy] Token is empty; required=" . $required . "; cfgLoaded=" . ($cfgLoaded ? "1" : "0"));
    json_error(500, array(
        "error" => "API token не задан. Требуется: " . $required,
        "diagnostics" => array(
            "config_loaded" => $cfgLoaded,
            "config_exists" => is_file($cfgFile),
            "config_readable" => is_readable($cfgFile),
            "mode" => "unofficial",
            "token_source" => $tokenSource !== "" ? $tokenSource : "none",
        ),
    ));
}

// ====== Подготовка URL апстрима ======
// В query передаём все параметры, кроме path.
$params = $_GET;
unset($params["path"]);
$query = http_build_query($params);

$targetUrl = rtrim($upstream, "/") . $path . ($query ? ("?" . $query) : "");

// ====== Запрос к апстриму ======
$body = false;
$status = 0;
$contentType = "application/json; charset=utf-8";
$cacheControl = null;

// Предпочтительный путь: cURL.
if (function_exists("curl_init")) {
    $ch = curl_init($targetUrl);
    curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_HEADER => true,
        CURLOPT_HTTPHEADER => array(
            "X-API-KEY: " . $token,
            "Accept: application/json",
            "User-Agent: PoiskKinoProxy/1.0",
        ),
    ));

    $raw = curl_exec($ch);
    if ($raw === false) {
        $err = curl_error($ch);
        curl_close($ch);
        json_error(502, array("error" => "upstream fetch failed", "details" => $err));
    }

    $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $hdrSize = (int)curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    curl_close($ch);

    $rawHeaders = substr($raw, 0, $hdrSize);
    $body = substr($raw, $hdrSize);

    // Если заголовок встретился несколько раз, остаётся последнее значение.
    foreach (preg_split("/\r\n|\n|\r/", $rawHeaders) as $line) {
        $contentTypeValue = extract_header_value($line, "Content-Type:");
        if ($contentTypeValue !== null) {
            $contentType = $contentTypeValue;
        }

        $cacheControlValue = extract_header_value($line, "Cache-Control:");
        if ($cacheControlValue !== null) {
            $cacheControl = $cacheControlValue;
        }
    }
} else {
    // Резервный путь без cURL (через allow_url_fopen + file_get_contents).
    if (!ini_get("allow_url_fopen")) {
        json_error(500, array("error" => "На хостинге отключён cURL и allow_url_fopen. Включите хотя бы одно из них или используйте другой тариф/настройку PHP."));
    }

    $opts = array(
        "http" => array(
            "method" => "GET",
            "header" => "X-API-KEY: " . $token . "\r\n"
                . "Accept: application/json\r\n"
                . "User-Agent: PoiskKinoProxy/1.0\r\n",
            "timeout" => 20,
        ),
    );
    $ctx = stream_context_create($opts);
    $body = @file_get_contents($targetUrl, false, $ctx);
    if ($body === false) {
        json_error(502, array("error" => "upstream fetch failed (no curl)", "details" => "file_get_contents failed"));
    }

    // При file_get_contents код/заголовки берём из $http_response_header.
    $status = 200;
    if (isset($http_response_header) && is_array($http_response_header)) {
        foreach ($http_response_header as $h) {
            if (preg_match('~^HTTP/\S+\s+(\d{3})~', $h, $m)) {
                $status = (int)$m[1];
            }

            $contentTypeValue = extract_header_value($h, "Content-Type:");
            if ($contentTypeValue !== null) {
                $contentType = $contentTypeValue;
            }

            $cacheControlValue = extract_header_value($h, "Cache-Control:");
            if ($cacheControlValue !== null) {
                $cacheControl = $cacheControlValue;
            }
        }
    }
}

// ====== Ответ клиенту ======
http_response_code($status);
header("Content-Type: " . $contentType);
if ($cacheControl) {
    header("Cache-Control: " . $cacheControl);
}
echo $body;
