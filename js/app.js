/**
 * app.js
 * نقطه‌ی ورود صفحه‌ی اصلی: بارگذاری داده‌ها، فیلترها و رندر شبکه‌ی کتاب‌ها
 */

(async function initHome() {
  KetabBazStorage.getUserId(); // اطمینان از ساخت شناسه‌ی کاربر

  const grid = document.getElementById("book-grid");
  const searchInput = document.getElementById("search-input");
  const filterGenre = document.getElementById("filter-genre");
  const filterType = document.getElementById("filter-type");
  const filterLanguage = document.getElementById("filter-language");
  const filterRating = document.getElementById("filter-rating");
  const resultCount = document.getElementById("result-count");

  KetabBazSEO.applyPageMeta({
    title: "کتاب‌باز | معرفی، نقد و خلاصه‌ی کتاب به زبان فارسی",
    description: "کتاب‌باز مرجع معرفی، نقد و خلاصه‌ی کتاب‌های فارسی و ترجمه، همراه با کتاب صوتی و پادکست ادبی.",
    keywords: ["کتاب‌باز", "معرفی کتاب", "نقد کتاب", "خلاصه کتاب", "کتاب صوتی فارسی"],
  });

  let allBooks = [];

  try {
    allBooks = await KetabBazBooks.fetchBooks("data/books.json");
  } catch (err) {
    grid.innerHTML = `<p class="empty-state">مشکلی در بارگذاری کتاب‌ها پیش آمد. لطفاً صفحه را دوباره بارگذاری کن.</p>`;
    return;
  }

  function currentFilters() {
    return {
      genre: filterGenre.value,
      type: filterType.value,
      language: filterLanguage.value,
      rating: filterRating.value,
      query: searchInput.value,
    };
  }

  function applyFilters() {
    const filtered = KetabBazBooks.filterBooks(allBooks, currentFilters());
    KetabBazBooks.renderGrid(grid, filtered, { pagesPrefix: "pages/", assetsPrefix: "" });
    resultCount.textContent = `${filtered.length} کتاب`;
  }

  [filterGenre, filterType, filterLanguage, filterRating].forEach((el) => {
    el.addEventListener("change", applyFilters);
  });

  let debounceTimer;
  searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(applyFilters, 200);
  });

  applyFilters();

  // ثبت Service Worker برای قابلیت PWA
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }
})();
