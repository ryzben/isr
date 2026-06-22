// Populates any .rating-block[data-school-id] with real review data from Supabase.
(function () {
  const blocks = document.querySelectorAll(".rating-block[data-school-id]");
  if (!blocks.length) return;

  const SUPABASE_URL = "https://vprltwjduekabkizlbkv.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwcmx0d2pkdWVrYWJraXpsYmt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NDE3MzEsImV4cCI6MjA5MzIxNzczMX0.oHNRX6q9jXbR8W3yULzWf1bstHVulYJOGghmthQazTA";

  const ids = Array.from(blocks).map((b) => b.dataset.schoolId);
  const filter = ids.map((id) => `"${id}"`).join(",");

  fetch(`${SUPABASE_URL}/rest/v1/reviews?select=school_id,rating&school_id=in.(${filter})`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  })
    .then((res) => res.json())
    .then((reviews) => {
      const byId = {};
      reviews.forEach((r) => {
        (byId[r.school_id] = byId[r.school_id] || []).push(r.rating);
      });

      blocks.forEach((block) => {
        const list = byId[block.dataset.schoolId] || [];
        const numEl = block.querySelector(".rating-block__num");
        const starsEl = block.querySelector(".rating-block__stars");
        const countEl = block.querySelector(".rating-block__count");

        if (!list.length) {
          if (starsEl) starsEl.style.opacity = "0.35";
          if (countEl) countEl.textContent = "No reviews yet";
          return;
        }

        const avg = list.reduce((s, r) => s + r, 0) / list.length;
        const rounded = Math.round(avg);
        if (numEl) numEl.textContent = avg.toFixed(1);
        if (starsEl) {
          starsEl.style.opacity = "1";
          starsEl.textContent = "★".repeat(rounded) + "☆".repeat(5 - rounded);
        }
        if (countEl) countEl.textContent = `${list.length} review${list.length === 1 ? "" : "s"}`;
      });
    })
    .catch(() => {
      blocks.forEach((block) => {
        const countEl = block.querySelector(".rating-block__count");
        if (countEl) countEl.textContent = "Reviews unavailable";
      });
    });
})();
