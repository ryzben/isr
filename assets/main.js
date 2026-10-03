// Lightweight prototype interactions — no frameworks.

// Tawk.to live chat — currently switched off. While it was merely hidden the
// widget still cost ~13 requests on every page, so it is no longer loaded at
// all. Set TAWK_ENABLED = true to bring it back (loads once the page is idle).
const TAWK_ENABLED = false;
if (TAWK_ENABLED) {
  const loadTawk = () => {
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://embed.tawk.to/6a027f1cee7ca01c362e9288/1jocs128c";
    s.charset = "UTF-8";
    s.setAttribute("crossorigin", "*");
    document.head.appendChild(s);
  };
  if ("requestIdleCallback" in window) requestIdleCallback(loadTawk, { timeout: 4000 });
  else window.addEventListener("load", () => setTimeout(loadTawk, 2000));
}

// Nav, dropdown, auth-aware utility links, and mobile drawer live in
// assets/site-chrome.js (injected header/footer). Session helpers are on
// window.ISR (getSession / signOut).
document.addEventListener("DOMContentLoaded", () => {
  // Favorite (heart) toggles live in assets/favorites.js (real user_favorites
  // persistence with sign-in gating) — no cosmetic handler here.

  // Scroll reveal: elements with .reveal fade/rise in once. Content is fully
  // visible by default; the pending state is only applied when the observer
  // is available and motion is allowed, so nothing can ship hidden.
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.removeAttribute("data-reveal-pending");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    document.querySelectorAll(".reveal").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top > window.innerHeight) {           // never hide above-the-fold content
        el.setAttribute("data-reveal-pending", "");
        io.observe(el);
      }
    });
  }

  // Compare tray toggle (directory page)
  const tray = document.getElementById("compareTray");
  const trayList = document.getElementById("compareList");
  const compare = new Set();
  document.querySelectorAll("[data-compare]").forEach((cb) => {
    cb.addEventListener("change", () => {
      const id = cb.dataset.compare;
      const name = cb.dataset.name || id;
      if (cb.checked) compare.add(JSON.stringify({ id, name }));
      else {
        for (const item of Array.from(compare)) {
          if (JSON.parse(item).id === id) compare.delete(item);
        }
      }
      if (!tray) return;
      if (compare.size === 0) {
        tray.hidden = true;
      } else {
        tray.hidden = false;
        trayList.innerHTML = Array.from(compare)
          .map((j) => {
            const { name } = JSON.parse(j);
            return `<span class="compare-chip">${name}</span>`;
          })
          .join("");
      }
    });
  });

  // View toggle (directory: list / map)
  document.querySelectorAll("[data-view-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.viewToggle;
      document.querySelectorAll("[data-view]").forEach((v) => {
        v.hidden = v.dataset.view !== target;
      });
      document.querySelectorAll("[data-view-toggle]").forEach((b) => {
        b.classList.toggle("is-active", b === btn);
      });
    });
  });

  // Newsletter sign-up forms (footer mini-form + hero form) — AJAX POST to Formspree.
  document.querySelectorAll(".newsletter-inline, .newsletter__form, .side-newsletter form").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const button = form.querySelector("button");
      const originalLabel = button ? button.textContent : "";
      if (button) {
        button.disabled = true;
        button.textContent = "Subscribing…";
      }
      try {
        const res = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("Submission failed");
        form.outerHTML = '<p class="newsletter-soon">Subscribed. Thanks for joining!</p>';
      } catch {
        if (button) {
          button.disabled = false;
          button.textContent = originalLabel;
        }
        const msg = "Something went wrong. Please try again.";
        if (window.ISR && ISR.toast) ISR.toast(msg, "error");
        else if (button) button.textContent = "Try again";
      }
    });
  });

  // Directory search:
  // The legacy DOM-filter handler that ran here lived on directory.html when
  // the page rendered hardcoded cards. Phase 2 moved directory rendering and
  // filtering into an inline <script type="module"> that imports schools-data.js
  // and owns the form, the URL state, and the result list. We deliberately
  // do NOTHING here so the two don't double-handle submit/filter events.

});
