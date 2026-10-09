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
      setActiveView(tile.dataset.goto);
      closeDrawer();
    });
  });


  // ---------- home rail: recipe carousel ----------
  const railTrack = document.getElementById("railTrack");
  const railPrev = document.getElementById("railPrev");
  const railNext = document.getElementById("railNext");
  const railDots = document.getElementById("railDots");
  const railSlides = railTrack.querySelectorAll(".rail-slide");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  railSlides.forEach(() => {
    const dot = document.createElement("span");
    dot.className = "rail-dot";
    railDots.appendChild(dot);
  });

  let railIndex = 0;
  let railBusy = false;
  let railSettle = null;
  function setRailUi(idx) {
    railDots.querySelectorAll(".rail-dot").forEach((d, i) => d.classList.toggle("is-active", i === idx));
    railPrev.disabled = idx <= 0;
    railNext.disabled = idx >= railSlides.length - 1;
  }
  function railSync() {
    const w = railTrack.clientWidth;
    if (!w) return;
    railIndex = Math.round(railTrack.scrollLeft / w);
    setRailUi(railIndex);
  }
  function railSettleSoon(ms) {
    clearTimeout(railSettle);
    railSettle = setTimeout(() => { railBusy = false; railSync(); }, ms);
  }
  function railGoTo(i) {
    railIndex = Math.max(0, Math.min(railSlides.length - 1, i));
    setRailUi(railIndex);
    railBusy = true;
    railSettleSoon(700);
    railTrack.scrollTo({ left: railIndex * railTrack.clientWidth, behavior: reduceMotion ? "auto" : "smooth" });
  }
  railPrev.addEventListener("click", () => railGoTo(railIndex - 1));
  railNext.addEventListener("click", () => railGoTo(railIndex + 1));
  railTrack.addEventListener("scroll", () => {
    if (railBusy) { railSettleSoon(150); return; }
    railSync();
  }, { passive: true });
  window.addEventListener("resize", () => railGoTo(railIndex));
  setRailUi(0);

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
