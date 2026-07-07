/**
 * audio-player.js
 * پلیر صوتی اختصاصی برای کتاب‌های صوتی و پادکست‌ها
 * بدون وابستگی به کتابخانه‌ی خارجی - فقط HTML5 Audio API
 */

class KetabBazAudioPlayer {
  /**
   * @param {HTMLElement} mountEl - المنتی که پلیر داخل آن رندر می‌شود
   * @param {Array}  tracks - [{ id, title, subtitle, src }]
   * @param {Object} options - { startIndex }
   */
  constructor(mountEl, tracks, options = {}) {
    this.mountEl = mountEl;
    this.tracks = tracks || [];
    this.currentIndex = options.startIndex || 0;
    this.audio = new Audio();
    this.audio.preload = "metadata";
    this.speeds = [0.75, 1, 1.25, 1.5, 1.75, 2];
    this.speedIndex = 1;
    this.isSeeking = false;

    this._render();
    this._bindEvents();
    if (this.tracks.length > 1) {
      this._renderChapterList();
    }
    this._loadTrack(this.currentIndex, false);
  }

  get currentTrack() {
    return this.tracks[this.currentIndex];
  }

  _render() {
    this.mountEl.innerHTML = `
      <div class="kb-player" role="region" aria-label="پخش‌کننده صوتی">
        <div class="kb-player__meta">
          <div class="kb-player__title" data-el="title">—</div>
          <div class="kb-player__subtitle" data-el="subtitle"></div>
        </div>

        <div class="kb-player__seek">
          <span class="kb-player__time" data-el="current-time">۰:۰۰</span>
          <div class="kb-player__bar" data-el="bar" tabindex="0" role="slider" aria-label="نوار پیشرفت" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
            <div class="kb-player__bar-track"></div>
            <div class="kb-player__bar-fill" data-el="fill"></div>
            <div class="kb-player__bar-handle" data-el="handle"></div>
          </div>
          <span class="kb-player__time" data-el="duration">۰:۰۰</span>
        </div>

        <div class="kb-player__controls">
          <button class="kb-btn" data-action="prev" title="فایل قبلی" aria-label="فایل قبلی">⏪</button>
          <button class="kb-btn" data-action="back10" title="۱۰ ثانیه عقب" aria-label="۱۰ ثانیه عقب">⏮</button>
          <button class="kb-btn kb-btn--play" data-action="toggle" title="پخش" aria-label="پخش">▶</button>
          <button class="kb-btn" data-action="fwd10" title="۱۰ ثانیه جلو" aria-label="۱۰ ثانیه جلو">⏭</button>
          <button class="kb-btn" data-action="next" title="فایل بعدی" aria-label="فایل بعدی">⏩</button>
        </div>

        <div class="kb-player__extra">
          <div class="kb-player__volume">
            <span aria-hidden="true">🔊</span>
            <input type="range" min="0" max="1" step="0.01" value="1" data-el="volume" aria-label="حجم صدا">
          </div>
          <button class="kb-speed" data-action="speed" title="سرعت پخش">۱x</button>
        </div>
      </div>
    `;
    this.els = {
      title: this.mountEl.querySelector('[data-el="title"]'),
      subtitle: this.mountEl.querySelector('[data-el="subtitle"]'),
      currentTime: this.mountEl.querySelector('[data-el="current-time"]'),
      duration: this.mountEl.querySelector('[data-el="duration"]'),
      bar: this.mountEl.querySelector('[data-el="bar"]'),
      fill: this.mountEl.querySelector('[data-el="fill"]'),
      handle: this.mountEl.querySelector('[data-el="handle"]'),
      playBtn: this.mountEl.querySelector('[data-action="toggle"]'),
      volume: this.mountEl.querySelector('[data-el="volume"]'),
      speedBtn: this.mountEl.querySelector('[data-action="speed"]'),
    };
  }

  _formatTime(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  }

  _bindEvents() {
    const mount = this.mountEl;

    mount.querySelector('[data-action="toggle"]').addEventListener("click", () => this.togglePlay());
    mount.querySelector('[data-action="back10"]').addEventListener("click", () => this.seekBy(-10));
    mount.querySelector('[data-action="fwd10"]').addEventListener("click", () => this.seekBy(10));
    mount.querySelector('[data-action="prev"]').addEventListener("click", () => this.playTrack(this.currentIndex - 1));
    mount.querySelector('[data-action="next"]').addEventListener("click", () => this.playTrack(this.currentIndex + 1));
    mount.querySelector('[data-action="speed"]').addEventListener("click", () => this.cycleSpeed());
    this.els.volume.addEventListener("input", (e) => {
      this.audio.volume = parseFloat(e.target.value);
    });

    this.audio.addEventListener("loadedmetadata", () => {
      this.els.duration.textContent = this._formatTime(this._getReliableDuration() || 0);
      const saved = KetabBazStorage.getPlaybackPosition(this._trackKey());
      const duration = this._getReliableDuration();
      if (saved && (duration == null || saved < duration - 2)) {
        this._seekToTime(saved);
      }
    });

    // به‌محض این‌که بافر بیشتری برسد یا مدت‌زمان واقعی مشخص شود، هر پرش
    // معلق (که به‌خاطر نامعلوم‌بودن duration اجرا نشده بود) را انجام می‌دهیم
    this.audio.addEventListener("progress", () => this._tryPendingSeek());
    this.audio.addEventListener("durationchange", () => this._tryPendingSeek());
    this.audio.addEventListener("canplay", () => this._tryPendingSeek());

    this.audio.addEventListener("timeupdate", () => {
      if (this.isSeeking) return;
      this._updateBar();
      // ذخیره‌ی موقعیت پخش هر چند ثانیه یک‌بار
      if (Math.floor(this.audio.currentTime) % 3 === 0) {
        KetabBazStorage.setPlaybackPosition(this._trackKey(), this.audio.currentTime);
      }
    });

    this.audio.addEventListener("play", () => {
      this.els.playBtn.textContent = "⏸";
      this.els.playBtn.setAttribute("aria-label", "توقف");
    });
    this.audio.addEventListener("pause", () => {
      this.els.playBtn.textContent = "▶";
      this.els.playBtn.setAttribute("aria-label", "پخش");
      KetabBazStorage.setPlaybackPosition(this._trackKey(), this.audio.currentTime);
    });
    this.audio.addEventListener("ended", () => {
      KetabBazStorage.clearPlaybackPosition(this._trackKey());
      this.playTrack(this.currentIndex + 1);
    });

    // --- Seek bar: mouse, touch, keyboard ---
    const bar = this.els.bar;
    const seekFromEvent = (clientX) => {
      const rect = bar.getBoundingClientRect();
      let ratio = (clientX - rect.left) / rect.width;
      // RTL: راست به چپ
      ratio = 1 - ratio;
      ratio = Math.min(1, Math.max(0, ratio));
      return ratio;
    };

    const onPointerDown = (e) => {
      this.isSeeking = true;
      bar.setPointerCapture && e.pointerId != null && bar.setPointerCapture(e.pointerId);
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const ratio = seekFromEvent(clientX);
      this._setBarRatio(ratio);
    };
    const onPointerMove = (e) => {
      if (!this.isSeeking) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const ratio = seekFromEvent(clientX);
      this._setBarRatio(ratio, true);
    };
    const onPointerUp = (e) => {
      if (!this.isSeeking) return;
      const clientX = (e.changedTouches ? e.changedTouches[0].clientX : e.clientX);
      const ratio = seekFromEvent(clientX);
      this._setBarRatio(ratio);
      this._seekToRatio(ratio);
      this.isSeeking = false;
    };

    bar.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    bar.addEventListener("keydown", (e) => {
      if (!this._isValidDuration()) return;
      if (e.key === "ArrowRight") this.seekBy(-5);
      if (e.key === "ArrowLeft") this.seekBy(5);
    });

    // ذخیره‌ی موقعیت هنگام خروج از صفحه
    window.addEventListener("beforeunload", () => {
      KetabBazStorage.setPlaybackPosition(this._trackKey(), this.audio.currentTime);
    });
  }

  _trackKey() {
    return this.currentTrack ? `track:${this.currentTrack.id}` : "track:unknown";
  }

  /**
   * برخی فایل‌های mp3 (بدون هدر VBR صحیح) مدت‌زمان‌شان را به‌درستی از طریق
   * audio.duration اعلام نمی‌کنند (مقدار Infinity یا NaN می‌ماند)، مخصوصاً در کروم.
   * در این‌جا به‌جای تکیه‌ی صرف به audio.duration، بازه‌های واقعاً بافرشده
   * (audio.seekable) را هم به‌عنوان منبع دوم بررسی می‌کنیم - بدون هیچ پرش
   * مصنوعی که ممکن است در برخی مرورگرها باعث خطای شبکه و قفل‌شدن پخش شود.
   */
  _getReliableDuration() {
    if (Number.isFinite(this.audio.duration) && this.audio.duration > 0) {
      return this.audio.duration;
    }
    if (this.audio.seekable && this.audio.seekable.length > 0) {
      const end = this.audio.seekable.end(this.audio.seekable.length - 1);
      if (Number.isFinite(end) && end > 0) return end;
    }
    return null;
  }

  _isValidDuration() {
    return this._getReliableDuration() != null;
  }

  _seekToTime(seconds) {
    const duration = this._getReliableDuration();
    if (duration != null) {
      this.audio.currentTime = Math.min(duration, Math.max(0, seconds));
      return;
    }
    // مدت‌زمان هنوز مشخص نیست؛ به‌محض این‌که بافر بیشتری برسد دوباره امتحان می‌کنیم
    this._pendingSeekSeconds = seconds;
    this._pendingSeekRatio = null;
  }

  _seekToRatio(ratio) {
    const duration = this._getReliableDuration();
    if (duration != null) {
      this.audio.currentTime = ratio * duration;
      return;
    }
    this._pendingSeekRatio = ratio;
    this._pendingSeekSeconds = null;
  }

  _tryPendingSeek() {
    const duration = this._getReliableDuration();
    if (duration == null) return;
    if (this._pendingSeekSeconds != null) {
      this.audio.currentTime = Math.min(duration, Math.max(0, this._pendingSeekSeconds));
      this._pendingSeekSeconds = null;
    } else if (this._pendingSeekRatio != null) {
      this.audio.currentTime = this._pendingSeekRatio * duration;
      this._pendingSeekRatio = null;
    }
  }

  _renderChapterList() {
    const listHtml = `
      <div class="kb-chapters" data-el="chapters" role="listbox" aria-label="فهرست فصل‌ها">
        ${this.tracks
          .map(
            (t, i) => `
          <button type="button" class="kb-chapter-item" data-chapter-index="${i}" role="option" aria-selected="false">
            <span class="kb-chapter-item__index">${i + 1}</span>
            <span class="kb-chapter-item__title">${t.title}</span>
            <span class="kb-chapter-item__playing" data-el="playing-badge">▶ در حال پخش</span>
          </button>
        `
          )
          .join("")}
      </div>
    `;
    this.mountEl.insertAdjacentHTML("beforeend", listHtml);
    this.chapterItems = Array.from(this.mountEl.querySelectorAll("[data-chapter-index]"));
    this.chapterItems.forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.getAttribute("data-chapter-index"));
        this.playTrack(idx);
      });
    });
    this._syncActiveChapter();
  }

  _syncActiveChapter() {
    if (!this.chapterItems) return;
    this.chapterItems.forEach((btn, i) => {
      const isActive = i === this.currentIndex;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-selected", String(isActive));
      const badge = btn.querySelector('[data-el="playing-badge"]');
      if (badge) badge.style.display = isActive ? "inline" : "none";
    });
  }

  _setBarRatio(ratio, previewOnly = false) {
    const pct = (ratio * 100).toFixed(2);
    this.els.fill.style.width = pct + "%";
    this.els.handle.style.right = pct + "%";
    this.els.bar.setAttribute("aria-valuenow", pct);
    if (previewOnly) {
      const duration = this._getReliableDuration();
      if (duration) this.els.currentTime.textContent = this._formatTime(ratio * duration);
    }
  }

  _updateBar() {
    const duration = this._getReliableDuration();
    if (!duration) return;
    const ratio = this.audio.currentTime / duration;
    this._setBarRatio(ratio);
    this.els.currentTime.textContent = this._formatTime(this.audio.currentTime);
  }

  _loadTrack(index, autoplay = true) {
    if (index < 0 || index >= this.tracks.length) return;
    this.currentIndex = index;
    const track = this.currentTrack;
    this.audio.src = track.src;
    this.els.title.textContent = track.title;
    this.els.subtitle.textContent = track.subtitle || "";
    this._setBarRatio(0);
    this.els.currentTime.textContent = "۰:۰۰";
    this._pendingSeekRatio = null;
    this._pendingSeekSeconds = null;
    this._syncActiveChapter();
    if (autoplay) {
      this.audio.play().catch(() => {});
    }
  }

  playTrack(index) {
    if (index < 0 || index >= this.tracks.length) return;
    this._loadTrack(index, true);
  }

  togglePlay() {
    if (this.audio.paused) {
      this.audio.play().catch(() => {});
    } else {
      this.audio.pause();
    }
  }

  seekBy(seconds) {
    const duration = this._getReliableDuration();
    if (!duration) return;
    this.audio.currentTime = Math.min(duration, Math.max(0, this.audio.currentTime + seconds));
  }

  cycleSpeed() {
    this.speedIndex = (this.speedIndex + 1) % this.speeds.length;
    const speed = this.speeds[this.speedIndex];
    this.audio.playbackRate = speed;
    this.els.speedBtn.textContent = speed + "x";
  }

  destroy() {
    this.audio.pause();
    this.audio.src = "";
  }
}
