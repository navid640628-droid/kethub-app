/**
 * bottom-nav.js
 * نوار ناوبری ثابت پایین صفحه، مخصوص موبایل (مهم‌ترین بخش‌های سایت همیشه در دسترس)
 * این اسکریپت باید در همه‌ی صفحات لود شود؛ به‌طور خودکار مسیر نسبی درست را
 * بر اساس محل قرارگیری صفحه‌ی فعلی (ریشه یا داخل /pages/) تشخیص می‌دهد.
 */

(function initBottomNav() {
  const inPagesFolder = window.location.pathname.includes("/pages/");
  const root = inPagesFolder ? "../" : "./";
  const pages = inPagesFolder ? "" : "pages/";

  const items = [
    { key: "books", label: "کتاب‌ها", icon: "📚", href: root },
    { key: "podcasts", label: "پادکست", icon: "🎧", href: `${pages}podcasts.html` },
    { key: "marginalia", label: "حاشیه‌ها", icon: "🗒", href: `${pages}marginalia.html` },
    { key: "figures", label: "مشاهیر", icon: "🎭", href: `${pages}figures.html` },
    { key: "library", label: "کتابخانه", icon: "🗂", href: `${pages}my-library.html` },
  ];

  const path = window.location.pathname;
  function isActive(item) {
    if (item.key === "books") {
      return (
        path.endsWith("/") ||
        path.endsWith("index.html") ||
        path === "" ||
        path.includes("book.html") ||
        path.includes("category.html")
      );
    }
    if (item.key === "podcasts") return path.includes("podcasts.html");
    if (item.key === "marginalia") return path.includes("marginalia.html");
    if (item.key === "figures") return path.includes("figures.html") || path.includes("figure.html");
    if (item.key === "library") return path.includes("my-library.html");
    return false;
  }

  const nav = document.createElement("nav");
  nav.className = "bottom-nav";
  nav.setAttribute("aria-label", "ناوبری اصلی موبایل");
  nav.innerHTML = items
    .map(
      (item) => `
      <a class="bottom-nav__item ${isActive(item) ? "is-active" : ""}" href="${item.href}">
        <span class="bottom-nav__icon" aria-hidden="true">${item.icon}</span>
        <span class="bottom-nav__label">${item.label}</span>
      </a>
    `
    )
    .join("");

  document.body.appendChild(nav);
  document.body.classList.add("has-bottom-nav");
})();
