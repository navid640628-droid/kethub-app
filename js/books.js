/**
 * books.js
 * واکشی داده‌ی کتاب‌ها از JSON، فیلتر کردن و ساخت کارت‌های نمایشی
 */

const KetabBazBooks = (() => {
  let cache = null;

  async function fetchBooks(basePath = "data/books.json") {
    if (cache) return cache;
    const res = await fetch(basePath);
    if (!res.ok) throw new Error("خطا در بارگذاری فهرست کتاب‌ها");
    cache = await res.json();
    return cache;
  }

  function filterBooks(books, filters) {
    return books.filter((b) => {
      if (filters.genre && filters.genre !== "all" && b.genre !== filters.genre) return false;
      if (filters.type && filters.type !== "all" && b.type !== filters.type) return false;
      if (filters.language && filters.language !== "all" && b.language !== filters.language) return false;
      if (filters.rating && filters.rating !== "all" && b.rating !== filters.rating) return false;
      if (filters.query) {
        const q = filters.query.trim();
        if (q && !(b.title.includes(q) || b.author.includes(q) || (b.tags || []).some((t) => t.includes(q)))) {
          return false;
        }
      }
      return true;
    });
  }

  function findRelated(books, book, limit = 4) {
    return books
      .filter((b) => b.id !== book.id && (b.genre === book.genre || b.author === book.author))
      .slice(0, limit);
  }

  function findById(books, id) {
    return books.find((b) => b.id === id);
  }

  function typeLabel(type) {
    return { review: "نقد و بررسی", summary: "خلاصه کتاب", intro: "معرفی کتاب" }[type] || type;
  }

  function languageLabel(lang) {
    return { fa: "فارسی", translated: "ترجمه" }[lang] || lang;
  }

  function genreLabel(genre) {
    return (
      {
        novel: "رمان و داستان",
        science: "علمی و آموزشی",
        "self-growth": "توسعه فردی",
        "history-philosophy": "تاریخ و فلسفه",
        poetry: "شعر و ادبیات",
      }[genre] || genre
    );
  }

  /**
   * @param {Object} paths - { pagesPrefix, assetsPrefix }
   *   pagesPrefix: مسیر نسبی تا پوشه‌ی pages (از صفحه‌ی فعلی)
   *   assetsPrefix: مسیر نسبی تا ریشه‌ی سایت برای assets (از صفحه‌ی فعلی)
   */
  function cardTemplate(book, paths = {}) {
    const pagesPrefix = paths.pagesPrefix ?? "";
    const assetsPrefix = paths.assetsPrefix ?? "";
    const isFav = KetabBazStorage.isFavorite(book.id);
    const ribbon = book.rating === "top" ? '<span class="ribbon ribbon--top">برتر</span>' : book.rating === "special" ? '<span class="ribbon ribbon--special">پیشنهاد ویژه</span>' : "";
    const bookUrl = `${pagesPrefix}book.html?id=${book.id}`;
    const coverUrl = `${assetsPrefix}${book.cover}`;
    return `
      <article class="book-card" data-id="${book.id}" data-genre="${book.genre}" data-type="${book.type}" data-language="${book.language}" data-rating="${book.rating}">
        <a class="book-card__cover-link" href="${bookUrl}" aria-label="${book.title}">
          <div class="book-card__cover">
            <img src="${coverUrl}" alt="جلد کتاب ${book.title}" loading="lazy" width="220" height="320">
            ${ribbon}
          </div>
        </a>
        <div class="book-card__body">
          <h3 class="book-card__title"><a href="${bookUrl}">${book.title}</a></h3>
          <p class="book-card__author">${book.author}</p>
          <div class="book-card__meta">
            <span class="tag">${genreLabel(book.genre)}</span>
            <span class="tag tag--muted">${typeLabel(book.type)}</span>
          </div>
          <div class="book-card__footer">
            <span class="score" aria-label="امتیاز ${book.score} از ۵">★ ${book.score}</span>
            <button class="fav-btn ${isFav ? "is-active" : ""}" data-fav-id="${book.id}" aria-pressed="${isFav}" title="افزودن به علاقه‌مندی‌ها">
              ${isFav ? "♥" : "♡"}
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function renderGrid(container, books, paths = {}) {
    if (!books.length) {
      container.innerHTML = `<p class="empty-state">کتابی با این مشخصات پیدا نشد. فیلترها را تغییر بده.</p>`;
      return;
    }
    container.innerHTML = books.map((b) => cardTemplate(b, paths)).join("");
    bindFavButtons(container);
  }

  function bindFavButtons(container) {
    container.querySelectorAll("[data-fav-id]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const id = btn.getAttribute("data-fav-id");
        const active = KetabBazStorage.toggleFavorite(id);
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-pressed", String(active));
        btn.textContent = active ? "♥" : "♡";
      });
    });
  }

  return {
    fetchBooks,
    filterBooks,
    findRelated,
    findById,
    typeLabel,
    languageLabel,
    genreLabel,
    cardTemplate,
    renderGrid,
    bindFavButtons,
  };
})();
