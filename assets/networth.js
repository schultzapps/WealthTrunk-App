/* ============================================================
   WealthTrunk — Net Worth calculator + CSV export
   ------------------------------------------------------------
   Quick assets/liabilities entry that ends in a CSV the app's
   importer accepts as-is.

   The export mirrors Resources/import_accounts_template.csv and
   must satisfy Services/DataImportHelper.swift:
     - blank lines and '#' comments are skipped, so the
       instructional preamble is safe to include
     - columns are resolved BY HEADER NAME, not position
     - NO COMMAS in any field — the parser splits naively on ','
     - liabilities carry negative balances
     - CurrentBalance must parse as a Double or the row is dropped
   ============================================================ */
(function () {
    'use strict';

    /* Account types, matched exactly against the app's
       Resources/Account Metadata JSON/account_metadata.json.
       A value the app doesn't recognize silently falls back to
       "Checking" on import, so these strings must stay in sync. */
    var ASSET_TYPES = [
        { group: 'Cash', types: ['Checking', 'Savings', 'High Yield Savings', 'Money Market', 'Cash'] },
        { group: 'Investments', types: ['Brokerage', 'Retirement', 'HSA', 'Crypto', 'Trust Account', 'ESPP', 'Private Equity'] },
        { group: 'Property', types: ['Real Estate', 'Vehicle', 'Collectibles'] },
        { group: 'Education', types: ['529 Education', 'Coverdell ESA'] },
        { group: 'Custodial', types: ['UTMA/UGMA', 'Custodial Brokerage'] },
        { group: 'Future Income', types: ['Employer Pension', 'State Pension', 'Annuity'] },
        { group: 'Other Assets', types: ['Other Asset', 'Other Liquid Asset'] }
    ];
    var LIABILITY_TYPES = [
        { group: 'Credit Cards', types: ['Credit Card'] },
        { group: 'Mortgages', types: ['Mortgage'] },
        { group: 'Loans', types: ['Vehicle Loan', 'Personal Loan', 'Student Loan', 'HELOC', 'Business Loan'] },
        { group: 'Other Liabilities', types: ['Tax Liability', 'Medical Debt', 'Family Loan', 'Other Liability'] }
    ];

    /* No tax-status control on this page: it is a two-column net worth tally, and
       tax treatment is per-account detail the app asks for properly. Every row
       exports as "None", which the importer accepts as-is, so the user sets the
       real status once the accounts are in the app. Deliberately no local copy of
       the app's status list — an unused list here would drift from
       AccountTaxStatus without anything catching it. */

    /* The app's accounts template header, in order. Position doesn't matter to
       the parser, but matching the template keeps the file recognizable. */
    var HEADER = [
        'ID', 'Nickname', 'BankName', 'AccountType', 'TaxStatus', 'IsClosed',
        'InProjection', 'MonthlyContribution', 'ContributionGrowthRate',
        'ReturnRate', 'LoanRate', 'MonthlyPayment', 'Note', 'CurrentBalance',
        'BalanceDate', 'AccountCurrency', 'LogoDomain', 'Owners'
    ];

    /* Seed rows so the page is useful before any typing. */
    var SEED_ASSETS = [
        { name: 'Primary', type: 'Checking', amount: 5000 },
        { name: 'Emergency Fund', type: 'Savings', amount: 15000 },
        { name: 'Investments', type: 'Brokerage', amount: 40000 },
        { name: '401(k)', type: 'Retirement', amount: 120000 },
        { name: 'Our House', type: 'Real Estate', amount: 450000 }
    ];
    var SEED_LIABILITIES = [
        { name: 'Home Mortgage', type: 'Mortgage', amount: 320000 },
        { name: 'Everyday Card', type: 'Credit Card', amount: 4000 }
    ];

    var STORE_KEY = 'wtnetworth_rows';

    /* Symbol and separators follow the browser locale (WTCurrency).
       Purely cosmetic — no conversion is applied to any amount. */
    var groupFmt = window.WTCurrency.group;
    function money(v) { return window.WTCurrency.format(Math.abs(v) < 0.5 ? 0 : v); }

    /* The parser splits rows on ',' with no quote handling, so a comma in any
       field would shift every later column. Strip them (plus newlines) rather
       than quoting, which the parser also wouldn't understand. */
    function csvSafe(text) {
        return String(text == null ? '' : text)
            .replace(/[",\r\n]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function init() {
        var root = document.getElementById('networth-tool');
        if (!root) return;

        var assetsBody = document.getElementById('assets-rows');
        var liabilitiesBody = document.getElementById('liabilities-rows');
        var totalAssetsEl = document.getElementById('total-assets');
        var totalLiabilitiesEl = document.getElementById('total-liabilities');
        var netWorthEl = document.getElementById('net-worth-value');
        var barAssets = document.getElementById('bar-assets');
        var barLiabilities = document.getElementById('bar-liabilities');
        var rowCountEl = document.getElementById('row-count');

        var rows = load();

        function load() {
            try {
                var raw = localStorage.getItem(STORE_KEY);
                if (raw) {
                    var parsed = JSON.parse(raw);
                    if (Array.isArray(parsed) && parsed.length) return parsed;
                }
            } catch (e) { /* fall through to seeds */ }
            return SEED_ASSETS.map(function (r) { return mk(r, 'asset'); })
                .concat(SEED_LIABILITIES.map(function (r) { return mk(r, 'liability'); }));
        }
        function mk(r, kind) {
            return { id: Math.random().toString(36).slice(2), kind: kind,
                     name: r.name, type: r.type, amount: r.amount };
        }
        function save() {
            try { localStorage.setItem(STORE_KEY, JSON.stringify(rows)); }
            catch (e) { /* private browsing */ }
        }

        function optionsFor(kind, selected) {
            var groups = kind === 'asset' ? ASSET_TYPES : LIABILITY_TYPES;
            return groups.map(function (g) {
                var opts = g.types.map(function (t) {
                    return '<option value="' + t + '"' +
                        (t === selected ? ' selected' : '') + '>' + t + '</option>';
                }).join('');
                return '<optgroup label="' + g.group + '">' + opts + '</optgroup>';
            }).join('');
        }

        function renderRows() {
            [['asset', assetsBody], ['liability', liabilitiesBody]].forEach(function (pair) {
                var kind = pair[0], body = pair[1];
                body.innerHTML = '';
                rows.filter(function (r) { return r.kind === kind; }).forEach(function (r) {
                    var div = document.createElement('div');
                    div.className = 'nw-row';
                    div.innerHTML =
                        '<input class="nw-name" type="text" value="' +
                            r.name.replace(/"/g, '&quot;') +
                            '" aria-label="Account name" placeholder="Account name">' +
                        '<span class="select-wrap nw-type-wrap">' +
                            '<select class="nw-type" aria-label="Account type">' +
                            optionsFor(kind, r.type) + '</select></span>' +
                        '<span class="currency-input nw-amount-wrap">' +
                            '<span class="prefix">' + window.WTCurrency.symbol + '</span>' +
                            '<input class="nw-amount" type="text" inputmode="numeric" ' +
                            'value="' + groupFmt.format(r.amount) + '" aria-label="Amount"></span>' +
                        '<button type="button" class="nw-remove" aria-label="Remove ' +
                            r.name.replace(/"/g, '&quot;') + '">' +
                            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" ' +
                            'stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
                            'aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/>' +
                            '<line x1="6" y1="6" x2="18" y2="18"/></svg></button>';

                    div.querySelector('.nw-name').addEventListener('input', function (e) {
                        r.name = e.target.value; save(); recalc();
                    });
                    div.querySelector('.nw-type').addEventListener('change', function (e) {
                        r.type = e.target.value; save();
                    });
                    var amt = div.querySelector('.nw-amount');
                    amt.addEventListener('input', function (e) {
                        var digits = e.target.value.replace(/[^0-9]/g, '');
                        r.amount = digits === '' ? 0 : parseInt(digits, 10);
                        e.target.value = digits === '' ? '' : groupFmt.format(r.amount);
                        save(); recalc();
                    });
                    amt.addEventListener('blur', function (e) {
                        e.target.value = groupFmt.format(r.amount);
                    });
                    div.querySelector('.nw-remove').addEventListener('click', function () {
                        rows = rows.filter(function (x) { return x !== r; });
                        save(); renderRows(); recalc();
                    });
                    body.appendChild(div);
                });
            });
        }

        function recalc() {
            var assets = 0, liabilities = 0;
            rows.forEach(function (r) {
                if (r.kind === 'asset') assets += r.amount;
                else liabilities += r.amount;
            });
            var net = assets - liabilities;
            totalAssetsEl.textContent = money(assets);
            totalLiabilitiesEl.textContent = money(liabilities);
            netWorthEl.textContent = money(net);
            netWorthEl.classList.toggle('is-negative', net < 0);

            // Proportional bar: assets vs liabilities against the larger side.
            var scale = Math.max(assets, liabilities, 1);
            barAssets.style.width = (assets / scale * 100) + '%';
            barLiabilities.style.width = (liabilities / scale * 100) + '%';

            if (rowCountEl) {
                var n = rows.length;
                rowCountEl.textContent = n + (n === 1 ? ' account' : ' accounts');
            }
        }

        function addRow(kind) {
            rows.push(mk({
                name: '',
                type: kind === 'asset' ? 'Checking' : 'Credit Card',
                amount: 0
            }, kind));
            save(); renderRows(); recalc();
            // Focus the name field of the row just added.
            var body = kind === 'asset' ? assetsBody : liabilitiesBody;
            var inputs = body.querySelectorAll('.nw-name');
            if (inputs.length) inputs[inputs.length - 1].focus();
        }

        document.getElementById('add-asset').addEventListener('click', function () { addRow('asset'); });
        document.getElementById('add-liability').addEventListener('click', function () { addRow('liability'); });

        var resetBtn = document.getElementById('reset-rows');
        if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                rows = SEED_ASSETS.map(function (r) { return mk(r, 'asset'); })
                    .concat(SEED_LIABILITIES.map(function (r) { return mk(r, 'liability'); }));
                save(); renderRows(); recalc();
            });
        }

        /* ------------------------------------------------------------
           CSV export
           ------------------------------------------------------------ */
        function buildCSV() {
            var today = new Date().toISOString().slice(0, 10);
            var lines = [
                '# WealthTrunk account import — generated ' + today +
                    ' by wealthtrunk.app/net-worth-calculator.html',
                HEADER.join(',')
            ];

            rows.forEach(function (r) {
                var amount = r.kind === 'liability' ? -Math.abs(r.amount) : Math.abs(r.amount);
                var name = csvSafe(r.name) || (r.kind === 'asset' ? 'Asset' : 'Liability');
                var record = {
                    ID: '',
                    Nickname: name,
                    BankName: '',
                    AccountType: csvSafe(r.type),
                    TaxStatus: 'None',
                    IsClosed: 'FALSE',
                    InProjection: 'TRUE',
                    MonthlyContribution: '0',
                    ContributionGrowthRate: '0',
                    ReturnRate: '0',
                    LoanRate: '0',
                    MonthlyPayment: '0',
                    Note: '',
                    CurrentBalance: String(amount),
                    BalanceDate: today,
                    AccountCurrency: '',
                    LogoDomain: '',
                    Owners: ''
                };
                lines.push(HEADER.map(function (col) { return record[col]; }).join(','));
            });

            return lines.join('\n') + '\n';
        }

        document.getElementById('export-csv').addEventListener('click', function () {
            var blob = new Blob([buildCSV()], { type: 'text/csv;charset=utf-8;' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'wealthtrunk-accounts.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(function () { URL.revokeObjectURL(url); }, 1000);

            var note = document.getElementById('export-done');
            if (note) note.hidden = false;

            if (typeof gtag === 'function') {
                gtag('event', 'networth_csv_export', {
                    accounts: rows.length, app: 'wealthtrunk'
                });
            }
        });

        renderRows();
        recalc();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
