import { getSchools, schoolStatus } from "./schools-data.js?v=20261002";

const STATE_NAMES = {
  FL: "Florida", TX: "Texas", CA: "California", NY: "New York", NJ: "New Jersey",
  IA: "Iowa", IL: "Illinois", MI: "Michigan", VA: "Virginia", MD: "Maryland",
  GA: "Georgia", OH: "Ohio", PA: "Pennsylvania", MN: "Minnesota", CO: "Colorado",
  WA: "Washington",
};

function setAll(selector, value) {
  document.querySelectorAll(selector).forEach((element) => { element.textContent = value; });
}

function renderSchoolCard(school) {
  const card = document.querySelector(`[data-school-card="${CSS.escape(school.id)}"]`);
  if (!card) return;

  const status = card.querySelector(`[data-school-status="${CSS.escape(school.id)}"]`);
  if (status) {
    status.textContent = schoolStatus(school);
    status.classList.toggle("school-card__badge--verified", !!school.verified);
  }

  const summary = card.querySelector(`[data-school-summary="${CSS.escape(school.id)}"]`);
  if (summary) {
    summary.textContent = [school.city, school.state, school.grades, school.enrollment]
      .filter(Boolean).join(" · ") || "School details unavailable";
  }

  const grades = card.querySelector(`[data-school-grades="${CSS.escape(school.id)}"]`);
  if (grades) grades.textContent = school.grades || "";

  const tuition = card.querySelector(`[data-school-tuition="${CSS.escape(school.id)}"]`);
  if (tuition) tuition.textContent = school.tuition_range || "Contact school";

  const accreditation = card.querySelector(`[data-school-accreditation="${CSS.escape(school.id)}"]`);
  if (accreditation) {
    const values = String(school.accreditation || "").split(/[,;]+/).map((value) => value.trim()).filter(Boolean);
    accreditation.replaceWith(...values.map((value) => {
      const tag = document.createElement("span");
      tag.className = "school-card__tag";
      tag.textContent = value;
      return tag;
    }));
    if (!values.length) card.querySelector(".school-card__tags").hidden = true;
  }
}

function populateHeroSearch(schools, states) {
  const stateSelect = document.getElementById("hero-state");
  const citySelect = document.getElementById("hero-city");
  if (!stateSelect || !citySelect) return;

  stateSelect.replaceChildren(
    new Option("Any state", ""),
    ...states.map((state) => new Option(STATE_NAMES[state] || state, state)),
  );

  function updateCities() {
    const state = stateSelect.value;
    const cities = [...new Set(schools
      .filter((school) => !state || school.state === state)
      .map((school) => school.city)
      .filter(Boolean))].sort((a, b) => a.localeCompare(b));
    citySelect.replaceChildren(new Option("Any city", ""), ...cities.map((city) => new Option(city, city)));
  }

  stateSelect.addEventListener("change", updateCities);
  updateCities();
}

try {
  const schools = await getSchools();
  const states = [...new Set(schools.map((school) => school.state).filter(Boolean))].sort();
  const countsByState = new Map();

  populateHeroSearch(schools, states);
  setAll("[data-school-count]", new Intl.NumberFormat().format(schools.length));
  setAll("[data-state-count]", new Intl.NumberFormat().format(states.length));
  setAll("[data-state-codes]", states.map((state) => STATE_NAMES[state] || state).join(" · "));

  schools.forEach((school) => {
    if (school.state) countsByState.set(school.state, (countsByState.get(school.state) || 0) + 1);
    renderSchoolCard(school);
  });

  document.querySelectorAll(".map-pin[data-state]").forEach((pin) => {
    const state = pin.dataset.state;
    const count = countsByState.get(state) || 0;
    pin.hidden = count === 0;
    pin.style.display = count ? "" : "none";
    pin.textContent = String(count);
    pin.title = `${STATE_NAMES[state] || state}: ${count} school${count === 1 ? "" : "s"}`;
  });
} catch (error) {
  console.error("Could not load homepage school data:", error);
  setAll("[data-school-count], [data-state-count], [data-state-codes]", "Unavailable");
}
