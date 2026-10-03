/* Shared site chrome — header, mobile nav, footer, session helpers.
 * Injected synchronously at the script's position (no FOUC, no fetch).
 * Usage per page:
 *   <script src="assets/site-chrome.js"></script>   <- where the header goes (top of <body>)
 *   <div id="site-footer"></div>                    <- where the footer goes (end of <body>)
 */
(function () {
  "use strict";

  // ---------- Session helpers (canonical definition, shared by all pages) ----------
  function getSession() {
    try {
      const raw = localStorage.getItem("isr_session");
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (Date.now() > s.expires_at) { localStorage.removeItem("isr_session"); return null; }
      return s;
    } catch { return null; }
  }
  function signOut() {
    localStorage.removeItem("isr_session");
    window.location.reload();
  }
  // ---------- Toasts (async feedback; replaces alert()) ----------
  // type: "info" (default) | "success" | "error". Errors are announced assertively.
  function toast(message, type) {
    let region = document.querySelector(".toast-region");
    if (!region) {
      region = document.createElement("div");
      region.className = "toast-region";
      document.body.appendChild(region);
    }
    const el = document.createElement("div");
    el.className = "toast" + (type === "success" || type === "error" ? " toast--" + type : "");
    el.setAttribute("role", type === "error" ? "alert" : "status");
    el.textContent = message;
    region.appendChild(el);
    setTimeout(() => el.remove(), type === "error" ? 8000 : 5000);
  }
  window.ISR = Object.assign(window.ISR || {}, { getSession, signOut, toast });

  // ---------- Icons ----------
  const ICON_GLOBE =
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
  const ICON_BURGER =
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  const ICON_CHEVRON =
    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  const ICON_CLOSE =
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  // ---------- Header ----------
  const HEADER_HTML = `
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <div class="container site-header__inner">
    <a href="index" class="brand">
      <span class="brand__mark">ISR</span>
      Islamic School Review
    </a>
    <nav class="nav-primary" aria-label="Primary">
      <a href="directory">Directory</a>
      <a href="blog">Resources</a>
      <a href="about">About</a>
      <div class="nav-more">
        <button class="nav-more__btn" aria-expanded="false" aria-haspopup="true">More ${ICON_CHEVRON}</button>
        <div class="nav-more__menu" hidden>
          <a href="jobs">Jobs <span class="nav-more__cs">coming soon</span></a>
          <a href="membership">Membership <span class="nav-more__cs">coming soon</span></a>
          <a href="blog">Community <span class="nav-more__cs">coming soon</span></a>
        </div>
      </div>
    </nav>
    <div class="nav-utility">
      <button type="button" class="lang-toggle" aria-label="Language: English">${ICON_GLOBE} EN</button>
      <span class="nav-utility__auth"></span>
      <button type="button" class="nav-burger" aria-label="Open menu" aria-expanded="false" aria-controls="mobileNav">${ICON_BURGER}</button>
    </div>
  </div>
  <nav class="mobile-nav" id="mobileNav" aria-label="Mobile" hidden>
    <a href="directory">Directory</a>
    <a href="blog">Resources</a>
    <a href="about">About</a>
    <a href="jobs">Jobs <span class="nav-more__cs">coming soon</span></a>
    <a href="membership">Membership <span class="nav-more__cs">coming soon</span></a>
    <div class="mobile-nav__auth"></div>
  </nav>
</header>`;

  const FOOTER_HTML = `
<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-col">
        <div class="brand brand--footer">
          <span class="brand__mark">ISR</span>
          Islamic School Review
        </div>
        <p class="footer-mission">Connecting parents, students, educators, and schools around trustworthy information, honest reviews, and practical resources for Islamic education.</p>
        <form class="newsletter-inline" action="https://formspree.io/f/mjglvggk" method="POST">
          <input type="hidden" name="form-name" value="newsletter-signup" />
          <input type="hidden" name="_subject" value="Newsletter signup" />
          <label class="sr-only" for="footerNewsletterEmail">Email address for the weekly newsletter</label>
          <input type="email" id="footerNewsletterEmail" name="email" autocomplete="email" placeholder="Join our weekly newsletter" required />
          <button type="submit">Subscribe</button>
        </form>
      </div>
      <div class="footer-col">
        <h2 class="footer-heading">Directory</h2>
        <ul>
          <li><a href="directory">Browse all schools</a></li>
          <li><a href="compare">Compare schools</a></li>
          <li><a href="add-school">Add your school</a></li>
          <li><a href="claim">Claim your school</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h2 class="footer-heading">Resources</h2>
        <ul>
          <li><a href="blog">Guides &amp; stories</a></li>
          <li><a href="write-review">Write a review</a></li>
          <li><a href="jobs">For educators</a></li>
          <li><a href="membership">For schools</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h2 class="footer-heading">Company</h2>
        <ul>
          <li><a href="about">About us</a></li>
          <li><a href="contact">Contact</a></li>
          <li><a href="privacy">Privacy</a></li>
          <li><a href="terms">Terms</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 IslamicSchoolReview.com — All rights reserved.</span>
      <span class="footer-bottom__links">
        <a href="privacy">Privacy</a>
        <a href="terms">Terms</a>
        <a href="privacy">Cookies</a>
      </span>
    </div>
  </div>
</footer>`;

  // Inject header at the script's position, during parse — in the DOM before first paint.
  const marker = document.currentScript;
  marker.insertAdjacentHTML("beforebegin", HEADER_HTML);
  const header = marker.previousElementSibling;

  // ---------- Auth-aware utility nav (runs synchronously — no flash of signed-out state) ----------
  const session = getSession();
  const authSlot = header.querySelector(".nav-utility__auth");
  const mobileAuthSlot = header.querySelector(".mobile-nav__auth");
  if (session && session.user) {
    const name = session.user.user_metadata?.full_name?.split(" ")[0] || "Account";
    authSlot.innerHTML = `
      <a href="add-school" class="btn btn--cta btn--sm">List Your School</a>
      <a href="account" class="nav-link">Hi, ${name}</a>
      <a href="#" class="nav-link" data-signout>Sign Out</a>`;
    mobileAuthSlot.innerHTML = `
      <a href="account" class="btn btn--ghost btn--sm">My account</a>
      <a href="add-school" class="btn btn--cta btn--sm">List Your School</a>
      <a href="#" class="nav-link" data-signout>Sign Out</a>`;
  } else {
    authSlot.innerHTML = `
      <a href="signin" class="nav-link">Sign In</a>
      <a href="add-school" class="btn btn--cta btn--sm">List Your School</a>`;
    mobileAuthSlot.innerHTML = `
      <a href="signin" class="btn btn--ghost btn--sm">Sign In</a>
      <a href="add-school" class="btn btn--cta btn--sm">List Your School</a>`;
  }
  header.querySelectorAll("[data-signout]").forEach((el) =>
    el.addEventListener("click", (e) => { e.preventDefault(); signOut(); })
  );

  // ---------- Active nav highlighting ----------
  let page = (location.pathname.split("/").pop() || "index").toLowerCase().replace(/\.html$/, "");
  header.querySelectorAll(".nav-primary a, .mobile-nav > a").forEach((a) => {
    const href = (a.getAttribute("href") || "").toLowerCase().replace(/\.html$/, "");
    if (href === page) {
      a.classList.add("is-active");
      a.setAttribute("aria-current", "page");
    }
  });

  // ---------- More dropdown ----------
  const moreBtn = header.querySelector(".nav-more__btn");
  const moreMenu = header.querySelector(".nav-more__menu");
  if (moreBtn && moreMenu) {
    moreBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = !moreMenu.hidden;
      moreMenu.hidden = isOpen;
      moreBtn.setAttribute("aria-expanded", String(!isOpen));
    });
    document.addEventListener("click", () => {
      moreMenu.hidden = true;
      moreBtn.setAttribute("aria-expanded", "false");
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !moreMenu.hidden) {
        moreMenu.hidden = true;
        moreBtn.setAttribute("aria-expanded", "false");
        moreBtn.focus();
      }
    });
    moreMenu.addEventListener("click", (e) => e.stopPropagation());
  }

  // ---------- Mobile drawer ----------
  const burger = header.querySelector(".nav-burger");
  const drawer = header.querySelector(".mobile-nav");
  if (burger && drawer) {
    const setOpen = (open) => {
      drawer.hidden = !open;
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      burger.innerHTML = open ? ICON_CLOSE : ICON_BURGER;
      document.documentElement.classList.toggle("nav-open", open);
    };
    burger.addEventListener("click", () => setOpen(drawer.hidden));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !drawer.hidden) { setOpen(false); burger.focus(); }
    });
    // Close when resizing up to desktop.
    window.matchMedia("(min-width: 961px)").addEventListener("change", (mq) => {
      if (mq.matches) setOpen(false);
    });
  }

  // ---------- Footer ----------
  document.addEventListener("DOMContentLoaded", () => {
    const slot = document.getElementById("site-footer");
    if (slot) slot.outerHTML = FOOTER_HTML;
  });
})();
