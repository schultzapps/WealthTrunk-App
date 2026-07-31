/* ============================================================
   WealthTrunk — web calculators
   ------------------------------------------------------------
   Direct port of the iOS app's projection math so the web and
   the app produce identical numbers from identical inputs.

   Growth  — ProjectionChartViewModel.swift:243
             (calculateAssetWithPhaseDTO + the monthly loop at :332)
   Pension — FixedIncomeCalculatorView.swift:413 (presentValue)

   Three modes, one engine:
     'investment' — balance + monthly contributions over N years
     'kids'       — same growth, horizon derived from a child's age
     'pension'    — present value of a deferred monthly income

   No dependencies; the chart is hand-rolled SVG.
   ============================================================ */
(function () {
    'use strict';

    /* ------------------------------------------------------------
       Defaults. Inputs persist to localStorage (the web analogue of
       the app's @AppStorage), shared across the growth calculators
       so switching pages keeps your assumptions.
       ------------------------------------------------------------ */
    var DEFAULTS = {
        // Growth (investment + kids)
        startingBalance: 10000,
        monthlyContribution: 500,
        contributionGrowthRate: 0,   // annual escalation, as a fraction
        expectedReturn: 7,           // percent
        inflationRate: 2.5,          // percent
        yearsInvested: 20,
        // Kids-specific
        childAge: 4,
        targetAge: 18,
        savingsGoal: 0,              // 0 == no goal set
        // Pension
        monthlyIncome: 3000,
        yearsUntilStart: 10,
        termYears: 25,
        discountRate: 5              // percent
    };

    /* Upper bound for entered amounts, guarding against layout/chart
       breakage from an unrealistically large entry. */
    var MAX_AMOUNT = 100000000;

    var STORE_PREFIX = 'wtcalc_';

    /* ------------------------------------------------------------
       Formatting
       ------------------------------------------------------------ */
    /* Symbol and separators follow the browser locale (WTCurrency).
       Purely cosmetic — the math never converts between currencies. */
    var groupFmt = window.WTCurrency.group;

    function money(value) {
        // -0 formats as "-$0"; normalize it away.
        return window.WTCurrency.format(Math.abs(value) < 0.5 ? 0 : value);
    }
    function signedMoney(value) {
        return (value > 0 ? '+' : '') + money(value);
    }
    function percent(value, digits) {
        return value.toFixed(digits === undefined ? 1 : digits) + '%';
    }

    /* ------------------------------------------------------------
       Persistence
       ------------------------------------------------------------ */
    function readStore(key, fallback) {
        try {
            var raw = localStorage.getItem(STORE_PREFIX + key);
            if (raw === null) return fallback;
            var parsed = JSON.parse(raw);
            return parsed === null ? fallback : parsed;
        } catch (e) { return fallback; }
    }
    function writeStore(key, value) {
        try { localStorage.setItem(STORE_PREFIX + key, JSON.stringify(value)); }
        catch (e) { /* private browsing — inputs just won't persist */ }
    }

    /* ------------------------------------------------------------
       Model — projection math, ported 1:1 from Swift.
       ------------------------------------------------------------ */
    function Model(state) {
        this.state = state;
    }

    /* The horizon in years. For the kids calculator it's derived from the
       child's age rather than entered directly — a parent knows their kid is 4
       and will need the money at 18, not that they have a 14-year horizon. */
    Model.prototype.years = function () {
        if (this.state.mode === 'kids') {
            return Math.max(0, this.state.targetAge - this.state.childAge);
        }
        return this.state.yearsInvested;
    };

    /**
     * Inflation-adjusted ("real") return via the Fisher equation:
     *   real = (1 + nominal) / (1 + inflation) − 1
     * Expressed as a percentage. With inflation at 0 this returns the nominal
     * rate unchanged, so the projection collapses to plain future dollars.
     */
    Model.prototype.realReturn = function () {
        var nominal = this.state.expectedReturn / 100;
        var inflation = this.state.inflationRate / 100;
        return ((1 + nominal) / (1 + inflation) - 1) * 100;
    };

    /**
     * Month-by-month projection, mirroring calculateAssetWithPhaseDTO.
     *
     * Per month: the balance grows first, then the contribution is added —
     * and the contribution itself escalates annually by contributionGrowthRate.
     * Balances are floored at 0, as in the app.
     *
     * Compounds at the *real* return so balances land in today's purchasing
     * power. The app projects in nominal terms; setting inflation to 0 here
     * reproduces its numbers exactly.
     *
     * Returns yearly samples for the chart plus the contribution/growth split.
     */
    Model.prototype.growth = function () {
        var s = this.state;
        var years = this.years();
        var months = Math.round(years * 12);

        var periodReturn = Math.pow(1 + this.realReturn() / 100, 1 / 12) - 1;
        var balance = s.startingBalance;
        var totalContributions = 0;

        var points = [{ year: 0, value: balance }];

        for (var month = 1; month <= months; month++) {
            balance = balance * (1 + periodReturn);

            var yearsElapsed = month / 12;
            var adjusted = s.monthlyContribution *
                Math.pow(1 + s.contributionGrowthRate, yearsElapsed);
            balance += adjusted;
            totalContributions += adjusted;

            balance = Math.max(balance, 0);

            if (month % 12 === 0) {
                points.push({ year: month / 12, value: balance });
            }
        }

        // A fractional final year still deserves an endpoint on the chart.
        if (months % 12 !== 0 && months > 0) {
            points.push({ year: years, value: balance });
        }

        return {
            points: points,
            finalBalance: balance,
            totalContributions: totalContributions,
            totalGrowth: balance - (s.startingBalance + totalContributions)
        };
    };

    /* Monthly equivalent of an annual effective rate. */
    function monthlyRate(annualRate) {
        return Math.pow(1 + annualRate, 1 / 12) - 1;
    }

    /**
     * Present value of a deferred annuity, mirroring FixedIncomeCalculatorView.
     *
     * growthRate is fixed at 0 in the app (income escalation was deliberately
     * left out to keep the calculator elementary), so it's fixed here too. The
     * growth term is kept in the formula rather than simplified away, matching
     * the Swift, so a growth input could be reintroduced without a rewrite.
     */
    Model.prototype.pension = function () {
        var s = this.state;
        var growthRate = 0;
        var discount = s.discountRate / 100;

        // The geometric series diverges unless r > g strictly.
        var hasValidRates = discount > growthRate + 0.0001;
        if (!(s.monthlyIncome > 0) || !hasValidRates || s.termYears <= 0) {
            return { presentValue: 0, totalPayments: 0, points: [{ year: 0, value: 0 }] };
        }

        var rM = monthlyRate(discount);
        var gM = monthlyRate(growthRate);
        var tPeriods = s.yearsUntilStart * 12;
        var deferralFactor = Math.pow(1 + rM, tPeriods);
        var nPeriods = s.termYears * 12;
        var ratio = (1 + gM) / (1 + rM);
        var pvAtStart = s.monthlyIncome * (1 - Math.pow(ratio, nPeriods)) / (rM - gM);
        var presentValue = pvAtStart / deferralFactor;

        // Chart: cumulative nominal payments received once the income starts.
        // The headline is the PV; this curve shows what's actually paid out.
        var points = [{ year: 0, value: 0 }];
        var totalYears = s.yearsUntilStart + s.termYears;
        for (var year = 1; year <= totalYears; year++) {
            var monthsPaid = Math.max(0, (year - s.yearsUntilStart) * 12);
            points.push({ year: year, value: s.monthlyIncome * monthsPaid });
        }

        return {
            presentValue: presentValue,
            totalPayments: s.monthlyIncome * nPeriods,
            points: points
        };
    };

    function lastValue(points) {
        return points.length ? points[points.length - 1].value : 0;
    }
    function valueAt(points, year) {
        for (var i = 0; i < points.length; i++) {
            if (points[i].year === year) return points[i].value;
        }
        return lastValue(points);
    }

    /* ------------------------------------------------------------
       Chart — inline SVG line + area, matching the app's styling.
       ------------------------------------------------------------ */
    var SVG_NS = 'http://www.w3.org/2000/svg';
    var PAD_TOP = 10;
    var PAD_BOTTOM = 2;

    function Chart(svg, gradientId) {
        this.svg = svg;
        this.gradientId = gradientId;
        this.build();
    }

    Chart.prototype.build = function () {
        var defs = document.createElementNS(SVG_NS, 'defs');
        var grad = document.createElementNS(SVG_NS, 'linearGradient');
        grad.setAttribute('id', this.gradientId);
        grad.setAttribute('x1', '0'); grad.setAttribute('y1', '0');
        grad.setAttribute('x2', '0'); grad.setAttribute('y2', '1');
        var top = document.createElementNS(SVG_NS, 'stop');
        top.setAttribute('offset', '0%');
        top.setAttribute('stop-color', 'var(--accent-primary)');
        top.setAttribute('stop-opacity', '0.5');
        var bottom = document.createElementNS(SVG_NS, 'stop');
        bottom.setAttribute('offset', '100%');
        bottom.setAttribute('stop-color', 'var(--accent-primary)');
        bottom.setAttribute('stop-opacity', '0');
        grad.appendChild(top); grad.appendChild(bottom);
        defs.appendChild(grad);
        this.svg.appendChild(defs);

        this.area = document.createElementNS(SVG_NS, 'path');
        this.area.setAttribute('class', 'chart-area');
        this.area.setAttribute('fill', 'url(#' + this.gradientId + ')');

        // Dashed comparison line: contributions-only (no growth).
        this.compareLine = document.createElementNS(SVG_NS, 'path');
        this.compareLine.setAttribute('class', 'chart-line-taxable');

        this.line = document.createElementNS(SVG_NS, 'path');
        this.line.setAttribute('class', 'chart-line-hsa');

        this.rule = document.createElementNS(SVG_NS, 'line');
        this.rule.setAttribute('class', 'chart-rule chart-hidden');

        this.dot = document.createElementNS(SVG_NS, 'circle');
        this.dot.setAttribute('class', 'chart-dot chart-hidden');
        this.dot.setAttribute('r', '5');

        this.svg.appendChild(this.compareLine);
        this.svg.appendChild(this.area);
        this.svg.appendChild(this.line);
        this.svg.appendChild(this.rule);
        this.svg.appendChild(this.dot);
    };

    /* Catmull-Rom through the data points as cubic Béziers. Control points are
       clamped to the plot box so a smoothed curve can't overshoot out of frame. */
    function smoothPath(pts, top, bottom) {
        if (!pts.length) return '';
        if (pts.length < 3) {
            return pts.map(function (p, i) {
                return (i ? 'L' : 'M') + p.x.toFixed(2) + ' ' + p.y.toFixed(2);
            }).join(' ');
        }
        var clamp = function (y) { return Math.min(Math.max(y, top), bottom); };
        var d = 'M' + pts[0].x.toFixed(2) + ' ' + pts[0].y.toFixed(2);
        for (var i = 0; i < pts.length - 1; i++) {
            var p0 = pts[i - 1] || pts[i];
            var p1 = pts[i];
            var p2 = pts[i + 1];
            var p3 = pts[i + 2] || p2;
            var c1x = p1.x + (p2.x - p0.x) / 6;
            var c1y = clamp(p1.y + (p2.y - p0.y) / 6);
            var c2x = p2.x - (p3.x - p1.x) / 6;
            var c2y = clamp(p2.y - (p3.y - p1.y) / 6);
            d += ' C' + c1x.toFixed(2) + ' ' + c1y.toFixed(2) +
                 ' ' + c2x.toFixed(2) + ' ' + c2y.toFixed(2) +
                 ' ' + p2.x.toFixed(2) + ' ' + p2.y.toFixed(2);
        }
        return d;
    }

    Chart.prototype.render = function (series, compare, yMax, xMax, reveal) {
        var rect = this.svg.getBoundingClientRect();
        var w = rect.width, h = rect.height;
        if (!w || !h) return;

        this.svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);

        var top = PAD_TOP;
        var bottom = h - PAD_BOTTOM;
        var domainMax = Math.max(yMax, 1);
        var domainX = Math.max(xMax, 1);

        var toPoint = function (p) {
            return {
                x: (p.year / domainX) * w,
                y: bottom - ((p.value * reveal) / domainMax) * (bottom - top)
            };
        };

        var pts = series.map(toPoint);
        this.points = pts;
        this.series = series;
        this.plotTop = top;
        this.plotBottom = bottom;

        var linePath = smoothPath(pts, top, bottom);
        this.line.setAttribute('d', linePath);
        this.area.setAttribute('d', linePath
            ? linePath + ' L' + pts[pts.length - 1].x.toFixed(2) + ' ' + bottom.toFixed(2) +
              ' L' + pts[0].x.toFixed(2) + ' ' + bottom.toFixed(2) + ' Z'
            : '');

        if (compare && compare.length) {
            this.compareLine.setAttribute('d', smoothPath(compare.map(toPoint), top, bottom));
            this.compareLine.style.display = '';
        } else {
            this.compareLine.style.display = 'none';
        }
    };

    Chart.prototype.highlight = function (index) {
        if (index === null || !this.points || !this.points[index]) {
            this.rule.classList.add('chart-hidden');
            this.dot.classList.add('chart-hidden');
            return;
        }
        var p = this.points[index];
        this.rule.setAttribute('x1', p.x); this.rule.setAttribute('x2', p.x);
        this.rule.setAttribute('y1', this.plotTop); this.rule.setAttribute('y2', this.plotBottom);
        this.dot.setAttribute('cx', p.x); this.dot.setAttribute('cy', p.y);
        this.rule.classList.remove('chart-hidden');
        this.dot.classList.remove('chart-hidden');
    };

    /* ------------------------------------------------------------
       Animated numbers — each update retargets the running tween, so
       dragging a slider reads as the value chasing your finger.
       ------------------------------------------------------------ */
    var reduceMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function AnimatedValue(el, format) {
        this.el = el; this.format = format;
        this.current = 0; this.target = 0; this.frame = null;
    }
    AnimatedValue.prototype.set = function (value, immediate) {
        this.target = value;
        if (immediate || reduceMotion) {
            this.current = value;
            this.el.textContent = this.format(value);
            return;
        }
        if (this.frame) return;
        var self = this;
        var step = function () {
            var delta = self.target - self.current;
            if (Math.abs(delta) < 0.5) {
                self.current = self.target;
                self.el.textContent = self.format(self.current);
                self.frame = null;
                return;
            }
            self.current += delta * 0.28;
            self.el.textContent = self.format(self.current);
            self.frame = requestAnimationFrame(step);
        };
        this.frame = requestAnimationFrame(step);
    };

    /* ------------------------------------------------------------
       Wiring
       ------------------------------------------------------------ */
    function init() {
        var root = document.querySelector('[data-calculator]');
        if (!root) return;

        var mode = root.getAttribute('data-calculator'); // investment | kids | pension
        var isPension = mode === 'pension';
        var isKids = mode === 'kids';

        var state = { mode: mode };
        Object.keys(DEFAULTS).forEach(function (k) {
            state[k] = readStore(k, DEFAULTS[k]);
        });

        var model = new Model(state);
        var $ = function (id) { return document.getElementById(id); };

        /* The markup ships "$" so the field reads correctly without JS;
           swap in the locale's symbol once we're running. */
        Array.prototype.forEach.call(
            document.querySelectorAll('.currency-input .prefix'),
            function (el) { el.textContent = window.WTCurrency.symbol; }
        );

        var resultValueEl = $('result-value');
        var resultCaptionEl = $('result-caption');
        var statAValue = $('stat-a-value');
        var statBValue = $('stat-b-value');
        var goalRow = $('goal-row');
        var goalValue = $('goal-value');
        var disclaimerEl = $('calc-disclaimer');
        var axisStartEl = $('axis-start');
        var axisEndEl = $('axis-end');
        var svg = $('calc-chart');

        var headline = new AnimatedValue(resultValueEl, money);
        var statA = new AnimatedValue(statAValue, money);
        var statB = new AnimatedValue(statBValue, money);
        var goalStat = goalValue ? new AnimatedValue(goalValue, signedMoney) : null;

        var chart = new Chart(svg, 'wtCalcGradient');
        var reveal = reduceMotion ? 1 : 0;
        var scrubbedIndex = null;

        /* Echoes the chosen start year into the term-length hint, so "25 years"
           reads as a span rather than a bare count. */
        var startYearEcho = document.getElementById('start-year-echo');
        function paintStartYear() {
            if (!startYearEcho) return;
            startYearEcho.textContent = String(new Date().getFullYear() + state.yearsUntilStart);
        }

        /* The Fisher real rate, shown under the inflation slider so the two
           percentage inputs resolve into the one number actually compounding. */
        var realRateEl = document.getElementById('real-rate');
        function paintReal() {
            if (!realRateEl) return;
            var real = model.realReturn();
            realRateEl.textContent = percent(real);
            realRateEl.classList.toggle('is-negative', real < 0);
        }

        function render() {
            var result = isPension ? model.pension() : model.growth();
            var series = result.points;

            // Contributions-only comparison line (growth stripped out), so the
            // area between the curves *is* the compounding. Deflated by the same
            // inflation assumption as the main series — otherwise nominal
            // contributions would be compared against a real-terms balance and
            // could sit above it.
            var compare = null;
            if (!isPension) {
                var infl = state.inflationRate / 100;
                compare = [{ year: 0, value: state.startingBalance }];
                for (var i = 1; i < series.length; i++) {
                    var months = Math.round(series[i].year * 12);
                    var contrib = 0;
                    for (var m = 1; m <= months; m++) {
                        contrib += state.monthlyContribution *
                            Math.pow(1 + state.contributionGrowthRate, m / 12);
                    }
                    var deflator = Math.pow(1 + infl, series[i].year);
                    compare.push({
                        year: series[i].year,
                        value: (state.startingBalance + contrib) / deflator
                    });
                }
            }

            var peak = series.reduce(function (mx, p) { return Math.max(mx, p.value); }, 0);
            if (compare) {
                peak = compare.reduce(function (mx, p) { return Math.max(mx, p.value); }, peak);
            }
            var yMax = Math.ceil(peak * 1.05);
            var xMax = series.length ? series[series.length - 1].year : 1;

            chart.render(series, compare, yMax, xMax, reveal);
            chart.highlight(scrubbedIndex);

            var scrubYear = scrubbedIndex === null ? null : series[scrubbedIndex].year;

            if (isPension) {
                headline.set(result.presentValue);
                resultCaptionEl.textContent = 'Present Value Today';
                statA.set(result.presentValue);
                statB.set(result.totalPayments);
            } else {
                var headlineValue = scrubYear === null
                    ? result.finalBalance
                    : valueAt(series, scrubYear);
                headline.set(headlineValue);

                if (scrubYear === null) {
                    resultCaptionEl.textContent = isKids
                        ? 'Saved by age ' + state.targetAge
                        : 'Projected Balance';
                } else {
                    resultCaptionEl.textContent = isKids
                        ? 'At age ' + (state.childAge + scrubYear)
                        : 'Year ' + scrubYear;
                }

                statA.set(state.startingBalance + result.totalContributions);
                statB.set(result.totalGrowth);

                if (goalRow) {
                    var hasGoal = state.savingsGoal > 0;
                    goalRow.hidden = !hasGoal;
                    if (hasGoal && goalStat) {
                        goalStat.set(result.finalBalance - state.savingsGoal);
                    }
                }
            }

            // The kids chart is labeled by the child's age, not elapsed years.
            var thisYear = new Date().getFullYear();
            if (axisStartEl) {
                axisStartEl.textContent = isKids ? 'Age ' + state.childAge
                    : (isPension ? String(thisYear) : 'Today');
            }
            if (axisEndEl) {
                axisEndEl.textContent = isKids
                    ? 'Age ' + state.targetAge
                    : (isPension
                        ? String(thisYear + state.yearsUntilStart + state.termYears)
                        : 'Year ' + state.yearsInvested);
            }
            disclaimerEl.textContent = disclaimerText(result);
        }

        function disclaimerText(result) {
            if (isPension) {
                var startYear = new Date().getFullYear() + state.yearsUntilStart;
                return 'Assumes ' + money(state.monthlyIncome) + '/month for ' +
                    state.termYears + ' years starting in ' + startYear +
                    ', discounted at ' + percent(state.discountRate) +
                    '. For illustrative purposes only. ' +
                    'Not financial, tax, or investment advice.';
            }
            var years = model.years();
            var horizon = isKids
                ? 'from age ' + state.childAge + ' to age ' + state.targetAge +
                  ' (' + years + ' years)'
                : 'for ' + years + ' years';
            var real = model.realReturn();
            return 'Assumes ' + money(state.startingBalance) + ' to start plus ' +
                money(state.monthlyContribution) + '/month ' + horizon + ' at a ' +
                percent(state.expectedReturn) + ' annual return' +
                (state.contributionGrowthRate > 0
                    ? ', with contributions rising ' +
                      percent(state.contributionGrowthRate * 100) + ' a year'
                    : '') +
                (state.inflationRate > 0
                    ? ', less ' + percent(state.inflationRate) +
                      ' inflation for a ' + percent(real) +
                      ' real return — so the result is in today\'s money'
                    : '. Inflation is set to 0%, so the result is in future dollars') +
                '. For illustrative purposes only. Not financial, tax, or investment advice.';
        }

        function update(key, value) {
            state[key] = value;
            writeStore(key, value);
            render();
        }

        /* --- Sliders --- */
        function bindSlider(id, key, opts) {
            var input = $(id);
            if (!input) return null;
            var label = $(id + '-value');
            var format = (opts && opts.format) || function (v) { return String(v); };
            var parse = (opts && opts.parse) || parseFloat;

            var paint = function () {
                var min = parseFloat(input.min), max = parseFloat(input.max);
                var pct = max === min ? 0 : ((parseFloat(input.value) - min) / (max - min)) * 100;
                input.style.setProperty('--fill', pct + '%');
                // Label formats the *slider's* value, not the parsed state value —
                // for inputs whose stored form differs from their displayed form
                // (a growth rate is stored as a fraction but shown as a percent)
                // those are different numbers.
                if (label) label.textContent = format(parseFloat(input.value));
            };
            // Likewise, seed the slider from the display form of the stored value.
            input.value = (opts && opts.toSlider) ? opts.toSlider(state[key]) : state[key];
            paint();
            input.addEventListener('input', function () {
                var value = parse(input.value);
                paint();
                if (opts && opts.onInput) opts.onInput(value);
                update(key, value);
            });
            return { input: input, paint: paint };
        }

        /* --- Currency fields --- */
        function bindCurrency(id, key) {
            var input = $(id);
            if (!input) return null;
            var show = function () { input.value = groupFmt.format(state[key]); };
            show();
            input.addEventListener('input', function () {
                var digits = input.value.replace(/[^0-9]/g, '');
                var value = Math.min(digits === '' ? 0 : parseInt(digits, 10), MAX_AMOUNT);
                input.value = digits === '' ? '' : groupFmt.format(value);
                update(key, value);
            });
            input.addEventListener('blur', show);
            return { show: show };
        }

        if (isPension) {
            bindCurrency('monthly-income', 'monthlyIncome');
            // The slider still stores years-from-now (that's what the PV math
            // needs), but it reads out as a calendar year — matching the app's
            // "Start Year" row, since people know the year they retire rather
            // than the number of years away it is.
            bindSlider('years-until-start', 'yearsUntilStart', {
                parse: function (v) { return parseInt(v, 10); },
                format: function (v) {
                    var year = new Date().getFullYear() + v;
                    return v === 0 ? String(year) + ' (now)' : String(year);
                },
                onInput: function () { paintStartYear(); }
            });
            bindSlider('term-years', 'termYears', {
                parse: function (v) { return parseInt(v, 10); },
                format: function (v) { return v + (v === 1 ? ' year' : ' years'); }
            });
            bindSlider('discount-rate', 'discountRate', {
                format: function (v) { return percent(v); }
            });
        } else {
            bindCurrency('starting-balance', 'startingBalance');
            bindCurrency('monthly-contribution', 'monthlyContribution');
            bindSlider('expected-return', 'expectedReturn', {
                format: function (v) { return percent(v); },
                onInput: function () { paintReal(); }
            });
            bindSlider('inflation-rate', 'inflationRate', {
                format: function (v) { return percent(v); },
                onInput: function () { paintReal(); }
            });
            // Stored as a fraction (0.03) because the projection math multiplies
            // by it, but the slider and label work in whole percents (3.0%).
            bindSlider('contribution-growth', 'contributionGrowthRate', {
                parse: function (v) { return parseFloat(v) / 100; },
                toSlider: function (stored) { return stored * 100; },
                format: function (v) { return percent(v); }
            });

            if (isKids) {
                bindCurrency('savings-goal', 'savingsGoal');
                // Both age sliders re-render; the horizon is targetAge - childAge,
                // so keep them from crossing.
                var childSlider = bindSlider('child-age', 'childAge', {
                    parse: function (v) { return parseInt(v, 10); },
                    format: function (v) { return v === 0 ? 'Newborn' : v + ' years old'; }
                });
                var targetSlider = bindSlider('target-age', 'targetAge', {
                    parse: function (v) { return parseInt(v, 10); },
                    format: function (v) { return 'Age ' + v; }
                });
                if (childSlider && targetSlider) {
                    childSlider.input.addEventListener('input', function () {
                        if (state.childAge >= state.targetAge) {
                            update('targetAge', Math.min(state.childAge + 1, 30));
                            targetSlider.input.value = state.targetAge;
                            targetSlider.paint();
                        }
                    });
                    targetSlider.input.addEventListener('input', function () {
                        if (state.targetAge <= state.childAge) {
                            update('childAge', Math.max(state.targetAge - 1, 0));
                            childSlider.input.value = state.childAge;
                            childSlider.paint();
                        }
                    });
                }
            } else {
                bindSlider('years-invested', 'yearsInvested', {
                    parse: function (v) { return parseInt(v, 10); },
                    format: function (v) { return v + (v === 1 ? ' year' : ' years'); }
                });
            }
        }

        /* --- Scrubbing --- */
        var wrap = svg.parentNode;

        function scrubTo(clientX) {
            var rect = svg.getBoundingClientRect();
            if (!rect.width || !chart.series) return;
            var fraction = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
            var index = Math.round(fraction * (chart.series.length - 1));
            index = Math.min(Math.max(index, 0), chart.series.length - 1);
            if (index === scrubbedIndex) return;
            scrubbedIndex = index;
            render();
        }
        function endScrub() {
            if (scrubbedIndex === null) return;
            scrubbedIndex = null;
            render();
        }

        wrap.addEventListener('pointerdown', function (e) {
            wrap.setPointerCapture(e.pointerId);
            scrubTo(e.clientX);
        });
        wrap.addEventListener('pointermove', function (e) {
            // Hover scrubs on mouse; touch only scrubs with the finger down, so
            // the gesture never fights a page scroll.
            if (e.pointerType === 'mouse' || e.buttons) scrubTo(e.clientX);
        });
        wrap.addEventListener('pointerup', endScrub);
        wrap.addEventListener('pointercancel', endScrub);
        wrap.addEventListener('pointerleave', endScrub);

        wrap.setAttribute('tabindex', '0');
        wrap.addEventListener('keydown', function (e) {
            if (!chart.series) return;
            var maxIndex = chart.series.length - 1;
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                var next = scrubbedIndex === null
                    ? (e.key === 'ArrowRight' ? 0 : maxIndex)
                    : scrubbedIndex + (e.key === 'ArrowRight' ? 1 : -1);
                scrubbedIndex = Math.min(Math.max(next, 0), maxIndex);
                render();
            } else if (e.key === 'Escape') {
                endScrub();
            }
        });
        wrap.addEventListener('blur', endScrub);

        var resizeTimer = null;
        var onResize = function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(render, 80);
        };
        if (window.ResizeObserver) new ResizeObserver(onResize).observe(wrap);
        else window.addEventListener('resize', onResize);

        render();
        paintReal();
        paintStartYear();
        headline.set(isPension ? model.pension().presentValue : model.growth().finalBalance, true);

        if (!reduceMotion) {
            var start = null;
            var sweep = function (ts) {
                if (start === null) start = ts;
                var t = Math.min((ts - start) / 500, 1);
                reveal = 1 - Math.pow(1 - t, 3);
                render();
                if (t < 1) requestAnimationFrame(sweep);
            };
            requestAnimationFrame(sweep);
        }

        /* Mobile "Calculate" button: scrolls the results into view. The
           projection is already live, so there's nothing to compute — this
           just delivers the payoff the button implies on a stacked layout. */
        var jumpBtn = document.getElementById('calc-jump');
        if (jumpBtn) {
            jumpBtn.addEventListener('click', function () {
                var card = document.querySelector('.result-card');
                if (!card) return;
                // scrollIntoView ignores the fixed navbar, which would cover the
                // headline figure. Measure the bar and scroll manually so the
                // card clears it, with a little breathing room.
                var nav = document.querySelector('.navbar');
                var offset = (nav ? nav.getBoundingClientRect().height : 0) + 12;
                var top = card.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({
                    top: Math.max(top, 0),
                    behavior: reduceMotion ? 'auto' : 'smooth'
                });
                if (typeof gtag === 'function') {
                    gtag('event', 'calculator_calculate', { calculator: mode, app: 'wealthtrunk' });
                }
            });
        }

        /* Report engagement so tool traffic can be tied to installs. */
        var engaged = false;
        root.addEventListener('input', function () {
            if (engaged || typeof gtag !== 'function') return;
            engaged = true;
            gtag('event', 'calculator_engage', { calculator: mode, app: 'wealthtrunk' });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
