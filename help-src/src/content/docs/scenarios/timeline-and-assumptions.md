---
title: Timeline and assumptions
description: Retirement ages, life expectancy, inflation, returns, and tax in a scenario.
sidebar:
  order: 3
---
## Timeline

Tap the **umbrella** button at the top of a scenario.

- **Retirement Age:** when each person stops saving and starts spending down. For a dependent this is their **Drawdown Age**.
- **Life Expectancy:** the age the plan runs to. For a dependent this is **Plan Ends at Age**.

The chart updates as you change them.

Setting a retirement age to **Retired** means that person has already stopped working. Once everyone in the scenario is retired, the projection runs 40 years and account contributions keep applying.

On a [primary scenario](/help/scenarios/#primary-scenario), retirement ages are also saved to each profile. Other scenarios keep their own ages and leave your profiles alone. Life expectancy always stays in the scenario and is never written to a profile.

## Edit settings

Tap **Edit** to change the assumptions behind the projection.

| Setting | What it does |
| --- | --- |
| **Scenario Name** and note | Name the scenario. The note shows only here. |
| **Projection Type** | [Linked or Manual](/help/scenarios/linked-vs-manual/) |
| **Inflation Rate** | How fast prices rise in this scenario |
| **Expected Return** | **Manual only.** The one return your whole net worth grows at. Starts at your accounts' average by balance. |
| **Return During Drawdown** | What your money earns once retired |
| **Tax on Withdrawals** | The average tax rate on money you spend from savings |

When a value differs from its default, a reset button appears to put it back.

### Inflation

A new scenario follows the app's inflation rate (**Settings → Charts & Lists → Inflation Settings**), or 3% if **Show in Today's Money** is off. Moving the slider gives this scenario its own rate, whatever the app setting says.

At 0%, prices stay flat while your accounts still grow at their regular returns. That can flatter the result, so a tip appears when a scenario's inflation is 0%.

Income and spending grow with inflation by default. See [Annual change](/help/scenarios/income-and-spending/#annual-change).

:::caution
Don't lower **Expected Return** to account for inflation. Inflation is already applied separately, so it would be counted twice.
:::

### Return During Drawdown

Many people shift to safer investments in retirement, so their return drops. In Linked, this replaces every account's return once saving ends. In Manual, it's the return for your whole net worth in retirement. Leave it alone to keep your usual returns.

### Tax on Withdrawals

Spending in retirement comes out of savings, and some of each withdrawal goes to tax. Set your average rate, up to 50%, and the projection withdraws extra to cover it. Buying or selling a home isn't taxed this way, since those swap one asset for cash.

This is a single average rate, not a tax model. Pick a rate that blends your account types: higher when most savings are in traditional retirement accounts, lower when they're in Roth or taxable accounts. See [tax statuses](/help/accounts/tax-types/).

## Leave things out

Each account on the **Assets** and **Liabilities** cards has a switch, and each income or spending has an **eye** in its editor. Tap a symbol or the eye to leave an item out of the scenario without deleting it. It turns gray, and tapping again brings it back.

## Alerts

Whenever something looks off, an **Alerts** card appears above the chart. See [Reading your results](/help/scenarios/reading-results/#alerts).
