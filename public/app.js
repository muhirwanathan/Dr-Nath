(function () {
  const state = {
    categories: [],
    activeCategory: null,
    videos: [],
    progress: { completed: [] },
    userId: getOrCreateUserId()
  };

  const el = {
    categoryGrid: document.getElementById("categoryGrid"),
    resultsSection: document.getElementById("resultsSection"),
    resultsTitle: document.getElementById("resultsTitle"),
    resultsNote: document.getElementById("resultsNote"),
    videoGrid: document.getElementById("videoGrid"),
    searchInput: document.getElementById("searchInput"),
    sortSelect: document.getElementById("sortSelect"),
    progressFill: document.getElementById("progressFill"),
    progressText: document.getElementById("progressText"),
    badgeRow: document.getElementById("badgeRow"),
    videoModal: document.getElementById("videoModal"),
    modalBackdrop: document.getElementById("modalBackdrop"),
    modalClose: document.getElementById("modalClose"),
    modalVideoWrap: document.getElementById("modalVideoWrap"),
    modalTitle: document.getElementById("modalTitle"),
    modalMeta: document.getElementById("modalMeta"),
    markCompleteBtn: document.getElementById("markCompleteBtn")
  };

  function getOrCreateUserId() {
    let id = localStorage.getItem("drnath_userId");
    if (!id) {
      id = "user_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("drnath_userId", id);
    }
    return id;
  }

  async function init() {
    await Promise.all([loadCategories(), loadProgress()]);
    renderCategories();
    renderProgress();

    el.searchInput.addEventListener("input", debounce(() => {
      if (state.activeCategory) loadVideos(state.activeCategory, el.searchInput.value);
    }, 400));

    el.sortSelect.addEventListener("change", () => renderVideos());
    el.modalBackdrop.addEventListener("click", closeModal);
    el.modalClose.addEventListener("click", closeModal);

    document.querySelectorAll(".branch-leaf").forEach((btn) => {
      btn.addEventListener("click", () => {
        const catId = btn.getAttribute("data-category");
        const cat = state.categories.find((c) => c.id === catId);
        if (cat) selectCategory(cat);
      });
    });
  }

  function debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  // ---------------- Data loading ----------------

  async function loadCategories() {
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to load categories");
      state.categories = await res.json();
    } catch (err) {
      console.error(err);
      el.categoryGrid.innerHTML = `<p class="results-note">Couldn't load topics right now. Please refresh the page.</p>`;
    }
  }

  async function loadProgress() {
    try {
      const res = await fetch(`/api/progress/${state.userId}`);
      if (!res.ok) throw new Error("Failed to load progress");
      state.progress = await res.json();
    } catch (err) {
      console.error(err);
      state.progress = { completed: [] };
    }
  }

  async function loadVideos(categoryId, query) {
    el.resultsNote.textContent = "Loading…";
    el.videoGrid.innerHTML = "";
    try {
      const params = new URLSearchParams({ category: categoryId });
      if (query) params.set("q", query);
      const res = await fetch(`/api/videos?${params.toString()}`);
      if (!res.ok) throw new Error("Video fetch failed");
      const data = await res.json();
      state.videos = data.videos || [];
      el.resultsNote.textContent =
        data.source === "fallback"
          ? data.note || "Showing a curated fallback video."
          : "";
      renderVideos();
    } catch (err) {
      console.error(err);
      el.resultsNote.textContent = "Something went wrong loading videos. Please try again in a moment.";
      el.videoGrid.innerHTML = "";
    }
  }

  // ---------------- Rendering ----------------

  function renderCategories() {
    el.categoryGrid.innerHTML = "";
    state.categories.forEach((cat) => {
      const wrap = document.createElement("div");
      wrap.className = "category-card flip-card";
      const isDone = state.progress.completed.includes(cat.id);
      wrap.innerHTML = `
        <div class="flip-inner">
          <div class="flip-face flip-front">
            ${isDone ? '<span class="done-badge">✓ Learned</span>' : ""}
            <span class="icon">${cat.icon}</span>
            <span class="label">${cat.label}</span>
          </div>
          <div class="flip-face flip-back">
            <p class="flip-blurb">${escapeHtml(cat.blurb || "")}</p>
            <span class="flip-cta">Explore module →</span>
          </div>
        </div>
      `;
      wrap.addEventListener("click", () => selectCategory(cat));
      el.categoryGrid.appendChild(wrap);
    });
    applyTilt(el.categoryGrid.querySelectorAll(".category-card"));
  }

  function selectCategory(cat) {
    state.activeCategory = cat.id;
    el.resultsSection.hidden = false;
    el.resultsTitle.textContent = `${cat.icon} ${cat.label}`;
    el.searchInput.value = "";
    el.resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    loadVideos(cat.id, "");
  }

  function renderVideos() {
    const sorted = [...state.videos];
    const sortBy = el.sortSelect.value;

    if (sortBy === "duration_asc" || sortBy === "duration_desc") {
      sorted.sort((a, b) => {
        const da = durationToSeconds(a.duration);
        const db = durationToSeconds(b.duration);
        return sortBy === "duration_asc" ? da - db : db - da;
      });
    } else if (sortBy === "views_desc") {
      sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
    }

    el.videoGrid.innerHTML = "";
    if (sorted.length === 0) {
      el.videoGrid.innerHTML = `<p class="results-note">No videos found. Try a different search term.</p>`;
      return;
    }

    sorted.forEach((v) => {
      const card = document.createElement("div");
      card.className = "video-card";
      const thumb = v.thumbnail || `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`;
      card.innerHTML = `
        <img src="${thumb}" alt="${escapeHtml(v.title)}" loading="lazy" />
        <div class="body">
          <p class="title">${escapeHtml(v.title)}</p>
          <p class="meta">${escapeHtml(v.channel || "")}${v.durationLabel ? " · " + v.durationLabel : ""}</p>
        </div>
      `;
      card.addEventListener("click", () => openModal(v));
      el.videoGrid.appendChild(card);
    });
    applyTilt(el.videoGrid.querySelectorAll(".video-card"));
  }

  function durationToSeconds(iso) {
    if (!iso) return 0;
    const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!m) return 0;
    const h = parseInt(m[1] || "0", 10);
    const min = parseInt(m[2] || "0", 10);
    const s = parseInt(m[3] || "0", 10);
    return h * 3600 + min * 60 + s;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  function renderProgress() {
    const total = state.categories.length || 1;
    const done = state.progress.completed.length;
    const pct = Math.round((done / total) * 100);
    el.progressFill.style.width = pct + "%";
    el.progressText.textContent = `${done} of ${state.categories.length} topics completed`;

    el.badgeRow.innerHTML = "";
    state.progress.completed.forEach((id) => {
      const cat = state.categories.find((c) => c.id === id);
      if (!cat) return;
      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = `${cat.icon} ${cat.label}`;
      el.badgeRow.appendChild(badge);
    });
  }

  // ---------------- Modal ----------------

  let currentModalCategory = null;

  function openModal(video) {
    currentModalCategory = state.activeCategory;
    el.modalVideoWrap.innerHTML = `<iframe src="https://www.youtube.com/embed/${video.videoId}" title="${escapeHtml(video.title)}" allowfullscreen></iframe>`;
    el.modalTitle.textContent = video.title;
    el.modalMeta.textContent = video.channel || "";
    const already = state.progress.completed.includes(currentModalCategory);
    el.markCompleteBtn.disabled = already;
    el.markCompleteBtn.textContent = already ? "✓ Already marked as learned" : "Mark topic as learned";
    el.markCompleteBtn.onclick = () => markComplete(currentModalCategory);
    el.videoModal.hidden = false;
  }

  function closeModal() {
    el.videoModal.hidden = true;
    el.modalVideoWrap.innerHTML = "";
  }

  async function markComplete(categoryId) {
    try {
      const res = await fetch(`/api/progress/${state.userId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId })
      });
      if (!res.ok) throw new Error("Could not save progress");
      state.progress = await res.json();
      renderProgress();
      renderCategories();
      el.markCompleteBtn.disabled = true;
      el.markCompleteBtn.textContent = "✓ Already marked as learned";
    } catch (err) {
      console.error(err);
      alert("Couldn't save your progress right now. It will still work locally this session.");
    }
  }

  // ---------------- 3D interactions ----------------

  function applyTilt(elements) {
    elements.forEach((card) => {
      card.classList.add("tilt-card");
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const midX = rect.width / 2;
        const midY = rect.height / 2;
        const rotateY = ((x - midX) / midX) * 6;
        const rotateX = ((midY - y) / midY) * 6;
        card.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = "perspective(700px) rotateX(0) rotateY(0) translateY(0)";
      });
    });
  }

  function initHeroParallax() {
    const scene = document.getElementById("isoScene");
    if (!scene) return;
    document.querySelector(".hero")?.addEventListener("mousemove", (e) => {
      const rect = scene.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / rect.width;
      const dy = (e.clientY - cy) / rect.height;
      scene.style.transform = `rotateY(${dx * 6}deg) rotateX(${-dy * 6}deg)`;
    });
    document.querySelector(".hero")?.addEventListener("mouseleave", () => {
      scene.style.transform = "rotateY(0) rotateX(0)";
    });
  }

  function initScrollEffects() {
    const header = document.querySelector(".site-header");
    window.addEventListener("scroll", () => {
      if (window.scrollY > 30) header.classList.add("scrolled");
      else header.classList.remove("scrolled");
    }, { passive: true });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll(".reveal").forEach((elm) => observer.observe(elm));
  }

  init();
  initHeroParallax();
  initScrollEffects();
})();
