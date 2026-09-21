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

  // ---------- view switching (top nav icons + drawer tiles) ----------
  const views = document.querySelectorAll(".app-view");
  const navIcons = document.querySelectorAll(".fb-nav-icon[data-view]");
  const navButtons = document.querySelectorAll(".fb-nav-icon[data-view], .fb-nav-round[data-view]");

  function setActiveView(name) {
    views.forEach((v) => v.classList.toggle("is-active", v.dataset.view === name));
    navIcons.forEach((b) => b.classList.toggle("is-active", b.dataset.view === name));
    document.querySelector(".app-main").scrollTo({ top: 0, behavior: "auto" });
    window.scrollTo(0, 0);
  }

  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => setActiveView(btn.dataset.view));
  });

  // ---------- more drawer ----------
  const moreToggle = document.getElementById("moreToggle");
  const moreDrawer = document.getElementById("moreDrawer");
  const drawerBackdrop = document.getElementById("drawerBackdrop");

  function openDrawer() {
    moreDrawer.classList.add("is-open");
    drawerBackdrop.classList.add("is-open");
    moreToggle.setAttribute("aria-expanded", "true");
  }
  function closeDrawer() {
    moreDrawer.classList.remove("is-open");
    drawerBackdrop.classList.remove("is-open");
    moreToggle.setAttribute("aria-expanded", "false");
  }
  moreToggle.addEventListener("click", () => {
    const isOpen = moreDrawer.classList.contains("is-open");
    if (isOpen) closeDrawer();
    else openDrawer();
  });
  drawerBackdrop.addEventListener("click", closeDrawer);

  document.querySelectorAll(".drawer-tile[data-goto]").forEach((tile) => {
    tile.addEventListener("click", () => {
      setActiveView(tile.dataset.goto);
      closeDrawer();
    });
  });

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

  document.getElementById("composeBtn").addEventListener("click", () => {
    showToast("Funkce brzy dostupná 🙂");
  });
  document.querySelectorAll(".recipe-bookmark").forEach((btn) => {
    btn.addEventListener("click", () => showToast("Recept uložen"));
  });
})();
