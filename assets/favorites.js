/* Favorites — real saved-schools backed by the user_favorites table.
 * Any element with [data-fav="<school-id>"] becomes a working heart button:
 * clicks toggle the favorite (sign-in required), and hearts are hydrated
 * to their saved state on load, including buttons rendered later by JS.
 * Requires assets/site-chrome.js (window.ISR.getSession).
 */
(function () {
  "use strict";

  const SUPABASE_URL = "https://vprltwjduekabkizlbkv.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwcmx0d2pkdWVrYWJraXpsYmt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NDE3MzEsImV4cCI6MjA5MzIxNzczMX0.oHNRX6q9jXbR8W3yULzWf1bstHVulYJOGghmthQazTA";

  let favoriteIds = null; // Set<string> once loaded; null = not loaded

  function getSession() {
    return (window.ISR && window.ISR.getSession && window.ISR.getSession()) || null;
  }

  function authHeaders(session) {
    return {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    };
  }

  async function loadFavoriteIds() {
    if (favoriteIds) return favoriteIds;
    const session = getSession();
    if (!session) { favoriteIds = new Set(); return favoriteIds; }
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/user_favorites?user_id=eq.${encodeURIComponent(session.user.id)}&select=school_id`,
        { headers: authHeaders(session) }
      );
      favoriteIds = res.ok ? new Set((await res.json()).map((f) => f.school_id)) : new Set();
    } catch {
      favoriteIds = new Set();
    }
    return favoriteIds;
  }

  function paintButton(btn, saved) {
    btn.classList.toggle("is-active", saved);
    btn.setAttribute("aria-pressed", String(saved));
  }

  async function hydrateHearts(root) {
    const buttons = (root || document).querySelectorAll("[data-fav]");
    if (!buttons.length) return;
    const ids = await loadFavoriteIds();
    buttons.forEach((btn) => paintButton(btn, ids.has(btn.dataset.fav)));
  }

  async function toggleFavorite(btn) {
    const session = getSession();
    if (!session) {
      location.href = `signin?next=${encodeURIComponent(location.pathname + location.search)}`;
      return;
    }
    const schoolId = btn.dataset.fav;
    const ids = await loadFavoriteIds();
    const saved = ids.has(schoolId);
    btn.disabled = true;
    try {
      let res;
      if (saved) {
        res = await fetch(
          `${SUPABASE_URL}/rest/v1/user_favorites?user_id=eq.${encodeURIComponent(session.user.id)}&school_id=eq.${encodeURIComponent(schoolId)}`,
          { method: "DELETE", headers: authHeaders(session) }
        );
      } else {
        res = await fetch(`${SUPABASE_URL}/rest/v1/user_favorites`, {
          method: "POST",
          headers: { ...authHeaders(session), Prefer: "return=minimal" },
          body: JSON.stringify({ user_id: session.user.id, school_id: schoolId }),
        });
      }
      if (res.ok || res.status === 409) {
        if (saved) ids.delete(schoolId); else ids.add(schoolId);
        // Repaint every heart for this school on the page (list + hero can coexist).
        document.querySelectorAll(`[data-fav="${CSS.escape(schoolId)}"]`).forEach((b) => paintButton(b, !saved));
      }
    } catch (err) {
      console.warn("Favorite toggle failed:", err);
    } finally {
      btn.disabled = false;
    }
  }

  // Delegated clicks: works for hearts rendered at any time.
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-fav]");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(btn);
  }, true);

  // Hydrate hearts present now and any added later (directory renders async).
  const scheduleHydrate = (() => {
    let t = null;
    return () => { clearTimeout(t); t = setTimeout(() => hydrateHearts(document), 150); };
  })();

  document.addEventListener("DOMContentLoaded", () => {
    hydrateHearts(document);
    new MutationObserver((muts) => {
      if (muts.some((m) => Array.from(m.addedNodes).some(
        (n) => n.nodeType === 1 && (n.matches?.("[data-fav]") || n.querySelector?.("[data-fav]"))
      ))) scheduleHydrate();
    }).observe(document.body, { childList: true, subtree: true });
  });

  window.ISR = Object.assign(window.ISR || {}, {
    favorites: { load: loadFavoriteIds, toggle: toggleFavorite, hydrate: hydrateHearts },
  });
})();
