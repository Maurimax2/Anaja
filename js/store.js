/* ==========================================================================
   store.js — تحميل بيانات الكتالوج وأدوات مشتركة
   ========================================================================== */

import { CONFIG, T } from './config.js';

let _cache = null;

/** يحمّل المنتجات والأقسام مرّة واحدة ويحتفظ بها. */
export async function loadCatalogue() {
  if (_cache) return _cache;
  const [products, categories] = await Promise.all([
    fetch(CONFIG.PRODUCTS_URL).then(r => {
      if (!r.ok) throw new Error(`تعذّر تحميل المنتجات (${r.status})`);
      return r.json();
    }),
    fetch(CONFIG.CATEGORIES_URL).then(r => {
      if (!r.ok) throw new Error(`تعذّر تحميل الأقسام (${r.status})`);
      return r.json();
    }),
  ]);
  _cache = { products, categories };
  return _cache;
}

export function categoryName(categories, slug) {
  const c = categories.find(x => x.slug === slug);
  return c ? c.name_ar : slug;
}

/** الأقسام المعروضة فقط — يتجاهل ما عليه hidden: true */
export function visibleCategories(categories) {
  return categories.filter(c => !c.hidden);
}

/* ── الصور ────────────────────────────────────────────────────────────────
   الأسماء في products.json بدون امتداد. الملفات الفعلية تُنتَج بالأمر:
     python3 scripts/prepare-images.py                                     */
export function imgFull(name) {
  return `${CONFIG.IMAGE_DIR}/${name}.webp`;
}
export function imgThumb(name) {
  return `${CONFIG.IMAGE_DIR}/${name}-thumb.webp`;
}

/* ── الأسعار ──────────────────────────────────────────────────────────────
   price: null يعني «السعر عند الطلب» — يُعرَض نصًّا ولا يدخل في أي مجموع. */
export function hasPrice(product) {
  return typeof product.price === 'number' && product.price > 0;
}

const NUM = new Intl.NumberFormat('ar-MR', { maximumFractionDigits: 0 });

/** يصوغ رقمًا بالفواصل العربية، مثل ١٢٬٥٠٠ */
export function formatNumber(n) {
  return NUM.format(n);
}

/** نصّ السعر الجاهز للعرض. */
export function formatPrice(product) {
  return hasPrice(product)
    ? `${formatNumber(product.price)} ${CONFIG.CURRENCY_AR}`
    : T.priceOnRequest;
}

/** نفس الشيء لكن لرسالة الواتساب — أرقام لاتينية أوضح في الرسائل. */
export function priceForMessage(product) {
  return hasPrice(product)
    ? `${product.price.toLocaleString('en-US')} ${CONFIG.CURRENCY}`
    : T.priceOnRequest;
}

export function findProduct(products, id) {
  return products.find(p => p.id === id) || null;
}

/** منتجات من نفس القسم، باستثناء المنتج الحالي. */
export function relatedProducts(products, product, limit = 4) {
  return products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, limit);
}

/** قراءة معامل من رابط الصفحة، مثل product.html?id=l-01 */
export function param(name) {
  return new URLSearchParams(location.search).get(name);
}

/** يمنع حقن HTML عند إدراج نصوص قادمة من ملفات البيانات أو من نموذج. */
export function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, ch => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));
}
