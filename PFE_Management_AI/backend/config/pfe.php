<?php

return [
    'auth' => [
        'access_token_minutes' => env('ACCESS_TOKEN_MINUTES', 30),
        'refresh_token_days' => env('REFRESH_TOKEN_DAYS', 14),
        'local_login_enabled' => env('LOCAL_LOGIN_ENABLED', false),
    ],
    'institutional_domains' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('GOOGLE_ALLOWED_DOMAINS', 'edu.uca.ma,uca.ma'))
    ))),
    'uploads' => [
        'max_kilobytes' => env('UPLOAD_MAX_KB', 15360),
        'document_mimes' => ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'zip'],
    ],
];
