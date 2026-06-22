// Fetches today's prayer times from the Aladhan API for the homepage prayer widget.
(function () {
  const widget = document.getElementById("prayerWidget");
  if (!widget) return;

  const city = widget.dataset.city || "Jacksonville";
  const state = widget.dataset.state || "FL";
  const country = widget.dataset.country || "US";

  const cityLabel = document.getElementById("prayerWidgetCity");
  if (cityLabel) {
    const today = new Date();
    const dateStr = today.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    cityLabel.textContent = `${city}, ${state} · ${dateStr}`;
  }

  function to12Hour(timeStr) {
    const [hh, mm] = timeStr.split(":").map(Number);
    const period = hh >= 12 ? "PM" : "AM";
    const hour12 = hh % 12 === 0 ? 12 : hh % 12;
    return `${hour12}:${String(mm).padStart(2, "0")} ${period}`;
  }

  function markNextPrayer(prayers) {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    let nextEl = null;

    prayers.forEach((el) => {
      el.classList.remove("is-next");
      const minutes = Number(el.dataset.minutes);
      if (minutes > nowMinutes && !nextEl) nextEl = el;
    });

    (nextEl || prayers[0])?.classList.add("is-next");
  }

  fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&state=${encodeURIComponent(state)}&method=2`)
    .then((res) => res.json())
    .then((data) => {
      const timings = data?.data?.timings;
      if (!timings) throw new Error("No timings in response");

      const prayers = Array.from(widget.querySelectorAll(".prayer"));
      prayers.forEach((el) => {
        const name = el.dataset.prayer;
        const raw = timings[name];
        const timeEl = el.querySelector(".prayer__time");
        if (!raw) {
          if (timeEl) timeEl.textContent = "N/A";
          return;
        }
        const clean = raw.split(" ")[0];
        const [hh, mm] = clean.split(":").map(Number);
        el.dataset.minutes = hh * 60 + mm;
        if (timeEl) timeEl.textContent = to12Hour(clean);
      });

      markNextPrayer(prayers);
    })
    .catch(() => {
      const timeEls = widget.querySelectorAll(".prayer__time");
      timeEls.forEach((el) => (el.textContent = "N/A"));
    });
})();
