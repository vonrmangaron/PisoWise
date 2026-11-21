# PisoWise

A simple budget app anyone can use: your salary, your local costs and the costs you pay back home, and how much you can save each month.

**Open it:** https://vonrmangaron.github.io/PisoWise/

- Sign in with email and password and see the same budget on your phone, tablet and computer.
- Set your pay (weekly, fortnightly, monthly or custom) and change any month's pay or add a bonus.
- Two lists: costs back home (Philippines by default — any country works), shown in that currency first, and local costs. Tick costs as paid.
- **Money sent**: record what you sent home and tick every cost in that list for the month in one go.
- **Overview**: a chart of where your pay goes, then split the leftover into savings and spare, and confirm once you've moved it.
- The exchange rate is checked automatically ([Exchange Rate API](https://www.exchangerate-api.com)), optionally minus your transfer service's margin, or set your own.
- History keeps each month's income, costs, money sent and savings.
- Works offline and can be added to your home screen.

Accounts use [Supabase](https://supabase.com) — see `supabase.sql` for the table and its privacy rules.

Plain HTML, CSS and JavaScript — no build step. Bump `CACHE` in `sw.js` on every release.
