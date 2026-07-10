"""
generate-sitemap.py
این اسکریپت را هر بار که کتاب، مشاهیر یا دسته‌بندی جدیدی اضافه کردی، محلی (روی
کامپیوتر خودت) اجرا کن تا sitemap.xml به‌روز شود. نیازی به اجرا روی Cloudflare نیست.

اجرا:
    python3 generate-sitemap.py

پیش‌نیاز: پایتون ۳ (بدون نیاز به نصب پکیج اضافه)
"""
import json
from datetime import date

books = json.load(open("data/books.json", encoding="utf-8"))
figures = json.load(open("data/figures.json", encoding="utf-8"))
categories = json.load(open("data/categories.json", encoding="utf-8"))

BASE_URL = "https://kethub.ir"  # اگر دامنه عوض شد، همین‌جا تغییرش بده
today = date.today().isoformat()

urls = []
urls.append((f"{BASE_URL}/", "1.0"))
urls.append((f"{BASE_URL}/pages/podcasts.html", "0.8"))
urls.append((f"{BASE_URL}/pages/marginalia.html", "0.8"))
urls.append((f"{BASE_URL}/pages/figures.html", "0.8"))

for g in categories["genres"]:
    urls.append((f"{BASE_URL}/pages/category.html?genre={g['id']}", "0.7"))

for b in books:
    urls.append((f"{BASE_URL}/pages/book.html?id={b['id']}", "0.9"))

for f in figures:
    urls.append((f"{BASE_URL}/pages/figure.html?id={f['id']}", "0.7"))

xml_parts = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
]
for url, priority in urls:
    xml_parts.append(
        f"  <url>\n    <loc>{url}</loc>\n    <lastmod>{today}</lastmod>\n    <priority>{priority}</priority>\n  </url>"
    )
xml_parts.append("</urlset>")

with open("sitemap.xml", "w", encoding="utf-8") as f:
    f.write("\n".join(xml_parts) + "\n")

print(f"sitemap.xml با {len(urls)} آدرس به‌روزرسانی شد.")
