(() => {
  "use strict";

  // Mobile nav toggle
  const navToggle = document.getElementById("navToggle");
  const mainNav = document.getElementById("mainNav");
  if (navToggle && mainNav) {
    navToggle.addEventListener("click", () => {
      const isOpen = mainNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });
    mainNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mainNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // AI "scan" flourish on hero plates: plays once in view, replays on hover/tap
  document.querySelectorAll(".ai-tag-visual").forEach((aiVisual) => {
    const playScan = () => {
      aiVisual.classList.remove("is-scanning");
      void aiVisual.offsetWidth; // force reflow so the animation restarts
      aiVisual.classList.add("is-scanning");
    };
    if ("IntersectionObserver" in window) {
      const scanObserver = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              playScan();
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.4 }
      );
      scanObserver.observe(aiVisual);
    } else {
      playScan();
    }
    aiVisual.addEventListener("mouseenter", playScan);
    aiVisual.addEventListener("touchstart", playScan, { passive: true });
  });

  // Scroll-driven story ("Jak to funguje"): sticky phone swaps to match
  // whichever block's heading is currently closest to the sticky phone's
  // top edge (both are top-aligned, so this is what keeps them visually
  // lined up). Recomputed from actual positions on every scroll
  // (rAF-throttled) rather than via IntersectionObserver edge-crossing, so
  // a fast/flung scroll can never "skip past" a block and leave the state stuck.
  const storyBlocks = document.querySelectorAll(".story-block");
  const storyImgs = document.querySelectorAll(".story-img");
  const storyVisualInner = document.querySelector(".story-visual-inner");

  function setActiveStory(id) {
    storyBlocks.forEach((b) => b.classList.toggle("is-active", b.dataset.story === id));
    storyImgs.forEach((img) => img.classList.toggle("is-active", img.dataset.story === id));
  }

  if (storyBlocks.length) {
    const anchorY = () =>
      storyVisualInner ? storyVisualInner.getBoundingClientRect().top : window.innerHeight / 2;
    const closestStoryBlock = () => {
      const anchor = anchorY();
      let closest = storyBlocks[0];
      let closestDist = Infinity;
      storyBlocks.forEach((block) => {
        const rect = block.getBoundingClientRect();
        const dist = Math.abs(rect.top - anchor);
        if (dist < closestDist) {
          closestDist = dist;
          closest = block;
        }
      });
      return closest;
    };

    let storyTicking = false;
    const updateActiveStory = () => {
      storyTicking = false;
      setActiveStory(closestStoryBlock().dataset.story);
    };
    const onStoryScroll = () => {
      if (storyTicking) return;
      storyTicking = true;
      requestAnimationFrame(updateActiveStory);
    };

    window.addEventListener("scroll", onStoryScroll, { passive: true });
    window.addEventListener("resize", onStoryScroll);
  }

  // Deep-linking into a story block (e.g. footer link to #ai / #sdileni / #inspirace / #zazitek)
  function activateStoryFromHash() {
    const id = location.hash.slice(1);
    const target = document.getElementById(id);
    if (!target || !target.classList.contains("story-block")) return;
    setActiveStory(id);
    requestAnimationFrame(() => target.scrollIntoView({ behavior: "smooth", block: "start" }));
  }
  window.addEventListener("hashchange", activateStoryFromHash);
  if (location.hash) activateStoryFromHash();

  // Scroll reveal
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  // Back-to-top button
  const toTop = document.getElementById("toTop");
  if (toTop) {
    window.addEventListener("scroll", () => {
      toTop.classList.toggle("is-visible", window.scrollY > 600);
    });
    toTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Apple-style carousels: arrow buttons scroll by one card, disable at the ends
  function initCarousel(trackId, prevId, nextId) {
    const track = document.getElementById(trackId);
    const prev = document.getElementById(prevId);
    const next = document.getElementById(nextId);
    if (!track || !prev || !next) return;
    const cardStep = () => {
      const card = track.firstElementChild;
      if (!card) return track.clientWidth;
      const style = getComputedStyle(track);
      return card.getBoundingClientRect().width + parseFloat(style.columnGap || style.gap || "0");
    };
    const updateNav = () => {
      const max = track.scrollWidth - track.clientWidth - 8;
      prev.disabled = track.scrollLeft <= 8;
      next.disabled = track.scrollLeft >= max;
    };
    prev.addEventListener("click", () => {
      track.scrollBy({ left: -cardStep(), behavior: "smooth" });
    });
    next.addEventListener("click", () => {
      track.scrollBy({ left: cardStep(), behavior: "smooth" });
    });
    track.addEventListener("scroll", updateNav, { passive: true });
    window.addEventListener("resize", updateNav);
    updateNav();
  }
  initCarousel("b2bCarousel", "b2bPrev", "b2bNext");
  initCarousel("teamCarousel", "teamPrev", "teamNext");
})();
