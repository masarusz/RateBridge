# RateBridge 💱

A tiny JPY ⇄ USD currency converter for any date.
Pick a date, type an amount, and see the exchange — no sign-up, no server, no build step.

🌐 **Live:** https://masarusz.github.io/RateBridge

---

## Features

- **Date-based rates** — pick any date (default: today) and see the historical exchange rate for that day
- **Live recalculation** — the result updates as you change the date or the amount
- **One-click swap** — flip JPY ⇄ USD with a single button; the entered amount is kept and re-converted
- **Honest dates** — the European Central Bank publishes no rates on weekends/holidays, so RateBridge shows the *actual* date a rate is from when it differs from the one you picked
- **Responsive** — works on desktop and smartphone
- **No dependencies** — pure HTML / CSS / JavaScript, no API key, no tracking
- **Light & dark** — follows your system colour scheme

---

## Usage

1. Visit **https://masarusz.github.io/RateBridge** (or open `index.html` locally)
2. The date defaults to today; change it to see a historical rate
3. Type an amount in the left box (default: 1 JPY)
4. Read the converted value on the right
5. Press **⇅** to swap the two currencies

---

## Technical notes

- Exchange rates from the [Frankfurter API](https://frankfurter.dev) (European Central Bank reference rates), available back to 1999
- Rates are CORS-enabled and require no API key, so the whole app runs client-side
- The ECB publishes one rate per business day; requests for weekends, holidays, or a date before today's publication fall back to the most recent prior business day (shown in the status line)
- Rates are cached in memory per `date+currency` to avoid redundant requests within a session
- Out-of-order network responses are guarded with a request sequence counter

---

## Development

```bash
# No install needed — just open the file
open index.html
```

Files:
```
index.html   # App shell
style.css    # All styles (CSS variables, responsive, light/dark)
script.js    # App logic (fetch, convert, swap)
```

---

## Change Log

### v1.0.1 — 2026-06-28
- Fix: date value now left-aligned on iOS Safari (was centered) via `::-webkit-date-and-time-value`
- Fix: future dates are now clamped to today in JS — the native mobile date picker didn't always enforce the `max` attribute

### v1.0.0 — 2026-06-28
- Initial release
- Date-based JPY ⇄ USD conversion via Frankfurter / ECB
- Live recalculation on date and amount changes
- One-click currency swap (keeps the entered amount)
- Effective-date display for non-business-day requests
- Responsive layout with light/dark support
