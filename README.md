# کتاب‌باز — پروژه‌ی PWA کتاب، کتاب صوتی و پادکست

پروژه‌ای سبک و بدون بک‌اند، فقط با HTML + CSS + JavaScript خام، برای انتشار روزانه‌ی محتوای کتاب.

## ساختار پوشه‌ها

```
/
├── index.html              صفحه‌ی اصلی (لیست کتاب‌ها، فیلتر، جست‌وجو، پادکست‌ها)
├── manifest.json           تنظیمات PWA
├── sw.js                   سرویس ورکر (کش آفلاین)
├── assets/
│   ├── images/
│   ├── icons/              آیکون‌های اپ (icon-192.svg, icon-512.svg)
│   └── covers/             جلد کتاب‌ها و پادکست‌ها
├── data/
│   ├── books.json          ← فقط همین فایل را برای افزودن کتاب ویرایش کن
│   ├── podcasts.json       ← برای افزودن قسمت جدید پادکست
│   └── categories.json     ژانرها، نوع محتوا، زبان، امتیاز
├── js/
│   ├── app.js               راه‌انداز صفحه‌ی اصلی
│   ├── books.js             واکشی/فیلتر/رندر کتاب‌ها
│   ├── audio-player.js       پلیر صوتی اختصاصی (کتاب صوتی + پادکست)
│   ├── storage.js            علاقه‌مندی، شناسه‌ی کاربر، موقعیت پخش
│   └── seo.js                متا تگ‌های داینامیک و JSON-LD
├── css/
│   ├── style.css
│   └── responsive.css
└── pages/
    ├── book.html             صفحه‌ی اختصاصی هر کتاب (book.html?id=...)
    └── category.html         صفحه‌ی دسته‌بندی (category.html?genre=novel)
```

## افزودن کتاب جدید (بدون نیاز به تغییر کد)

در گیت‌هاب، فایل `data/books.json` را باز کن و یک آبجکت جدید **در ابتدای آرایه** اضافه کن:

```json
{
  "id": "shناسه-یکتا-انگلیسی",
  "title": "عنوان کتاب",
  "author": "نویسنده",
  "genre": "novel",
  "language": "fa",
  "type": "review",
  "rating": "top",
  "score": 4.5,
  "cover": "assets/covers/نام-فایل.svg",
  "audio": null,
  "pdf": null,
  "summary": "خلاصه‌ی کوتاه کتاب...",
  "highlights": ["نکته ۱", "نکته ۲", "نکته ۳"],
  "telegram": "https://t.me/kmketab",
  "tags": ["برچسب۱", "برچسب۲"]
}
```

مقادیر مجاز:
- `genre`: novel, science, self-growth, history-philosophy, poetry
- `language`: fa, translated
- `type`: review, summary, intro
- `rating`: top, special (یا حذف این فیلد برای کتاب‌های عادی)

برای افزودن کتاب صوتی، مقدار `audio` را مسیر فایل mp3 (مثلاً `assets/audio/کتاب/ch1.mp3`) قرار بده. برای PDF هم همین‌طور. `id` باید یکتا و بدون فاصله باشد (لاتین یا اسلاگ فارسی-لاتین).

جلد کتاب را هم به‌صورت svg یا jpg/png در `assets/covers/` آپلود کن.

## افزودن قسمت جدید پادکست

فایل `data/podcasts.json` را باز کن و یک آبجکت جدید در ابتدای آرایه اضافه کن (ساختار مشابه است: title, host, cover, audio, duration, description).

## دیپلوی

پروژه هیچ مرحله‌ی build ندارد؛ کافی‌ست ریشه‌ی همین پوشه را روی Cloudflare Pages دیپلوی کنی (Build command خالی، Output directory = `/`).

## نکات فنی

- برای اجرای محلی باید از یک سرور استاتیک ساده استفاده کنی (مثلاً افزونه‌ی Live Server)، چون `fetch` روی `file://` در برخی مرورگرها کار نمی‌کند.
- آیکون‌های `assets/icons/` به‌صورت SVG placeholder هستند؛ برای پشتیبانی کامل‌تر از موبایل‌های قدیمی‌تر، بهتر است نسخه‌ی PNG (192×192 و 512×512) هم اضافه کنی.
