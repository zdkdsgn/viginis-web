(() => {
  "use strict";

  const loginScreen = document.getElementById("loginScreen");
  const appShell = document.getElementById("appShell");
  const loginForm = document.getElementById("loginForm");
  const demoLoginBtn = document.getElementById("demoLoginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  function enterApp() {
    loginScreen.hidden = true;
    appShell.hidden = false;
    window.scrollTo(0, 0);
  }
  function exitApp() {
    appShell.hidden = true;
    loginScreen.hidden = false;
    loginForm.reset();
    setActiveView("feed");
  }

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    enterApp();
  });
  demoLoginBtn.addEventListener("click", enterApp);
  logoutBtn.addEventListener("click", exitApp);

  // ---------- view switching (floating pill nav + top icons + drawer tiles) ----------
  const views = document.querySelectorAll(".app-view");
  const navBtns = document.querySelectorAll(".app-nav-btn[data-view]");
  const navTriggers = document.querySelectorAll(".app-nav-btn[data-view], .app-top-icon[data-view]");

  function setActiveView(name) {
    appShell.dataset.view = name;
    views.forEach((v) => v.classList.toggle("is-active", v.dataset.view === name));
    navBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.view === name));
    document.querySelector(".app-main").scrollTo({ top: 0, behavior: "auto" });
    window.scrollTo(0, 0);
  }

  navTriggers.forEach((btn) => {
    btn.addEventListener("click", () => setActiveView(btn.dataset.view));
  });

  // ---------- more drawer ----------
  const moreToggle = document.getElementById("moreToggle");
  const moreDrawer = document.getElementById("moreDrawer");
  const drawerBackdrop = document.getElementById("drawerBackdrop");

  const drawerClose = document.getElementById("drawerClose");

  function openDrawer() {
    moreDrawer.classList.add("is-open");
    drawerBackdrop.classList.add("is-open");
    moreToggle.setAttribute("aria-expanded", "true");
    setTimeout(() => drawerClose.focus({ preventScroll: true }), 60);
  }
  function closeDrawer() {
    if (!moreDrawer.classList.contains("is-open")) return;
    moreDrawer.classList.remove("is-open");
    drawerBackdrop.classList.remove("is-open");
    moreToggle.setAttribute("aria-expanded", "false");
    moreToggle.focus({ preventScroll: true });
  }
  moreToggle.addEventListener("click", () => {
    const isOpen = moreDrawer.classList.contains("is-open");
    if (isOpen) closeDrawer();
    else openDrawer();
  });
  drawerBackdrop.addEventListener("click", closeDrawer);
  drawerClose.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });

  document.querySelectorAll("[data-goto]").forEach((tile) => {
    tile.addEventListener("click", () => {
      if (tile.closest(".widget-rail.is-editing")) return;
      setActiveView(tile.dataset.goto);
      closeDrawer();
    });
  });


  // ---------- carousels (recipe widget, groups) ----------
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function initCarousel(root) {
    const track = root.querySelector("[data-track]");
    const prev = root.querySelector("[data-prev]");
    const next = root.querySelector("[data-next]");
    const dotsEl = root.querySelector("[data-dots]");
    const slides = track.children;
    let index = 0;
    let pages = 0;
    let busy = false;
    let settle = null;

    const maxScroll = () => Math.max(0, track.scrollWidth - track.clientWidth);
    const step = () => {
      if (slides.length > 1) {
        const d = slides[1].offsetLeft - slides[0].offsetLeft;
        if (d > 0) return d;
      }
      return track.clientWidth || 1;
    };
    const leftFor = (i) => (i >= pages - 1 ? maxScroll() : i * step());

    function buildDots() {
      const max = maxScroll();
      const p = max <= 1 ? 1 : Math.ceil((max - 1) / step()) + 1;
      if (p === pages) return;
      pages = p;
      dotsEl.textContent = "";
      for (let i = 0; i < pages; i++) {
        const dot = document.createElement("span");
        dot.className = "rail-dot";
        dotsEl.appendChild(dot);
      }
    }
    function ui() {
      dotsEl.querySelectorAll(".rail-dot").forEach((d, i) => d.classList.toggle("is-active", i === index));
      prev.disabled = index <= 0;
      next.disabled = index >= pages - 1;
    }
    function sync() {
      if (!track.clientWidth) return;
      buildDots();
      index = track.scrollLeft >= maxScroll() - 2 ? pages - 1 : Math.min(pages - 1, Math.round(track.scrollLeft / step()));
      ui();
    }
    function settleSoon(ms) {
      clearTimeout(settle);
      settle = setTimeout(() => { busy = false; sync(); }, ms);
    }
    function goTo(i) {
      buildDots();
      index = Math.max(0, Math.min(pages - 1, i));
      ui();
      busy = true;
      settleSoon(700);
      track.scrollTo({ left: leftFor(index), behavior: reduceMotion ? "auto" : "smooth" });
    }

    prev.addEventListener("click", () => goTo(index - 1));
    next.addEventListener("click", () => goTo(index + 1));
    track.addEventListener("scroll", () => {
      if (busy) { settleSoon(150); return; }
      sync();
    }, { passive: true });
    function refresh() {
      if (!track.clientWidth) return;
      buildDots();
      index = Math.min(index, pages - 1);
      track.scrollTo({ left: leftFor(index), behavior: "auto" });
      ui();
    }
    root.carouselRefresh = refresh;
    if ("ResizeObserver" in window) new ResizeObserver(refresh).observe(track);
    ui();
  }
  document.querySelectorAll("[data-carousel]").forEach(initCarousel);

  // ---------- widget rail: sizes, order, visibility (saved in localStorage) ----------
  const rail = document.getElementById("widgetRail");
  const editBtn = document.getElementById("widgetEdit");
  const resetBtn = document.getElementById("widgetReset");
  const tray = document.getElementById("widgetTray");
  const trayList = document.getElementById("widgetTrayList");
  const railStatus = document.getElementById("widgetStatus");
  const WIDGET_KEY = "viginis.widgets.v1";
  const SIZES = ["s", "m", "l"];
  const widgetEls = {};
  rail.querySelectorAll(".widget").forEach((el) => { widgetEls[el.dataset.widget] = el; });
  const WIDGET_IDS = Object.keys(widgetEls);
  const WIDGET_TITLES = {};
  WIDGET_IDS.forEach((id) => { WIDGET_TITLES[id] = widgetEls[id].getAttribute("aria-label"); });

  function defaultLayout() {
    return {
      order: ["recipes", "map", "shopping", "groups"].filter((id) => WIDGET_IDS.includes(id)),
      sizes: Object.fromEntries(WIDGET_IDS.map((id) => [id, "m"])),
      hidden: ["shopping", "groups"].filter((id) => WIDGET_IDS.includes(id)),
    };
  }
  function loadLayout() {
    const base = defaultLayout();
    try {
      const saved = JSON.parse(localStorage.getItem(WIDGET_KEY));
      if (!saved || !Array.isArray(saved.order)) return base;
      const order = saved.order.filter((id, i, a) => WIDGET_IDS.includes(id) && a.indexOf(id) === i);
      WIDGET_IDS.forEach((id) => { if (!order.includes(id)) order.push(id); });
      const sizes = { ...base.sizes };
      WIDGET_IDS.forEach((id) => { if (saved.sizes && SIZES.includes(saved.sizes[id])) sizes[id] = saved.sizes[id]; });
      const hidden = Array.isArray(saved.hidden) ? saved.hidden.filter((id) => WIDGET_IDS.includes(id)) : base.hidden;
      return { order, sizes, hidden };
    } catch (e) {
      return base;
    }
  }
  function saveLayout() {
    try { localStorage.setItem(WIDGET_KEY, JSON.stringify(layout)); } catch (e) { /* storage unavailable */ }
  }
  let layout = loadLayout();

  function say(msg) { railStatus.textContent = msg; }
  function visibleIds() { return layout.order.filter((id) => !layout.hidden.includes(id)); }

  function renderTray() {
    trayList.textContent = "";
    if (!layout.hidden.length) {
      const p = document.createElement("p");
      p.className = "widget-tray-empty";
      p.textContent = "Všechny widgety jsou zobrazené.";
      trayList.appendChild(p);
      return;
    }
    layout.hidden.forEach((id) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "widget-tray-chip";
      chip.dataset.add = id;
      chip.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
      chip.appendChild(document.createTextNode(WIDGET_TITLES[id]));
      trayList.appendChild(chip);
    });
  }
  function applyLayout() {
    const domOrder = [...rail.querySelectorAll(".widget")].map((el) => el.dataset.widget);
    const sameOrder = domOrder.join() === layout.order.join();
    layout.order.forEach((id) => {
      const el = widgetEls[id];
      if (!sameOrder) rail.insertBefore(el, tray);
      el.hidden = layout.hidden.includes(id);
      el.dataset.size = layout.sizes[id];
      el.querySelectorAll(".widget-sizes button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.size === layout.sizes[id])));
    });
    renderTray();
    rail.querySelectorAll("[data-carousel]").forEach((c) => c.carouselRefresh && c.carouselRefresh());
  }

  function setEditing(on) {
    rail.classList.toggle("is-editing", on);
    editBtn.setAttribute("aria-pressed", String(on));
    editBtn.textContent = on ? "Hotovo" : "Upravit";
    resetBtn.hidden = !on;
    tray.hidden = !on;
    WIDGET_IDS.forEach((id) => { widgetEls[id].draggable = on; });
    say(on ? "Úprava widgetů zapnuta" : "Úprava widgetů dokončena");
  }
  editBtn.addEventListener("click", () => setEditing(!rail.classList.contains("is-editing")));
  resetBtn.addEventListener("click", () => {
    layout = defaultLayout();
    applyLayout();
    saveLayout();
    say("Widgety obnoveny do výchozího stavu");
  });

  rail.addEventListener("click", (e) => {
    const sizeBtn = e.target.closest(".widget-sizes button");
    const removeBtn = e.target.closest(".widget-remove");
    const addBtn = e.target.closest(".widget-tray-chip");
    if (sizeBtn) {
      const id = sizeBtn.closest(".widget").dataset.widget;
      layout.sizes[id] = sizeBtn.dataset.size;
      applyLayout();
      saveLayout();
      say(WIDGET_TITLES[id] + ": velikost " + sizeBtn.dataset.size.toUpperCase());
    } else if (removeBtn) {
      const id = removeBtn.closest(".widget").dataset.widget;
      if (!layout.hidden.includes(id)) layout.hidden.push(id);
      applyLayout();
      saveLayout();
      say(WIDGET_TITLES[id] + " skryt");
    } else if (addBtn) {
      const id = addBtn.dataset.add;
      layout.hidden = layout.hidden.filter((h) => h !== id);
      applyLayout();
      saveLayout();
      say(WIDGET_TITLES[id] + " přidán");
    }
  });

  // keyboard reordering on the grip (Arrow Up / Down)
  rail.addEventListener("keydown", (e) => {
    const grip = e.target.closest(".widget-grip");
    if (!grip || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
    e.preventDefault();
    const id = grip.closest(".widget").dataset.widget;
    const vis = visibleIds();
    const from = vis.indexOf(id);
    const to = from + (e.key === "ArrowUp" ? -1 : 1);
    if (to < 0 || to >= vis.length) return;
    const a = layout.order.indexOf(id);
    const b = layout.order.indexOf(vis[to]);
    [layout.order[a], layout.order[b]] = [layout.order[b], layout.order[a]];
    applyLayout();
    saveLayout();
    grip.focus();
    say(WIDGET_TITLES[id] + ": pozice " + (to + 1) + " z " + vis.length);
  });

  // drag and drop reordering (reorders live while dragging)
  let dragged = null;
  rail.addEventListener("dragstart", (e) => {
    const w = e.target.closest && e.target.closest(".widget");
    if (!w || !rail.classList.contains("is-editing")) { e.preventDefault(); return; }
    dragged = w;
    w.classList.add("is-dragging");
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", w.dataset.widget);
    }
  });
  rail.addEventListener("dragover", (e) => {
    if (!dragged) return;
    e.preventDefault();
    const over = e.target.closest && e.target.closest(".widget:not([hidden])");
    if (!over || over === dragged) return;
    const r = over.getBoundingClientRect();
    const after = e.clientY > r.top + r.height / 2;
    rail.insertBefore(dragged, after ? over.nextElementSibling : over);
  });
  rail.addEventListener("drop", (e) => { if (dragged) e.preventDefault(); });
  rail.addEventListener("dragend", () => {
    if (!dragged) return;
    dragged.classList.remove("is-dragging");
    const domOrder = [...rail.querySelectorAll(".widget")].map((el) => el.dataset.widget);
    layout.order = domOrder;
    dragged = null;
    applyLayout();
    saveLayout();
    say("Pořadí widgetů změněno");
  });

  applyLayout();

  // ---------- profile dropdown ----------
  const profileToggle = document.getElementById("profileToggle");
  const profileDropdown = document.getElementById("profileDropdown");

  function closeProfileMenu() {
    profileDropdown.classList.remove("is-open");
    profileToggle.setAttribute("aria-expanded", "false");
  }
  profileToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = profileDropdown.classList.contains("is-open");
    profileDropdown.classList.toggle("is-open", !isOpen);
    profileToggle.setAttribute("aria-expanded", String(!isOpen));
  });
  document.addEventListener("click", (e) => {
    if (!profileDropdown.contains(e.target)) closeProfileMenu();
  });
  profileDropdown.addEventListener("click", (e) => {
    if (e.target.tagName === "A" || e.target.tagName === "BUTTON") closeProfileMenu();
  });

  // ---------- subtabs (visual only, demo has one sample set per view) ----------
  document.querySelectorAll(".subtabs").forEach((group) => {
    const tabs = group.querySelectorAll(".subtab");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("is-active"));
        tab.classList.add("is-active");
      });
    });
  });

  // ---------- reactions ----------
  document.querySelectorAll(".react-btn").forEach((btn) => {
    btn.addEventListener("click", () => btn.classList.toggle("is-picked"));
  });

  // ---------- toast helper ----------
  const toast = document.getElementById("toast");
  let toastTimer = null;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }

  document.querySelectorAll("[data-soon]").forEach((el) => {
    el.addEventListener("click", () => showToast("Funkce brzy dostupná 🙂"));
  });
  document.querySelectorAll(".recipe-bookmark").forEach((btn) => {
    btn.addEventListener("click", () => showToast("Recept uložen"));
  });
})();
