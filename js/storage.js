/**
 * storage.js
 * لایه‌ی مدیریت ذخیره‌سازی محلی (localStorage) کتاب‌باز
 * مسئولیت‌ها: شناسه‌ی کاربر، علاقه‌مندی‌ها، موقعیت پخش صوتی
 */

const KetabBazStorage = (() => {
  const KEYS = {
    USER_ID: "kb_user_id",
    FAVORITES: "kb_favorites",
    PLAYBACK: "kb_playback_positions",
  };

  function safeGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  // ---------- شناسه‌ی کاربر ----------
  function getUserId() {
    let id = localStorage.getItem(KEYS.USER_ID);
    if (!id) {
      id = "kb_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(KEYS.USER_ID, id);
    }
    return id;
  }

  // ---------- علاقه‌مندی‌ها ----------
  function getFavorites() {
    return safeGet(KEYS.FAVORITES, []);
  }

  function isFavorite(bookId) {
    return getFavorites().includes(bookId);
  }

  function toggleFavorite(bookId) {
    const favs = getFavorites();
    const idx = favs.indexOf(bookId);
    if (idx > -1) {
      favs.splice(idx, 1);
    } else {
      favs.push(bookId);
    }
    safeSet(KEYS.FAVORITES, favs);
    return favs.includes(bookId);
  }

  // ---------- موقعیت پخش صوتی ----------
  function getPlaybackPosition(trackId) {
    const positions = safeGet(KEYS.PLAYBACK, {});
    return positions[trackId] || 0;
  }

  function setPlaybackPosition(trackId, seconds) {
    const positions = safeGet(KEYS.PLAYBACK, {});
    positions[trackId] = seconds;
    safeSet(KEYS.PLAYBACK, positions);
  }

  function clearPlaybackPosition(trackId) {
    const positions = safeGet(KEYS.PLAYBACK, {});
    delete positions[trackId];
    safeSet(KEYS.PLAYBACK, positions);
  }

  return {
    getUserId,
    getFavorites,
    isFavorite,
    toggleFavorite,
    getPlaybackPosition,
    setPlaybackPosition,
    clearPlaybackPosition,
  };
})();
