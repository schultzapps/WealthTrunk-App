/*!
 * App Store link tracking. Configure on the script tag: data-app-id, data-app.
 *  - Fires GA4 `download_app_click` for links to the app's App Store page, but only from Apple
 *    devices (iPhone, iPad, Mac), since only those can install. Other platforms fire
 *    `download_app_click_non_apple`, which should not be marked as a conversion.
 *  - For visitors who arrived from a Google ad (gclid/gbraid/wbraid or utm_medium=cpc), adds the
 *    ad campaign to Apple's `ct` token on those links so App Store Connect can attribute installs.
 */
(function () {
  'use strict';
  var script = document.currentScript;
  var appId = script && script.getAttribute('data-app-id');
  var appName = (script && script.getAttribute('data-app')) || 'unknown';
  if (!appId) { return; }
  var selector = 'a[href*="apps.apple.com/app/id' + appId + '"]';

  document.addEventListener('click', function (e) {
    var link = e.target && e.target.closest && e.target.closest(selector);
    if (!link || typeof window.gtag !== 'function') { return; }
    var onApple = /iPhone|iPad|iPod|Macintosh/.test(window.navigator.userAgent);
    window.gtag('event', onApple ? 'download_app_click' : 'download_app_click_non_apple', {
      button_location: link.getAttribute('data-download-location') || 'unknown',
      destination: 'appstore',
      app: appName
    });
  });

  function tagLinks() {
    try {
      var q = new URLSearchParams(window.location.search);
      var paid = q.get('gclid') || q.get('gbraid') || q.get('wbraid') || q.get('utm_medium') === 'cpc';
      if (paid) {
        window.sessionStorage.setItem('ads_camp',
          (q.get('utm_campaign') || 'gads').replace(/[^A-Za-z0-9_.-]/g, '_').slice(0, 40));
      }
      var camp = window.sessionStorage.getItem('ads_camp');
      if (!camp) { return; }
      var links = document.querySelectorAll(selector);
      for (var i = 0; i < links.length; i++) {
        var u = new URL(links[i].href);
        var loc = u.searchParams.get('ct') || 'lp';
        if (loc.indexOf('g_') === 0) { continue; }
        u.searchParams.set('ct', ('g_' + camp + '_' + loc).slice(0, 100));
        links[i].href = u.toString();
      }
    } catch (err) { /* storage or URL unavailable: leave links unchanged */ }
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', tagLinks); }
  else { tagLinks(); }
})();
