/* ==========================================================================
   cart.js — السلة، محفوظة في localStorage
   الشكل المخزّن: [{ id, qty }]  — البيانات الأخرى تُقرأ من products.json
   حتى لا تتقادم الأسعار داخل سلّة قديمة.
   ========================================================================== */

import { CONFIG } from './config.js';
import { hasPrice } from './store.js';

const listeners = new Set();

function read() {
  try {
    const raw = localStorage.getItem(CONFIG.CART_KEY);
    const data = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(data)) return [];
    return data.filter(l => l && typeof l.id === 'string' && l.qty > 0)
               .map(l => ({ id: l.id, qty: Math.min(99, Math.floor(l.qty)) }));
  } catch {
    // تخزين معطوب أو ممتلئ — نبدأ من سلّة فارغة بدل تعطيل الصفحة
    return [];
  }
}

function write(lines) {
  try {
    localStorage.setItem(CONFIG.CART_KEY, JSON.stringify(lines));
  } catch {
    /* التخزين ممتلئ أو محظور (تصفّح خاص) — السلّة تبقى في الذاكرة فقط */
  }
  listeners.forEach(fn => fn(lines));
}

/** يُستدعى عند كل تغيير — يُستعمل لتحديث شارة السلّة في الترويسة. */
export function onChange(fn) {
  listeners.add(fn);
  fn(read());
  return () => listeners.delete(fn);
}

export function getLines() {
  return read();
}

/** مجموع القطع، وهو الرقم الظاهر في شارة الترويسة. */
export function count() {
  return read().reduce((n, l) => n + l.qty, 0);
}

export function add(id, qty = 1) {
  const lines = read();
  const line = lines.find(l => l.id === id);
  if (line) line.qty = Math.min(99, line.qty + qty);
  else lines.push({ id, qty: Math.min(99, qty) });
  write(lines);
}

export function setQty(id, qty) {
  let lines = read();
  if (qty <= 0) lines = lines.filter(l => l.id !== id);
  else {
    const line = lines.find(l => l.id === id);
    if (line) line.qty = Math.min(99, Math.floor(qty));
  }
  write(lines);
}

export function remove(id) {
  write(read().filter(l => l.id !== id));
}

export function clear() {
  write([]);
}

/* ── الربط مع الكتالوج ───────────────────────────────────────────────────── */

/**
 * يحوّل السلّة المخزّنة إلى أسطر كاملة.
 * السطور التي لم يعد لها منتج في products.json تُهمَل بهدوء —
 * يحدث هذا إذا حذف صاحب المحل منتجًا وفي سلّة زائرٍ نسخة قديمة منه.
 */
export function detailedLines(products) {
  return read()
    .map(l => {
      const product = products.find(p => p.id === l.id);
      return product ? { ...l, product } : null;
    })
    .filter(Boolean);
}

/**
 * المجموع. المنتجات بلا سعر لا تدخل فيه، وتُحصى على حدة
 * حتى تستطيع الصفحة أن تقول إن المجموع غير نهائي.
 */
export function totals(products) {
  const lines = detailedLines(products);
  let sum = 0;
  let unpriced = 0;
  for (const l of lines) {
    if (hasPrice(l.product)) sum += l.product.price * l.qty;
    else unpriced += 1;
  }
  return { sum, unpriced, lines, itemCount: lines.reduce((n, l) => n + l.qty, 0) };
}
