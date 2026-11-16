---
title: Homes and moves
description: Buy a home, sell one, move, change an account, or pay off a debt early in a scenario.
sidebar:
  order: 6
---
A scenario can change your accounts on a date: a home and its mortgage appear, or an asset or debt goes away. This works best in a [Linked](/help/scenarios/linked-vs-manual/) scenario, where the home and mortgage are counted in your net worth.

## Buy, sell, or move

On the **Assets** chip, tap **+** and choose:

- **Buy a Home**
- **Sell a Home**, available once you have a Real Estate account or a home the scenario buys
- **Move**: sell one home and buy another on the same date

### Buy a Home

| Field | What it does |
| --- | --- |
| **When** | The month and year of the purchase |
| **Price Today** | What the home costs in today's money |
| **Price Growth** | How fast the price grows. It applies before you buy, so a home bought in five years costs what prices have grown to. |
| **Down Payment** | The share of the price paid in cash. 100% means no mortgage. |
| **Closing Costs** | Fees as a share of the price |
| **Mortgage Rate (APR)** and **Term (years)** | The new mortgage. Its payment comes from the term. |

### Sell a Home

| Field | What it does |
| --- | --- |
| **Home to Sell** | One of your Real Estate accounts, or a home this scenario buys |
| **Selling Costs** | Fees as a share of the sale value |
| **Mortgage to Pay Off** | Pick one of your mortgages. A home the scenario bought pays off its own mortgage. |
| **Estimated Equity** | Read-only: roughly what's left in cash after costs and the mortgage, at today's values |

### Move

**Move** combines both. Fill in the sale, then the new home and mortgage, with one date for everything.

## How it's counted

In **Linked**:

- The price, down payment, and closing costs come out of your **liquid assets**, spread across them. The home is added to your net worth and grows at **Price Growth**.
- The mortgage is added, and its payments come out of your cash each month. Those payments stay level rather than rising with inflation.
- A sale adds its value, less selling costs, to your cash and pays off the mortgage. A sale can fund the next purchase.
- Buying or selling changes your net worth only by the costs. Trading cash for a home isn't a loss.
- If cash can't cover a purchase on its date, an alert tells you.

In **Manual**, your net worth is one balance, so a home's growth isn't tracked. A home you buy or sell only adds its costs and mortgage payments.

## Compare against a baseline

A home change can look like it costs far more than the price difference. That's usually expected, so always compare it to the same plan without the move:

1. **Duplicate** your scenario before adding the move.
2. Add the **Buy a Home**, **Sell a Home**, or **Move** to one copy.
3. Compare their ending values and open **Year Details** for the move's month to see what changed.

Why the gap can be large, especially when upgrading:

- **Cash leaves your investments.** The down payment, closing costs, and selling costs come out of your liquid accounts, minus what the sale brings in.
- **Mortgage payments come out of cash every month.** A bigger mortgage means less going into savings for 30 years. If you're selling a home with a mortgage, the payment you were making stops, and it's added back as income until that mortgage would have been paid off. The new payment is usually higher.
- **Compounding.** Money taken out of investments stops growing at their **Expected Return**. A home usually grows more slowly, so with a 10% return and 4.5% price growth, each dollar moved into a home gives up the difference for decades.

So a result like **$6.2M** without the move and **$600K** with it can be correct math. It's a statement about your assumptions. To test it:

- Try a lower **Expected Return** or **Return During Drawdown**, and a different **Price Growth**, to see how much of the gap closes.
- Check the **Alerts** card. If **Liquid assets run out**, the move leaves too little in savings.
- Add the ongoing costs of the new home, below.
- Compare with a smaller price, a larger **Down Payment**, or a later date.

:::note
Home equity counts in net worth but can't be spent like savings. If your net worth looks healthy but **Liquid Assets** run out, you've converted spendable money into a house.
:::

## Don't forget the other costs

A home changes more than the price and mortgage. A purchase, sale, or move also shifts everyday expenses that the scenario doesn't know about, so add or change them on the **Spending** and **Income** chips. Set them to start (or end) **On a Date…** matching the move. If you later change the move's date, update these too.

| If you're... | Remember to... |
| --- | --- |
| **Buying your first home** | End your **Rent** (**Housing**) spending. Add property tax, homeowners insurance, **maintenance** (1% of the price a year is a common rule of thumb), utilities, and HOA fees. |
| **Upgrading to a bigger home** | Raise property tax, insurance, utilities, and maintenance. Add furnishing and moving costs as a one-time **Large Purchase**. |
| **Downsizing** | Lower those same costs. Moving costs still apply, and so can a smaller mortgage or none at all. |
| **Selling and renting** | Start **Rent** (**Housing**) spending the month you sell. Maintenance, taxes, and insurance on the old home end. |
| **Moving somewhere new** | Change **Housing**, **Health Care**, transportation, and other costs of living. Add **Rental Income** if you keep the old home as a rental. |

A mortgage payment from a home the scenario buys is already included. Don't enter it again as spending.

## Edit later

Rows show the date, like **Buying 2030**. Tap one to edit it. A move holds its date once, so changing **When** moves everything in it: the purchase, the mortgage, the sale, and any spending you linked to it. Deleting a move with **Delete All** removes what it added, and a real home it sold goes back to how it was.

## Change an account in a scenario

Tap any account on the **Assets** or **Liabilities** card in a Linked scenario. Changes apply to this scenario only, and your real account isn't touched. **Match Account Settings** undoes them.

- **Assets:** **Expected Return**, **Monthly Contribution**, and the contribution's **Annual Change**. Contributions stop at retirement.
- **Debts:** **Loan Rate (APR)** and **Monthly Payment**. A rate set here applies from today, so it models a refinance.
- **Sell in This Scenario** (assets) or **Pay Off Early** (debts): choose **When**. The value, less **Selling Costs**, goes to your cash, or what you owe comes out of your cash.
- The switch (or **eye**) leaves the account out of this scenario.

## Recipes

### Buy a home

Linked. **Assets → + → Buy a Home**. Enter the price, down payment, and mortgage terms, and pick the date. End any rent on the same date, and add the ongoing costs of owning. See [Don't forget the other costs](#dont-forget-the-other-costs).

### Downsize or sell your home

Linked. **Sell a Home**, then pick the home and mortgage. If you'll buy something smaller, use **Move** instead. The cash left over stays in your savings. If you'll rent afterward, add **Rent** as **Housing** spending from the sale date, and remove the old home's upkeep.

### Move to a new home

Linked. **Move**. For a different cost of living, also add or change **Housing**, **Health Care**, and other spending to start on the same date, plus any change in property tax, insurance, and maintenance.

### Buy a rental

Linked. **Buy a Home** for the property, then add **Rental Income** starting on the same date. Add its costs as spending.

### Rent forever vs. buy

Make two scenarios. In one, add **Housing** spending for your rent. In a duplicate, add **Buy a Home** instead and leave out the rent. Compare their ending values.

### Pay off a mortgage early

Linked. Tap the mortgage on **Liabilities → Pay Off Early** and pick **When**. Your cash covers the balance, and the scenario's alerts warn if it can't.

### Refinance

Linked. Tap the mortgage and set a new **Loan Rate (APR)** and **Monthly Payment**. Add the fees as a one-time **Large Purchase**.

### Pay it down faster

Linked. Tap the debt and raise **Monthly Payment**. You can time spending to the date it's paid off with **Debt Paid Off**.
