# RatingSEO (статический сайт)

Чистый HTML / CSS / JS — без Next.js и Node.

## Локальный просмотр

```bash
cd site
python3 -m http.server 8080
```

Откройте http://localhost:8080

## Деплой на хостинг

Загрузите **всё содержимое папки `site/`** в корень сайта (public_html / www):

- `index.html`
- `styles.css`
- `app.js`
- `data.js`
- `favicon.svg`
- `og.png`
- `robots.txt`
- `sitemap.xml`

После привязки домена `ratingseo.ru` добавьте сайт в [Google Search Console](https://search.google.com/search-console) и [Яндекс.Вебмастер](https://webmaster.yandex.ru) и отправьте `https://ratingseo.ru/sitemap.xml`.

## Формы → email (Beget SMTP)

`mail()` на Beget часто не доставляет письма в Gmail. Нужен **SMTP** ящика.

1. Создайте ящик `info@ratingseo.ru` в панели Beget.
2. Откройте на сервере файл `mail-config.php` и впишите пароль:

```php
'smtp_pass' => 'ПАРОЛЬ_ОТ_ЯЩИКА',
```

3. Залейте обновлённые `send.php` и `mail-config.php`.
4. Отправьте тестовую заявку. Если ошибка — смотрите `mail-error.log` в той же папке.

Письма идут **на** `zdanovich.daniil@gmail.com` **от** `info@ratingseo.ru`.

Пароль в чат не присылайте — только в `mail-config.php` на хостинге.
