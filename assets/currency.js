/* ============================================================
   WealthTrunk — display currency
   ------------------------------------------------------------
   Picks a currency symbol from the browser's locale so a visitor
   in Britain sees £ and one in Germany sees €.

   COSMETIC ONLY. No conversion happens anywhere: 500 entered is
   500 projected, whatever symbol sits in front of it. The locale
   decides presentation (symbol, placement, separators) and
   nothing else.

   navigator.language reports the user's language/region setting,
   not their physical location — a US expat in London with an
   en-US browser still sees $. That's the accepted tradeoff for
   keeping this entirely client-side with no IP lookup.
   ============================================================ */
window.WTCurrency = (function () {
    'use strict';

    /* Region -> currency for the markets worth naming. Anything
       unlisted falls through to USD. */
    var REGION_CURRENCY = {
        GB: 'GBP', JE: 'GBP', GG: 'GBP', IM: 'GBP',
        US: 'USD', EC: 'USD', SV: 'USD', PA: 'USD',
        CA: 'CAD', AU: 'AUD', NZ: 'NZD',
        CH: 'CHF', LI: 'CHF',
        JP: 'JPY', CN: 'CNY', HK: 'HKD', TW: 'TWD',
        SG: 'SGD', KR: 'KRW', IN: 'INR', ID: 'IDR',
        MY: 'MYR', TH: 'THB', PH: 'PHP', VN: 'VND',
        SE: 'SEK', NO: 'NOK', DK: 'DKK', IS: 'ISK',
        PL: 'PLN', CZ: 'CZK', HU: 'HUF', RO: 'RON',
        BG: 'BGN', UA: 'UAH', TR: 'TRY', RU: 'RUB',
        IL: 'ILS', AE: 'AED', SA: 'SAR', QA: 'QAR',
        KW: 'KWD', BH: 'BHD', OM: 'OMR', EG: 'EGP',
        ZA: 'ZAR', NG: 'NGN', KE: 'KES', GH: 'GHS',
        MA: 'MAD', BR: 'BRL', MX: 'MXN', AR: 'ARS',
        CL: 'CLP', CO: 'COP', PE: 'PEN', UY: 'UYU',
        // Eurozone
        AT: 'EUR', BE: 'EUR', CY: 'EUR', EE: 'EUR', FI: 'EUR',
        FR: 'EUR', DE: 'EUR', GR: 'EUR', IE: 'EUR', IT: 'EUR',
        LV: 'EUR', LT: 'EUR', LU: 'EUR', MT: 'EUR', NL: 'EUR',
        PT: 'EUR', SK: 'EUR', SI: 'EUR', ES: 'EUR', HR: 'EUR',
        MC: 'EUR', AD: 'EUR', SM: 'EUR', VA: 'EUR', ME: 'EUR'
    };

    function detectLocale() {
        try {
            var langs = navigator.languages;
            if (langs && langs.length) return langs[0];
            return navigator.language || 'en-US';
        } catch (e) { return 'en-US'; }
    }

    function regionOf(locale) {
        /* Prefer the region Intl resolves (it expands "en-GB" and
           also fills in a default region for a bare "de"). */
        try {
            var opts = new Intl.Locale(locale).maximize();
            if (opts && opts.region) return opts.region;
        } catch (e) { /* Intl.Locale is unavailable on older Safari */ }
        var parts = String(locale).split('-');
        for (var i = 1; i < parts.length; i++) {
            if (/^[A-Za-z]{2}$/.test(parts[i])) return parts[i].toUpperCase();
        }
        return '';
    }

    var locale = detectLocale();
    var currency = REGION_CURRENCY[regionOf(locale)] || 'USD';

    /* Every figure here is a whole unit, so no currency needs
       decimals — that sidesteps the JPY/KRW zero-decimal rule too. */
    function makeFormatter() {
        try {
            return new Intl.NumberFormat(locale, {
                style: 'currency', currency: currency,
                maximumFractionDigits: 0
            });
        } catch (e) {
            return new Intl.NumberFormat('en-US', {
                style: 'currency', currency: 'USD',
                maximumFractionDigits: 0
            });
        }
    }

    var fmt = makeFormatter();

    /* The bare symbol, for input prefixes. Formatting zero and
       stripping the digits/separators leaves just the symbol,
       which beats maintaining a second symbol table. */
    function symbol() {
        try {
            var parts = fmt.formatToParts(0);
            for (var i = 0; i < parts.length; i++) {
                if (parts[i].type === 'currency') return parts[i].value;
            }
        } catch (e) { /* fall through */ }
        return '$';
    }

    return {
        code: currency,
        locale: locale,
        symbol: symbol(),
        format: function (value) { return fmt.format(value); },
        /* Plain grouped number in the user's locale — no symbol. */
        group: new Intl.NumberFormat(locale, { maximumFractionDigits: 0 })
    };
})();
