/**
 * library.js
 * کتابخانه‌ی شخصی مطالعه (بدون نیاز به ثبت‌نام؛ تمام داده در همین مرورگر ذخیره می‌شود)
 * مسئولیت‌ها: افزودن کتاب به قفسه، تغییر وضعیت، برنامه‌ریزی مطالعه، ثبت روزانه، محاسبه‌ی پیشرفت
 */

const KetabBazLibrary = (() => {
  const KEY = "kb_library_v1";

  const STATUS = {
    WANT: "want",
    READING: "reading",
    READ: "read",
    DROPPED: "dropped",
  };

  function safeGet() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function safeSet(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function genId() {
    return "lib_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // ---------- خواندن ----------
  function getAll() {
    return safeGet();
  }

  function get(id) {
    return safeGet()[id] || null;
  }

  function getByStatus(status) {
    const all = safeGet();
    return Object.values(all)
      .filter((e) => e.status === status)
      .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  }

  // اگر این کتاب کاتالوگ (bookId) قبلاً در کتابخانه ثبت شده باشد، آن را برمی‌گرداند
  function findByBookId(bookId) {
    const all = safeGet();
    return Object.values(all).find((e) => e.bookId === bookId) || null;
  }

  // ---------- افزودن ----------
  function addFromCatalog(book, status = STATUS.WANT) {
    const existing = findByBookId(book.id);
    if (existing) return existing;

    const all = safeGet();
    const id = genId();
    const now = new Date().toISOString();
    const entry = {
      id,
      bookId: book.id,
      title: book.title,
      author: book.author,
      cover: book.cover || null,
      totalPages: book.pages || null,
      status,
      startDate: status === STATUS.READING ? todayISO() : null,
      endDate: status === STATUS.READ ? todayISO() : null,
      rating: null,
      note: "",
      plan: null,
      logs: {}, // { "YYYY-MM-DD": pagesReadThatDay }
      createdAt: now,
      updatedAt: now,
    };
    all[id] = entry;
    safeSet(all);
    return entry;
  }

  function addCustom({ title, author, totalPages }, status = STATUS.WANT) {
    const all = safeGet();
    const id = genId();
    const now = new Date().toISOString();
    const entry = {
      id,
      bookId: null,
      title: title || "کتاب بدون عنوان",
      author: author || "",
      cover: null,
      totalPages: totalPages || null,
      status,
      startDate: status === STATUS.READING ? todayISO() : null,
      endDate: status === STATUS.READ ? todayISO() : null,
      rating: null,
      note: "",
      plan: null,
      logs: {},
      createdAt: now,
      updatedAt: now,
    };
    all[id] = entry;
    safeSet(all);
    return entry;
  }

  // ---------- ویرایش ----------
  function update(id, patch) {
    const all = safeGet();
    if (!all[id]) return null;
    all[id] = { ...all[id], ...patch, updatedAt: new Date().toISOString() };
    safeSet(all);
    return all[id];
  }

  function setStatus(id, status) {
    const entry = get(id);
    if (!entry) return null;
    const patch = { status };
    if (status === STATUS.READING && !entry.startDate) patch.startDate = todayISO();
    if (status === STATUS.READ) patch.endDate = todayISO();
    if (status !== STATUS.READ) patch.endDate = entry.status === STATUS.READ ? null : entry.endDate;
    return update(id, patch);
  }

  function remove(id) {
    const all = safeGet();
    delete all[id];
    safeSet(all);
  }

  function setRatingNote(id, { rating, note }) {
    return update(id, { rating, note });
  }

  // ---------- برنامه‌ریزی مطالعه ----------
  /**
   * hoursPerDay: چند ساعت آزاد در روز
   * pagesPerHour: سرعت مطالعه (پیش‌فرض ۲۰ صفحه در ساعت، قابل تنظیم)
   */
  function setPlan(id, { hoursPerDay, pagesPerHour, totalPages }) {
    const entry = get(id);
    if (!entry) return null;
    const patch = {
      plan: {
        hoursPerDay: Number(hoursPerDay) || 1,
        pagesPerHour: Number(pagesPerHour) || 20,
      },
    };
    if (totalPages) patch.totalPages = Number(totalPages);
    if (!entry.startDate) patch.startDate = todayISO();
    return update(id, patch);
  }

  function clearPlan(id) {
    return update(id, { plan: null });
  }

  // ---------- ثبت مطالعه‌ی روزانه ----------
  function logToday(id, pages) {
    const entry = get(id);
    if (!entry) return null;
    const logs = { ...(entry.logs || {}) };
    logs[todayISO()] = Math.max(0, Number(pages) || 0);
    return update(id, { logs });
  }

  function getLogHistory(id) {
    const entry = get(id);
    if (!entry) return [];
    return Object.entries(entry.logs || {})
      .map(([date, pages]) => ({ date, pages }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  // ---------- محاسبه‌ی پیشرفت ----------
  function getProgress(id) {
    const entry = get(id);
    if (!entry) return null;

    const pagesReadTotal = Object.values(entry.logs || {}).reduce((sum, p) => sum + p, 0);
    const totalPages = entry.totalPages || null;
    const percent = totalPages ? Math.min(100, Math.round((pagesReadTotal / totalPages) * 100)) : null;

    let pagesPerDayTarget = null;
    let projectedFinishDate = null;
    let daysRemaining = null;
    let paceStatus = null; // 'ahead' | 'on_track' | 'behind'

    if (entry.plan && totalPages) {
      pagesPerDayTarget = Math.max(1, Math.round(entry.plan.hoursPerDay * entry.plan.pagesPerHour));
      const pagesRemaining = Math.max(0, totalPages - pagesReadTotal);
      daysRemaining = Math.ceil(pagesRemaining / pagesPerDayTarget);

      const finish = new Date();
      finish.setDate(finish.getDate() + daysRemaining);
      projectedFinishDate = finish.toISOString().slice(0, 10);

      if (entry.startDate) {
        const start = new Date(entry.startDate);
        const today = new Date(todayISO());
        const daysSinceStart = Math.max(0, Math.round((today - start) / 86400000));
        const expectedByNow = Math.min(totalPages, daysSinceStart * pagesPerDayTarget);
        if (pagesReadTotal >= expectedByNow + pagesPerDayTarget * 0.5) paceStatus = "ahead";
        else if (pagesReadTotal < expectedByNow - pagesPerDayTarget * 0.5) paceStatus = "behind";
        else paceStatus = "on_track";
      }
    }

    return {
      pagesReadTotal,
      totalPages,
      percent,
      pagesPerDayTarget,
      projectedFinishDate,
      daysRemaining,
      paceStatus,
    };
  }

  // ---------- آمار کلی (برای صفحه‌ی شخصی) ----------
  function getStats() {
    const all = Object.values(safeGet());
    const totalPagesRead = all.reduce((sum, e) => sum + Object.values(e.logs || {}).reduce((s, p) => s + p, 0), 0);
    return {
      readCount: all.filter((e) => e.status === STATUS.READ).length,
      readingCount: all.filter((e) => e.status === STATUS.READING).length,
      wantCount: all.filter((e) => e.status === STATUS.WANT).length,
      droppedCount: all.filter((e) => e.status === STATUS.DROPPED).length,
      totalPagesRead,
    };
  }

  return {
    STATUS,
    getAll,
    get,
    getByStatus,
    findByBookId,
    addFromCatalog,
    addCustom,
    update,
    setStatus,
    remove,
    setRatingNote,
    setPlan,
    clearPlan,
    logToday,
    getLogHistory,
    getProgress,
    getStats,
  };
})();
