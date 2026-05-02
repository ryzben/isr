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

  // Initialize Supabase
  const SUPABASE_URL = 'https://vprltwjduekabkizlbkv.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwcmx0d2pkdWVrYWJraXpsYmt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NDE3MzEsImV4cCI6MjA5MzIxNzczMX0.oHNRX6q9jXbR8W3yULzWf1bstHVulYJOGghmthQazTA';
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Global user state
  let currentUser = null;
  let userProfile = null;

  // Update navigation based on auth state
  const updateNavigation = () => {
    const navUtility = document.querySelector('.nav-utility');
    if (!navUtility) return;

    if (currentUser) {
      // User is signed in
      navUtility.innerHTML = `
        <a href="add-school.html" class="btn btn--cta btn--sm">List Your School</a>
        <a href="account.html">My Account</a>
        <a href="#" id="signout-link">Sign Out</a>
      `;

      // Add sign out handler
      document.getElementById('signout-link')?.addEventListener('click', async (e) => {
        e.preventDefault();
        await supabase.auth.signOut();
        window.location.reload();
      });
    } else {
      // User is not signed in
      navUtility.innerHTML = `
        <a href="signin.html" class="btn btn--ghost btn--sm">Sign In</a>
      `;
    }
  };

  // Load user favorites
  const loadUserFavorites = async () => {
    if (!currentUser) return new Set();

    try {
      const { data: favorites, error } = await supabase
        .from('user_favorites')
        .select('school_id')
        .eq('user_id', currentUser.id);

      if (error) throw error;

      return new Set(favorites.map(f => f.school_id));
    } catch (error) {
      console.error('Error loading favorites:', error);
      return new Set();
    }
  };

  // Toggle favorite for a school
  window.toggleFavorite = async (schoolId, element) => {
    if (!currentUser) {
      // Redirect to sign in
      window.location.href = 'signin.html';
      return;
    }

    try {
      const { data: existing } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('school_id', schoolId)
        .single();

      if (existing) {
        // Remove favorite
        await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('school_id', schoolId);

        element.classList.remove('is-active');
      } else {
        // Add favorite
        await supabase
          .from('user_favorites')
          .insert({
            user_id: currentUser.id,
            school_id: schoolId
          });

        element.classList.add('is-active');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Submit a review
  window.submitReview = async (schoolId, rating, reviewText, isAnonymous = false) => {
    if (!currentUser) {
      window.location.href = 'signin.html';
      return;
    }

    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          user_id: currentUser.id,
          school_id: schoolId,
          rating: parseInt(rating),
          review_text: reviewText,
          is_anonymous: isAnonymous
        });

      if (error) throw error;

      // Reload page to show new review
      window.location.reload();
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    }
  };

  // Initialize favorite buttons
  const initializeFavorites = async () => {
    const userFavorites = await loadUserFavorites();

    document.querySelectorAll("[data-fav]").forEach((el) => {
      const schoolId = el.dataset.schoolId;
      if (schoolId && userFavorites.has(schoolId)) {
        el.classList.add('is-active');
      }

      el.addEventListener("click", (e) => {
        e.preventDefault();
        window.toggleFavorite(schoolId, el);
      });
    });
  };

  // Auth state change handler
  supabase.auth.onAuthStateChange(async (event, session) => {
    currentUser = session?.user || null;

    if (currentUser) {
      // Load user profile
      try {
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
          console.error('Error loading profile:', error);
        } else {
          userProfile = profile;
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    } else {
      userProfile = null;
    }

    updateNavigation();
    initializeFavorites();
  });

  // Initialize on page load
  supabase.auth.getSession().then(({ data: { session } }) => {
    currentUser = session?.user || null;
    updateNavigation();
    initializeFavorites();
  });
});
