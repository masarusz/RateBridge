"use strict";

/* ------------------------------------------------------------------ *
 * RateBridge — JPY ⇄ USD exchange converter
 * Data: Frankfurter API (https://frankfurter.dev), ECB reference rates.
 * No build step, no dependencies, no API key.
 * ------------------------------------------------------------------ */

const API_BASE = "https://api.frankfurter.dev/v1";

// DOM
const els = {
  date: document.getElementById("dateInput"),
  leftCurrency: document.getElementById("leftCurrency"),
  leftAmount: document.getElementById("leftAmount"),
  rightCurrency: document.getElementById("rightCurrency"),
  rightAmount: document.getElementById("rightAmount"),
  swap: document.getElementById("swapBtn"),
  status: document.getElementById("status"),
};

// State
const state = {
  date: todayISO(),
  base: "USD",   // left / editable currency
  quote: "JPY",  // right / result currency
};

// In-memory cache of rates, keyed by `${date}|${base}|${quote}`.
const rateCache = new Map();

/* ----------------------------- helpers ---------------------------- */

function todayISO() {
  // Local-date ISO (YYYY-MM-DD), not UTC, so "today" matches the user.
  const d = new Date();
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d - off).toISOString().slice(0, 10);
}

function parseAmount(raw) {
  const n = parseFloat(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

// Format a converted amount: thousands separators, sensible precision.
function formatAmount(value) {
  if (!Number.isFinite(value)) return "—";
  let maxFrac;
  if (value === 0) maxFrac = 2;
  else if (value >= 1) maxFrac = 2;
  else if (value >= 0.01) maxFrac = 4;
  else maxFrac = 6; // small per-unit rates like 1 JPY ≈ 0.0068 USD
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: maxFrac,
  });
}

// Shrink the result's font-size so long numbers stay on a single line,
// down to a readable minimum; resets to the CSS base for short values.
function fitResult() {
  const el = els.rightAmount;
  el.style.fontSize = ""; // back to CSS base before measuring
  const base = parseFloat(getComputedStyle(el).fontSize);
  const min = 14;
  let size = base;
  while (el.scrollWidth > el.clientWidth && size > min) {
    size -= 1;
    el.style.fontSize = size + "px";
  }
}

function setStatus(text, kind = "") {
  els.status.textContent = text;
  els.status.className = "status" + (kind ? ` status--${kind}` : "");
}

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/* ------------------------------ data ------------------------------ */

// Returns { rate, date } where date is the ACTUAL date the rate is from
// (ECB skips weekends/holidays, so it may differ from the requested date).
async function fetchRate(date, base, quote) {
  const key = `${date}|${base}|${quote}`;
  if (rateCache.has(key)) return rateCache.get(key);

  const url = `${API_BASE}/${date}?base=${base}&symbols=${quote}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const rate = data && data.rates ? data.rates[quote] : undefined;
  if (typeof rate !== "number") throw new Error("No rate in response");

  const result = { rate, date: data.date || date };
  rateCache.set(key, result);
  return result;
}

/* --------------------------- conversion --------------------------- */

let requestSeq = 0; // guards against out-of-order async responses

async function convert() {
  const amount = parseAmount(els.leftAmount.value);
  if (amount === null) {
    els.rightAmount.textContent = "—";
    setStatus("Enter a valid amount.", "error");
    return;
  }

  const seq = ++requestSeq;
  setStatus("Fetching rate…", "loading");

  try {
    const { rate, date } = await fetchRate(state.date, state.base, state.quote);
    if (seq !== requestSeq) return; // a newer request superseded this one

    const converted = amount * rate;
    els.rightAmount.textContent = formatAmount(converted);
    fitResult();

    const asOf = date !== state.date ? ` (rate as of ${date})` : "";
    setStatus(`1 ${state.base} = ${formatAmount(rate)} ${state.quote}${asOf}`);
  } catch (err) {
    if (seq !== requestSeq) return;
    els.rightAmount.textContent = "—";
    setStatus("Couldn't load the exchange rate. Check your connection and try again.", "error");
    console.error("RateBridge fetch failed:", err);
  }
}

/* ---------------------------- handlers ---------------------------- */

// Render currency labels with a per-currency colour class (USD green, JPY red),
// so the colour follows the currency regardless of which side it's on.
function renderCurrencies() {
  els.leftCurrency.textContent = state.base;
  els.rightCurrency.textContent = state.quote;
  els.leftCurrency.className = "money__currency money__currency--" + state.base.toLowerCase();
  els.rightCurrency.className = "money__currency money__currency--" + state.quote.toLowerCase();
}

function swap() {
  // Switch currencies; keep the left amount value as-is (per design).
  [state.base, state.quote] = [state.quote, state.base];
  renderCurrencies();
  convert();
}

function init() {
  els.date.value = state.date;
  els.date.max = todayISO(); // no future rates available
  renderCurrencies();

  els.date.addEventListener("change", () => {
    // Guard against future dates: the native picker doesn't always enforce `max`.
    const max = todayISO();
    let value = els.date.value || max;
    if (value > max) {
      value = max;
      els.date.value = max;
    }
    state.date = value;
    convert();
  });

  els.leftAmount.addEventListener("input", debounce(convert, 300));
  els.swap.addEventListener("click", swap);
  window.addEventListener("resize", debounce(fitResult, 150));

  convert();
}

init();
