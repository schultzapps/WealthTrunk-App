/*!
 * Cookie consent banner + Google Consent Mode v2 defaults.
 *
 * Load this BEFORE the Google tag (gtag.js) on every page that loads it. It:
 *   1. defines dataLayer/gtag and sets consent to "denied" by default for the UK, the EEA and
 *      Switzerland (Google applies the region list using the visitor's location). Visitors
 *      elsewhere are unaffected;
 *   2. restores a saved Accept/Reject choice;
 *   3. shows a small banner to visitors who appear to be in those regions and have not chosen
 *      yet. This is a static site with no server-side geolocation, so "appear to be" means the
 *      browser's time zone or language region. It is best-effort: a visitor in a covered region
 *      with a non-European time zone and language never sees the banner, but their consent stays
 *      "denied" (Google's region default), so nothing is collected without a choice;
 *   4. adds a "Cookie settings" link so the choice can be changed at any time.
 *
 * Add ?consent=show to any URL to preview the banner.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'cookie_consent_v1';
  var MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;
  var PRIVACY_URL = '/Privacy_Policy.html';
  var REGIONS = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
                 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES',
                 'SE', 'IS', 'LI', 'NO', 'CH', 'GB'];
  var REGION_SET = {};
  for (var r = 0; r < REGIONS.length; r++) { REGION_SET[REGIONS[r]] = true; }

  window.dataLayer = window.dataLayer || [];
  // Must push the `arguments` object (not an array); gtag.js ignores arrays.
  function gtag() { window.dataLayer.push(arguments); }

  function consentState(value) {
    return { ad_storage: value, ad_user_data: value, ad_personalization: value,
             analytics_storage: value };
  }

  function readChoice() {
    try {
      var saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && (saved.value === 'granted' || saved.value === 'denied') &&
          typeof saved.time === 'number' && Date.now() - saved.time < MAX_AGE_MS) {
        return saved.value;
      }
    } catch (e) { /* storage blocked or corrupt: treat as no choice */ }
    return null;
  }

  function saveChoice(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ value: value, time: Date.now() }));
    } catch (e) { /* storage blocked: the choice applies to this page view only */ }
  }

  // 1 + 2: defaults first, then any saved choice, all before the Google tag runs.
  var defaults = consentState('denied');
  defaults.region = REGIONS;
  gtag('consent', 'default', defaults);

  var saved = readChoice();
  if (saved) { gtag('consent', 'update', consentState(saved)); }

  // ---------------------------------------------------------------- UI
  function likelyInRegion() {
    try {
      var tz = (window.Intl && Intl.DateTimeFormat().resolvedOptions().timeZone) || '';
      if (/^Europe\//.test(tz) || /^Atlantic\/(Reykjavik|Madeira|Azores|Canary|Faroe)$/.test(tz)) {
        return true;
      }
    } catch (e) { /* no Intl: fall through to language */ }
    var nav = window.navigator || {};
    var langs = (nav.languages && nav.languages.length) ? nav.languages : [nav.language || ''];
    for (var i = 0; i < langs.length; i++) {
      var m = /-([A-Za-z]{2})$/.exec(langs[i] || '');
      if (m && REGION_SET[m[1].toUpperCase()]) { return true; }
    }
    return false;
  }

  var CSS =
    '.cc-banner{position:fixed;left:16px;bottom:16px;z-index:2147483000;' +
    'width:calc(100% - 32px);max-width:340px;box-sizing:border-box;padding:14px 16px;' +
    'border-radius:var(--radius-lg,12px);' +
    'background:var(--bg-card,var(--sl-color-bg-nav,#fff));' +
    'color:var(--text-primary,var(--sl-color-text,#111));' +
    'border:1px solid var(--border-color-strong,rgba(128,128,128,.35));' +
    'box-shadow:0 4px 16px rgba(0,0,0,.18);' +
    'font-size:13.5px;line-height:1.45;font-family:inherit}' +
    '.cc-banner p{margin:0 0 10px;color:inherit}' +
    '.cc-banner a{color:inherit;text-decoration:underline;text-underline-offset:2px}' +
    '.cc-actions{display:flex;gap:8px}' +
    '.cc-btn{flex:1 1 0;min-height:40px;padding:6px 14px;box-sizing:border-box;' +
    'border-radius:var(--radius-md,8px);font:inherit;font-weight:600;cursor:pointer;' +
    'background:transparent;color:inherit;border:1px solid rgba(128,128,128,.55)}' +
    '.cc-btn:hover{background:rgba(128,128,128,.14)}' +
    '.cc-btn:focus-visible,.cc-float:focus-visible{outline:3px solid currentColor;outline-offset:2px}' +
    '.cc-float{position:fixed;left:12px;bottom:12px;z-index:2147482000;padding:4px 8px;' +
    'font-size:12px;border-radius:6px;opacity:.75;' +
    'background:var(--bg-card,var(--sl-color-bg-nav,#fff));' +
    'color:var(--text-secondary,var(--sl-color-gray-2,#444));' +
    'border:1px solid var(--border-color-strong,rgba(128,128,128,.45));text-decoration:none}' +
    '.cc-float:hover{opacity:1}' +
    '@media (max-width:480px){.cc-banner{left:12px;bottom:12px;width:calc(100% - 24px);max-width:none}}';

  var banner = null;

  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    for (var k in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, k)) { node.setAttribute(k, attrs[k]); }
    }
    if (text) { node.textContent = text; }
    return node;
  }

  function injectStyle() {
    if (document.getElementById('cc-style')) { return; }
    var style = el('style', { id: 'cc-style' });
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function hideBanner() {
    if (banner && banner.parentNode) { banner.parentNode.removeChild(banner); }
    banner = null;
  }

  function choose(value) {
    saveChoice(value);
    gtag('consent', 'update', consentState(value));
    hideBanner();
  }

  function showBanner() {
    if (banner) { return; }
    injectStyle();
    banner = el('div', { 'class': 'cc-banner', role: 'dialog', 'aria-label': 'Cookie consent' });

    var text = el('p', {}, 'We use cookies to measure site traffic and ad performance. ');
    text.appendChild(el('a', { href: PRIVACY_URL }, 'Privacy Policy'));
    text.appendChild(document.createTextNode('.'));

    var actions = el('div', { 'class': 'cc-actions' });
    var reject = el('button', { type: 'button', 'class': 'cc-btn' }, 'Reject');
    var accept = el('button', { type: 'button', 'class': 'cc-btn' }, 'Accept');
    reject.addEventListener('click', function () { choose('denied'); });
    accept.addEventListener('click', function () { choose('granted'); });
    actions.appendChild(reject);
    actions.appendChild(accept);

    banner.appendChild(text);
    banner.appendChild(actions);
    // First in the DOM so keyboard and screen-reader users reach it before the page.
    document.body.insertBefore(banner, document.body.firstChild);
  }

  function ensureSettingsLink() {
    if (document.querySelector('[data-cc-settings]')) { return; }
    var link = el('a', { href: '#', 'data-cc-settings': '' }, 'Cookie settings');
    link.addEventListener('click', function (e) { e.preventDefault(); showBanner(); });

    var matches = document.querySelectorAll('footer a[href$="Privacy_Policy.html"]');
    var privacy = matches.length ? matches[matches.length - 1] : null;
    if (privacy && privacy.parentNode && privacy.parentNode.tagName === 'LI') {
      var item = document.createElement('li');
      item.appendChild(link);
      privacy.parentNode.parentNode.insertBefore(item, privacy.parentNode.nextSibling);
    } else {
      injectStyle();
      link.className = 'cc-float';
      document.body.appendChild(link);
    }
  }

  function init() {
    var forced = /[?&]consent=show(&|$)/.test(window.location.search);
    if (!(forced || saved !== null || likelyInRegion())) { return; }
    ensureSettingsLink();
    if (forced || saved === null) { showBanner(); }
  }

  window.openCookieSettings = function () { if (document.body) { showBanner(); } };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
