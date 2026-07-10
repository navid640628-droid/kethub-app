/**
 * figures.js
 * کمک‌کننده‌های مشترک برای بخش «مشاهیر»: واکشی داده، برچسب دسته‌بندی و کارت نمایشی
 */

const KetabBazFigures = (() => {
  let cache = null;

  async function fetchFigures(path = "data/figures.json") {
    if (cache) return cache;
    const res = await fetch(path);
    if (!res.ok) throw new Error("خطا در بارگذاری فهرست مشاهیر");
    cache = await res.json();
    return cache;
  }

  function categoryLabel(category) {
    return (
      {
        scientist: "دانشمند",
        philosopher: "فیلسوف",
        poet: "شاعر",
        writer: "نویسنده",
      }[category] || category
    );
  }

  function findById(figures, id) {
    return figures.find((f) => f.id === id);
  }

  function cardTemplate(figure, paths = {}) {
    const pagesPrefix = paths.pagesPrefix ?? "";
    const assetsPrefix = paths.assetsPrefix ?? "";
    const url = `${pagesPrefix}figure.html?id=${figure.id}`;
    return `
      <a class="figure-card" href="${url}">
        <div class="figure-card__photo">
          <img src="${assetsPrefix}${figure.photo}" alt="${figure.name}" loading="lazy" width="150" height="150">
        </div>
        <div class="figure-card__body">
          <h3 class="figure-card__name">${figure.name}</h3>
          <p class="figure-card__category">${categoryLabel(figure.category)}</p>
        </div>
      </a>
    `;
  }

  function renderGrid(container, figures, paths = {}) {
    if (!figures.length) {
      container.innerHTML = `<p class="empty-state">چهره‌ای با این مشخصات پیدا نشد.</p>`;
      return;
    }
    container.innerHTML = figures.map((f) => cardTemplate(f, paths)).join("");
  }

  return { fetchFigures, categoryLabel, findById, cardTemplate, renderGrid };
})();
