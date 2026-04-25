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
  // Demo-only auth handlers (signup + signin)
  // ISR is in preview — forms validate and respond but do NOT create
  // accounts, authenticate, or persist anything. No localStorage, no
  // backend, no password storage. When a real backend is wired up
  // later (e.g. Supabase), these handlers will be replaced.
  // ----------------------------------------------------------------
  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || "").trim());

  const setAuthStatus = (form, kind, text) => {
    let el = form.querySelector(".auth-status");
    if (!el) {
      el = document.createElement("div");
      el.className = "auth-status";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      const submit = form.querySelector("button[type='submit']");
      if (submit && submit.parentNode) submit.parentNode.insertBefore(el, submit);
    }
    el.className = "auth-status" + (kind ? " auth-status--" + kind : "");
    el.textContent = text || "";
  };

  const runProcessing = (btn, ms) => {
    return new Promise((resolve) => {
      const original = btn.textContent;
      btn.dataset.originalText = original;
      btn.textContent = "Please wait…";
      btn.disabled = true;
      btn.setAttribute("aria-busy", "true");
      setTimeout(() => {
        btn.textContent = original;
        btn.disabled = false;
        btn.removeAttribute("aria-busy");
        resolve();
      }, ms);
    });
  };

  // --- Waitlist signup (email-only; no password collected during preview) ---
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const emailField = signupForm.querySelector("#email");
      const submitBtn = signupForm.querySelector("button[type='submit']");
      const email = emailField ? emailField.value : "";

      if (!isValidEmail(email)) {
        setAuthStatus(signupForm, "error", "Please enter a valid email address.");
        if (emailField) emailField.focus();
        return;
      }

      setAuthStatus(signupForm, "", "");
      runProcessing(submitBtn, 750).then(() => {
        setAuthStatus(
          signupForm,
          "success",
          "You're on the waitlist. We'll email you the moment ISR opens accounts. Thanks for your patience — ISR is in preview."
        );
        // Clear the email so a refresh doesn't repost.
        if (emailField) emailField.value = "";
      });
    });
  }

  // Note: signin.html no longer renders a credential form during preview.
  // Sign-in will be wired up when accounts launch.
});
