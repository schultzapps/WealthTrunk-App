---
title: Import accounts from CSV
description: Bulk-create accounts or backfill balance history from a spreadsheet.
sidebar:
  order: 2
---

If you're starting with a lot of accounts or years of history, a CSV import is faster than typing everything in. There are two templates:

| Template | Use it to |
| --- | --- |
| [Accounts template](https://wealthtrunk.app/downloads/wealthtrunk-accounts-template.csv) | Create accounts in bulk: name, institution, type, balance, contributions, and rates. If you're starting from scratch, this is the only one you need. |
| [Balance history template](https://wealthtrunk.app/downloads/wealthtrunk-balances-template.csv) | Backfill past balances for accounts that **already exist**, so your charts show years of history. |

You can also download the templates inside the app from the **Import Data (CSV)** screen.

:::caution[Balance history needs account IDs]
Every row in the balance history file needs an account ID, and only an export from the app gives you those. Export your accounts first from **Settings → Import/Export Data → Export Data (CSV)**, then fill in the template.
:::

## How to import

1. **Fill in the template.** Open it in Excel, Numbers, or Google Sheets. Keep the header row exactly as it is, add one row per account, and save as CSV. Lines starting with `#` at the top are ignored on import, so you can leave them.
2. **Get the file onto your device.** Use iCloud Drive, AirDrop, or email it to yourself. Anywhere the Files app can reach works.
3. **Import it.** Go to **Settings → Import/Export Data → Import Data (CSV)**, choose **Accounts** or **Balances**, tap **Import**, and select your file.
4. **Review before confirming.** Imported accounts wait under **Import Pending** until you assign their owners. Nothing is added to your net worth until you do.

:::tip[Skip the spreadsheet]
The free [Net Worth Calculator](https://wealthtrunk.app/net-worth-calculator.html) builds an accounts import file for you from a few simple fields.
:::
