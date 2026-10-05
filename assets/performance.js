(() => {
  'use strict';

  const isPublicPage = !location.pathname.startsWith('/admin/');
  if (!isPublicPage) return;

  const eagerSelector = '.logo img, .hero img, [data-eager], [fetchpriority="high"]';

  function tuneImage(img) {
    if (!(img instanceof HTMLImageElement)) return;
    if (!img.hasAttribute('decoding')) img.decoding = 'async';

    if (img.matches(eagerSelector)) {
      if (!img.hasAttribute('loading')) img.loading = 'eager';
      if (!img.hasAttribute('fetchpriority')) img.setAttribute('fetchpriority', 'high');
      return;
    }

    // Product/catalog/gallery images are generally below the fold. Native
    // lazy-loading avoids downloading the full catalogue on first paint.
    if (!img.hasAttribute('loading')) img.loading = 'lazy';
    if (!img.hasAttribute('fetchpriority')) img.setAttribute('fetchpriority', 'low');
  }

  function tuneTree(root) {
    if (!root) return;
    if (root instanceof HTMLImageElement) tuneImage(root);
    if (root.querySelectorAll) root.querySelectorAll('img').forEach(tuneImage);
    if (root.querySelectorAll) {
      root.querySelectorAll('iframe:not([loading])').forEach((frame) => {
        frame.loading = 'lazy';
      });
    }
  }

  function runInitialPass() {
    tuneTree(document);

    // Dynamic catalogue/product cards are inserted after fetch(). Watch only
    // during the initial render window to keep observer overhead negligible.
    if (!('MutationObserver' in window)) return;
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node && node.nodeType === 1) tuneTree(node);
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 15000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runInitialPass, { once: true });
  } else {
    runInitialPass();
  }

  // Preconnect analytics endpoints during idle time so they do not compete
  // with critical product assets during first paint.
  const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1200));
  idle(() => {
    const hosts = ['https://www.googletagmanager.com', 'https://connect.facebook.net'];
    for (const href of hosts) {
      if (document.head.querySelector(`link[rel="preconnect"][href="${href}"]`)) continue;
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = href;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
  });
})();
