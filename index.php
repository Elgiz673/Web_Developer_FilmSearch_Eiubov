<?php
/**
 * Файл-обёртка для хостингов, где index.php имеет приоритет над index.html.
 *
 * Реальная точка входа проекта — index.html.
 * Этот файл только отдаёт его содержимое без изменения фронтенд-логики.
 */

// ====== Подготовка пути к основному HTML ======
$indexHtml = __DIR__ . DIRECTORY_SEPARATOR . 'index.html';

// ====== Ответ клиенту ======
header('Content-Type: text/html; charset=UTF-8');

if (is_file($indexHtml)) {
    readfile($indexHtml);
    exit;
}

http_response_code(404);
echo 'index.html not found';
