// Lightweight prototype interactions — no frameworks.

// Active nav highlighting based on current page path.
document.addEventListener("DOMContentLoaded", () => {
  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll(".nav-primary a").forEach((a) => {
    const href = (a.getAttribute("href") || "").toLowerCase();
    if (href === path) a.classList.add("is-active");
  });

  // Favorite (heart) toggles
  document.querySelectorAll("[data-fav]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      el.classList.toggle("is-active");
    });
  });

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

  // Directory search:
  // The legacy DOM-filter handler that ran here lived on directory.html when
  // the page rendered hardcoded cards. Phase 2 moved directory rendering and
  // filtering into an inline <script type="module"> that imports schools-data.js
  // and owns the form, the URL state, and the result list. We deliberately
  // do NOTHING here so the two don't double-handle submit/filter events.

  // ----------------------------------------------------------------
  // Supabase Authentication & User Features
  // ----------------------------------------------------------------

  // Read session from localStorage (set by signin.html)
  function getSession() {
    try {
      const raw = localStorage.getItem('isr_session');
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (Date.now() > s.expires_at) { localStorage.removeItem('isr_session'); return null; }
      return s;
    } catch { return null; }
  }

  const session     = getSession();
  const currentUser = session?.user || null;

  // Update navigation based on auth state
  const updateNavigation = () => {
    const navUtility = document.querySelector('.nav-utility');
    if (!navUtility) return;

    if (currentUser) {
      const name = currentUser.user_metadata?.full_name?.split(' ')[0] || 'Account';
      navUtility.innerHTML = `
        <a href="add-school.html" class="btn btn--cta btn--sm">List Your School</a>
        <a href="account.html">Hi, ${name}</a>
        <a href="#" id="signout-link">Sign Out</a>
      `;
      document.getElementById('signout-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('isr_session');
        window.location.reload();
      });
    } else {
      navUtility.innerHTML = `
        <a href="signin.html" class="btn btn--cta btn--sm">Sign In</a>
      `;
    }
  };

  updateNavigation();
});
