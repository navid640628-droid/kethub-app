/**
 * seo.js
 * تزریق داینامیک متا تگ‌ها و داده‌های ساختاریافته (JSON-LD) برای هر صفحه
 */

const KetabBazSEO = (() => {
  function setMeta(name, content) {
    if (!content) return;
    let el = document.querySelector(`meta[name="${name}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", name);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }

  function setOgMeta(property, content) {
    if (!content) return;
    let el = document.querySelector(`meta[property="${property}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("property", property);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }

  function setTitle(title) {
    document.title = title;
    setOgMeta("og:title", title);
  }

  function applyPageMeta({ title, description, keywords, image, url }) {
    if (title) setTitle(title);
    if (description) {
      setMeta("description", description);
      setOgMeta("og:description", description);
    }
    if (keywords && keywords.length) {
      setMeta("keywords", keywords.join("، "));
    }
    if (image) setOgMeta("og:image", image);
    if (url) setOgMeta("og:url", url);
    setOgMeta("og:type", "book");
  }

  function injectJSONLD(data, id) {
    const scriptId = id || "kb-jsonld";
    let el = document.getElementById(scriptId);
    if (!el) {
      el = document.createElement("script");
      el.type = "application/ld+json";
      el.id = scriptId;
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
  }

  function buildBookSchema(book, pageUrl) {
    return {
      "@context": "https://schema.org",
      "@type": "Book",
      name: book.title,
      author: {
        "@type": "Person",
        name: book.author,
      },
      inLanguage: book.language === "fa" ? "fa" : "fa-translated",
      description: book.summary,
      url: pageUrl,
      aggregateRating: book.score
        ? {
            "@type": "AggregateRating",
            ratingValue: book.score,
            bestRating: "5",
          }
        : undefined,
      keywords: (book.tags || []).join("، "),
    };
  }

  function buildBreadcrumb(items) {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        item: item.url,
      })),
    };
  }

  return {
    setMeta,
    setOgMeta,
    setTitle,
    applyPageMeta,
    injectJSONLD,
    buildBookSchema,
    buildBreadcrumb,
  };
})();
