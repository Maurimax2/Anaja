/* ==========================================================================
   ui.js — عناصر مشتركة بين كل الصفحات
   ========================================================================== */

import { CONFIG } from './config.js';
import * as cart from './cart.js';
import { imgFull, imgThumb, formatPrice, hasPrice, isCatalogueMode, esc } from './store.js';

/* ── شارة السلّة ─────────────────────────────────────────────────────────── */
function bindCartBadge() {
  const badges = document.querySelectorAll('[data-cart-count]');
  if (!badges.length) return;
  cart.onChange(() => {
    const n = cart.count();
    badges.forEach(b => {
      b.textContent = n > 99 ? '99+' : String(n);
      b.hidden = n === 0;
      b.setAttribute('aria-label', `السلّة تحتوي ${n} قطعة`);
    });
  });
}

/* ── قائمة الجوّال ───────────────────────────────────────────────────────── */
function bindMobileNav() {
  const btn = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-nav]');
  if (!btn || !nav) return;

  const setOpen = open => {
    nav.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'إغلاق القائمة' : 'فتح القائمة');
  };
  btn.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  nav.addEventListener('click', e => {
    if (e.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') setOpen(false);
  });
}

/* ── الظهور التدريجي عند التمرير ───────────────────────────────────────────
   مراقب واحد للصفحة كلّها. تُستدعى revealNew() بعد كل إضافة محتوى
   بالجافاسكربت لتسجيل العناصر الجديدة — بدون إعادة ربط بقيّة الصفحة.   */
let _io = null;

export function revealNew(root = document) {
  const items = root.querySelectorAll('[data-reveal]:not(.is-visible)');
  if (!items.length) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('is-visible'));
    return;
  }
  if (!_io) {
    _io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        _io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  }
  items.forEach(el => _io.observe(el));

  // شبكة أمان: لو لم يعمل المراقب لأي سبب، يظهر كل شيء بعد ثانيتين
  // بدل أن يبقى المحتوى مخفيًا.
  setTimeout(() => {
    items.forEach(el => el.classList.add('is-visible'));
  }, 2000);
}

/* ── الترويسة اللاصقة ────────────────────────────────────────────────────── */
function bindStickyHeader() {
  const header = document.querySelector('[data-header]');
  if (!header) return;
  const onScroll = () => header.classList.toggle('is-stuck', window.scrollY > 24);
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });
}

/* ── التنبيهات القصيرة ───────────────────────────────────────────────────── */
let toastTimer;
export function toast(message, kind = 'ok') {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.dataset.kind = kind;
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-visible'), 2600);
}

/* ── بطاقة منتج ──────────────────────────────────────────────────────────
   تتعامل مع الحالتين: صورة مقصوصة بخلفية شفافة، أو صورة معرض داخل إطار.
   كلتاهما تجلس على مربّع رملي، فتبدوان متناسقتين في الشبكة نفسها.      */
export function productCard(product, { eager = false } = {}) {
  const img = product.images[0];
  const priced = hasPrice(product);

  // في وضع الكتالوج تُحذف سطور السعر من البطاقات: تكرار «السعر عند الطلب»
  // عشرين مرّة في شبكة واحدة ضجيج بلا فائدة.
  const priceLine = isCatalogueMode() ? '' : `
          <span class="card__price${priced ? '' : ' card__price--request'}">
            ${esc(formatPrice(product))}
          </span>`;

  return `
    <article class="card" data-reveal>
      <a class="card__link" href="product.html?id=${encodeURIComponent(product.id)}">
        <span class="card__media">
          <img src="${imgThumb(img)}"
               srcset="${imgThumb(img)} 400w, ${imgFull(img)} 1400w"
               sizes="(max-width: 620px) 46vw, (max-width: 980px) 30vw, 300px"
               alt="${esc(product.name_ar)}"
               width="400" height="400"
               loading="${eager ? 'eager' : 'lazy'}" decoding="async">
        </span>
        <span class="card__body">
          <h3 class="card__title">${esc(product.name_ar)}</h3>${priceLine}
        </span>
      </a>
    </article>`;
}

/* ── زرّ الواتساب العائم ─────────────────────────────────────────────────── */
function bindWhatsAppFab() {
  const fab = document.querySelector('[data-wa-fab]');
  if (!fab) return;
  const text = encodeURIComponent(
    `السلام عليكم، عندي استفسار عن منتجات ${CONFIG.BRAND_SHORT_AR}.`
  );
  fab.href = `https://wa.me/${CONFIG.WHATSAPP}?text=${text}`;
}

/* ── بيانات المحل في التذييل ─────────────────────────────────────────────── */
function fillBrandData() {
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
  document.querySelectorAll('[data-brand]').forEach(el => {
    el.textContent = CONFIG.BRAND_AR;
  });
  document.querySelectorAll('[data-phone]').forEach(el => {
    el.textContent = CONFIG.PHONE_DISPLAY;
  });
  document.querySelectorAll('[data-hours]').forEach(el => {
    el.textContent = CONFIG.HOURS_AR;
  });
  document.querySelectorAll('[data-wa-link]').forEach(el => {
    el.href = `https://wa.me/${CONFIG.WHATSAPP}`;
  });
}

/** يُستدعى مرّة واحدة في كل صفحة. */
let _inited = false;
export function initChrome() {
  if (_inited) return;
  _inited = true;
  bindCartBadge();
  bindMobileNav();
  bindStickyHeader();
  bindWhatsAppFab();
  fillBrandData();
  revealNew();
}

/** رسالة خطأ موحّدة عند فشل تحميل البيانات. */
export function showError(container, err) {
  console.error(err);
  container.innerHTML = `
    <p class="notice notice--error">
      تعذّر تحميل البيانات. تأكّد من فتح الموقع عبر خادم وليس بالنقر المباشر
      على الملف، ثم أعد المحاولة.
    </p>`;
}
