(function () {
  function safeNext(value, fallback = "account") {
    if (typeof value !== "string" || !value.trim()) return fallback;
    try {
      const url = new URL(value, window.location.origin);
      if (url.origin !== window.location.origin || !/^https?:$/.test(url.protocol)) return fallback;
      if (["/signin", "/signup", "/confirmation"].includes(url.pathname.replace(/\/+$/, ""))) return fallback;
      return `${url.pathname}${url.search}${url.hash}`;
    } catch (error) {
      console.error("Could not validate the return URL:", error);
      return fallback;
    }
  }

  window.ISR = Object.assign(window.ISR || {}, { safeNext });
})();
