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

  // Directory search: filter result cards by city
  const dirForm = document.getElementById("dirSearch");
  if (dirForm) {
    const cards = Array.from(document.querySelectorAll(".result-list > .result"));
    const countEl = document.querySelector(".results-count");
    const totalLabel = countEl ? countEl.innerHTML : "";

    const applyFilter = () => {
      const cityEl = dirForm.querySelector('[name="city"]');
      const stateEl = dirForm.querySelector('[name="state"]');
      const city = cityEl ? cityEl.value : "Any city";
      const state = stateEl ? stateEl.value.trim() : "";
      let visible = 0;
      cards.forEach((card) => {
        const cardCity = card.dataset.city || "";
        const match = city === "Any city" || city === "" || cardCity.toLowerCase() === city.toLowerCase();
        card.style.display = match ? "" : "none";
        if (match) visible += 1;
      });
      if (countEl) {
        if (city && city !== "Any city") {
          countEl.innerHTML = `${visible} school${visible === 1 ? "" : "s"} <span>in ${city}${state ? ", " + state : ""}</span>`;
        } else {
          countEl.innerHTML = totalLabel;
        }
      }
    };

    // On submit: filter + brief flash on button
    dirForm.addEventListener("submit", (e) => {
      e.preventDefault();
      applyFilter();
      const btn = dirForm.querySelector('button[type="submit"]');
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = "Updating…";
        btn.disabled = true;
        setTimeout(() => {
          btn.textContent = orig;
          btn.disabled = false;
        }, 350);
      }
      // Scroll results into view on mobile
      const resultsHeader = document.querySelector(".results-header");
      if (resultsHeader && window.innerWidth < 960) {
        resultsHeader.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    // Accept ?q= / ?city= / ?grade= from homepage search
    const params = new URLSearchParams(location.search);
    const q = params.get("q");
    const cityParam = params.get("city");
    const gradeParam = params.get("grade");
    const cityEl = dirForm.querySelector('[name="city"]');
    const gradeEl = dirForm.querySelector('[name="grade"]');
    const stateEl = dirForm.querySelector('[name="state"]');

    // Match a free-text location ("Tampa, FL", "Orlando") to our city dropdown
    const CITIES = ["Jacksonville", "Tampa", "Orlando", "Miami", "Fort Lauderdale", "Tallahassee"];
    if (q && cityEl) {
      const match = CITIES.find((c) => q.toLowerCase().includes(c.toLowerCase()));
      if (match) cityEl.value = match;
      if (stateEl && /FL|Florida/i.test(q)) stateEl.value = "Florida";
    }
    if (cityParam && cityEl && CITIES.includes(cityParam)) cityEl.value = cityParam;
    if (gradeParam && gradeEl) {
      const g = Array.from(gradeEl.options).find((o) => o.value.toLowerCase() === gradeParam.toLowerCase());
      if (g) gradeEl.value = g.value;
    }
    if (q || cityParam || gradeParam) applyFilter();
  }
});
