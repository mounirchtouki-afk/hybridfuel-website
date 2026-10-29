/* HybridFuelCo — cookie-toestemming + GA4 + Meta Pixel.
   Laadt tracking PAS na "Accepteren". Werkt op de website én de app
   (toestemming wordt gedeeld via een cookie op .hybridfuelco.com).

   >>> VUL JE TWEE ID'S IN <<<  */
(function () {
  var GA4_ID = "G-P0Y8DF9B0L";          // Google Analytics 4 Measurement ID (G-...)
  var META_PIXEL_ID = "XXXXXXXXXXXXXXX"; // Meta Pixel ID (cijfers)
  /* ====================================== */

  function getConsent() {
    // localStorage eerst: overleeft het herstarten van een geïnstalleerde app (PWA)
    // betrouwbaarder dan een JS-cookie (iOS/ITP knijpt die af). Cookie als fallback +
    // voor delen tussen website en app waar dat wél werkt.
    try { var ls = localStorage.getItem("hf_consent"); if (ls === "accepted" || ls === "rejected") return ls; } catch (e) {}
    var m = document.cookie.match(/(?:^|;\s*)hf_consent=([^;]+)/);
    return m ? m[1] : null;
  }
  function setConsent(v) {
    try { localStorage.setItem("hf_consent", v); } catch (e) {}
    var d = new Date(); d.setFullYear(d.getFullYear() + 1);
    document.cookie = "hf_consent=" + v + "; expires=" + d.toUTCString() + "; path=/; domain=.hybridfuelco.com; SameSite=Lax";
  }
  function lang() {
    try { var l = localStorage.getItem("hf_lang"); if (l === "nl" || l === "en") return l; } catch (e) {}
    return "en";
  }
  var T = {
    en: { text: "We use cookies to measure traffic and improve HybridFuelCo. Accept or reject analytics cookies.", accept: "Accept", reject: "Reject", more: "Privacy" },
    nl: { text: "We gebruiken cookies om bezoek te meten en HybridFuelCo te verbeteren. Accepteer of weiger analytische cookies.", accept: "Accepteren", reject: "Weigeren", more: "Privacy" }
  };

  function loadGA() {
    if (!GA4_ID || GA4_ID.indexOf("X") >= 0) return;
    var s = document.createElement("script"); s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA4_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    // Cross-domain meten: website (hybridfuelco.com) en app (app.hybridfuelco.com)
    // als één reis, zodat de bron/kanaal van een bezoeker niet verloren gaat bij
    // de overstap naar de app. cookie_domain op de apex deelt de GA-cookie.
    window.gtag("config", GA4_ID, {
      cookie_domain: "hybridfuelco.com",
      linker: { domains: ["hybridfuelco.com", "www.hybridfuelco.com", "app.hybridfuelco.com"], accept_incoming: true }
    });
  }
  function loadPixel() {
    if (!META_PIXEL_ID || META_PIXEL_ID.indexOf("X") >= 0) return;
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", META_PIXEL_ID);
    window.fbq("track", "PageView");
  }
  function loadAll() { loadGA(); loadPixel(); }

  // Door de app aan te roepen na een geslaagde betaling (alleen actief na toestemming).
  window.hfTrackPurchase = function (value, currency) {
    try { if (window.gtag) window.gtag("event", "purchase", { value: value, currency: currency || "EUR" }); } catch (e) {}
    try { if (window.fbq) window.fbq("track", "Purchase", { value: value, currency: currency || "EUR" }); } catch (e) {}
  };

  // Generieke event-helper voor de hele site (werkt pas na toestemming; zonder
  // gtag/fbq doet 'ie niets). Namen volgen de GA4-aanbevolen events waar mogelijk.
  // Meta-equivalenten worden gemapt zodat beide pixels dezelfde funnel zien.
  window.hfTrack = function (name, params) {
    params = params || {};
    try { if (window.gtag) window.gtag("event", name, params); } catch (e) {}
    try {
      if (window.fbq) {
        var map = { generate_lead: "Lead", begin_checkout: "InitiateCheckout", calculator_complete: "Lead", view_app_cta: "ViewContent", sign_up: "CompleteRegistration" };
        var fe = map[name];
        if (fe) window.fbq("track", fe, params);
      }
    } catch (e) {}
  };

  var c = getConsent();
  if (c === "accepted") { loadAll(); return; }
  if (c === "rejected") { return; }

  function banner() {
    var t = T[lang()];
    var bar = document.createElement("div");
    bar.setAttribute("style", "position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#121212;border-top:1px solid #242424;color:#e9e9e9;font-family:Inter,system-ui,sans-serif;font-size:13px;padding:14px 18px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:center");
    var txt = document.createElement("span");
    txt.setAttribute("style", "max-width:640px;line-height:1.5");
    txt.textContent = t.text + " ";
    var more = document.createElement("a");
    more.href = "https://www.hybridfuelco.com/privacy.html";
    more.textContent = t.more;
    more.setAttribute("style", "color:#9a9a9a;text-decoration:underline");
    txt.appendChild(more);
    var rej = document.createElement("button");
    rej.textContent = t.reject;
    rej.setAttribute("style", "background:transparent;color:#e9e9e9;border:1px solid #242424;padding:9px 18px;border-radius:8px;font-weight:600;cursor:pointer;font-family:inherit");
    var acc = document.createElement("button");
    acc.textContent = t.accept;
    acc.setAttribute("style", "background:#E11D48;color:#fff;border:none;padding:9px 22px;border-radius:8px;font-weight:700;cursor:pointer;font-family:inherit");
    rej.onclick = function () { setConsent("rejected"); bar.parentNode && bar.parentNode.removeChild(bar); };
    acc.onclick = function () { setConsent("accepted"); bar.parentNode && bar.parentNode.removeChild(bar); loadAll(); };
    bar.appendChild(txt); bar.appendChild(rej); bar.appendChild(acc);
    document.body.appendChild(bar);
  }
  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", banner); } else { banner(); }
})();
