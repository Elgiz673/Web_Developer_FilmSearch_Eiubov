<?php
/**
 * Конфигурация прокси к Kinopoisk Unofficial API.
 *
 * Токен должен храниться только на сервере.
 * Предпочтительно задавать KP_TOKEN через переменные окружения хостинга.
 */

// ====== Параметры прокси ======
return array(
    // Токен Kinopoisk Unofficial API (/api/*).
    "KP_UNOFFICIAL_TOKEN" => "8e4760c5-ca3d-4a7a-bc14-9713c3eb41f4",

    // Общий fallback-токен.
    // Можно использовать вместо KP_UNOFFICIAL_TOKEN.
    "KP_TOKEN" => "",

    // Базовый адрес апстрима Unofficial API (ветка /api/*).
    "UPSTREAM_UNOFFICIAL" => "https://kinopoiskapiunofficial.tech",

    // Обратная совместимость со старым ключом конфигурации.
    "UPSTREAM" => "https://kinopoiskapiunofficial.tech",
);
