/* =============================================================================
   GreenChemX — site behaviour
   No dependencies. Every animation is opt-out via prefers-reduced-motion.
   ============================================================================= */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------------------------------------------------------------------------
     Theme
     The initial theme is applied by a blocking snippet in <head> to avoid a
     flash; this only wires up the toggle and keeps the label truthful.
     ------------------------------------------------------------------------- */
  function initTheme() {
    var toggles = document.querySelectorAll('[data-theme-toggle]');
    if (!toggles.length) return;

    function sync() {
      var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      toggles.forEach(function (btn) {
        btn.setAttribute('aria-pressed', String(isDark));
        btn.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
      });
    }

    toggles.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        try {
          localStorage.setItem('gcx-theme', next);
        } catch (e) {
          /* Private mode — the choice just won't persist. */
        }
        sync();
      });
    });

    sync();
  }

  /* ---------------------------------------------------------------------------
     Sticky header shadow
     ------------------------------------------------------------------------- */
  function initHeader() {
    var header = document.querySelector('.site-header');
    if (!header) return;

    var ticking = false;
    function update() {
      header.classList.toggle('is-stuck', window.scrollY > 8);
      ticking = false;
    }
    window.addEventListener(
      'scroll',
      function () {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true }
    );
    update();
  }

  /* ---------------------------------------------------------------------------
     Mobile navigation
     ------------------------------------------------------------------------- */
  function initMobileNav() {
    var openBtn = document.querySelector('[data-nav-open]');
    var closeBtn = document.querySelector('[data-nav-close]');
    var drawer = document.getElementById('mobile-nav');
    if (!openBtn || !drawer) return;

    var lastFocused = null;

    function open() {
      lastFocused = document.activeElement;
      drawer.classList.add('is-open');
      document.body.classList.add('nav-open');
      openBtn.setAttribute('aria-expanded', 'true');
      drawer.removeAttribute('aria-hidden');
      drawer.inert = false;
      var first = drawer.querySelector('a, button');
      if (first) first.focus();
    }

    function close() {
      drawer.classList.remove('is-open');
      document.body.classList.remove('nav-open');
      openBtn.setAttribute('aria-expanded', 'false');
      drawer.setAttribute('aria-hidden', 'true');
      drawer.inert = true;
      if (lastFocused) lastFocused.focus();
    }

    drawer.inert = true;

    openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);

    drawer.addEventListener('click', function (e) {
      if (e.target.closest('a')) close();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) close();
    });

    // Leaving the mobile breakpoint with the drawer open would trap the page.
    window.matchMedia('(min-width: 64rem)').addEventListener('change', function (e) {
      if (e.matches && drawer.classList.contains('is-open')) close();
    });
  }

  /* ---------------------------------------------------------------------------
     Mega menu
     Click is the primary interaction; hover is an accelerator on fine pointers
     only. Escape, focus-out and outside-click all close. Disabled below the
     nav breakpoint, where the drawer carries the same content.
     ------------------------------------------------------------------------- */
  function initMegaMenu() {
    var header = document.querySelector('[data-nav-root]');
    if (!header) return;

    var triggers = Array.prototype.slice.call(header.querySelectorAll('[data-menu-trigger]'));
    if (!triggers.length) return;

    var desktop = window.matchMedia('(min-width: 64rem)');
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    var openKey = null;
    var hoverTimer = null;
    var closeTimer = null;

    function panelFor(key) {
      return header.querySelector('[data-menu-panel="' + key + '"]');
    }

    function triggerFor(key) {
      return header.querySelector('[data-menu-trigger="' + key + '"]');
    }

    function open(key) {
      // Below the breakpoint the panels are display:none and the drawer owns
      // this content — opening would only leave a lying aria-expanded behind.
      if (!desktop.matches) return;
      if (openKey === key) return;
      if (openKey) close(openKey);

      var panel = panelFor(key);
      var trigger = triggerFor(key);
      if (!panel || !trigger) return;

      panel.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      header.classList.add('is-menu-open');
      openKey = key;
    }

    function close(key) {
      var k = key || openKey;
      if (!k) return;
      var panel = panelFor(k);
      var trigger = triggerFor(k);
      if (panel) panel.hidden = true;
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
      if (openKey === k) openKey = null;
      if (!openKey) header.classList.remove('is-menu-open');
    }

    function closeAll() {
      triggers.forEach(function (t) {
        close(t.dataset.menuTrigger);
      });
    }

    function clearTimers() {
      clearTimeout(hoverTimer);
      clearTimeout(closeTimer);
    }

    triggers.forEach(function (trigger) {
      var key = trigger.dataset.menuTrigger;

      trigger.addEventListener('click', function () {
        clearTimers();
        if (openKey === key) close(key);
        else open(key);
      });

      trigger.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          open(key);
          var first = panelFor(key).querySelector('a');
          if (first) first.focus();
        }
      });

      if (finePointer.matches) {
        trigger.addEventListener('mouseenter', function () {
          if (!desktop.matches) return;
          clearTimers();
          // Small delay so sweeping the cursor across the bar doesn't flash panels.
          hoverTimer = setTimeout(function () {
            open(key);
          }, 90);
        });
      }
    });

    if (finePointer.matches) {
      header.addEventListener('mouseleave', function () {
        clearTimers();
        closeTimer = setTimeout(closeAll, 180);
      });
      header.addEventListener('mouseenter', function () {
        clearTimeout(closeTimer);
      });
    }

    // On document, not the header: a hover-opened panel leaves focus outside
    // the header, and a keydown there would never bubble to it.
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !openKey) return;
      var trigger = triggerFor(openKey);
      var focusWasInside = header.contains(document.activeElement);
      close(openKey);
      if (trigger && focusWasInside) trigger.focus();
    });

    // Tabbing out of the header closes whatever is open.
    header.addEventListener('focusout', function (e) {
      if (!openKey) return;
      if (e.relatedTarget && header.contains(e.relatedTarget)) return;
      closeAll();
    });

    document.addEventListener('pointerdown', function (e) {
      if (openKey && !header.contains(e.target)) closeAll();
    });

    desktop.addEventListener('change', function (e) {
      if (!e.matches) closeAll();
    });
  }

  /* ---------------------------------------------------------------------------
     Scroll reveal
     ------------------------------------------------------------------------- */
  function initReveal() {
    var items = document.querySelectorAll('[data-reveal]');
    if (!items.length) return;

    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
      items.forEach(function (el) {
        el.classList.add('is-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );

    items.forEach(function (el) {
      // Stagger within a group, not across the whole page.
      var group = el.closest('[data-reveal-group]');
      if (group) {
        var siblings = Array.prototype.slice.call(group.querySelectorAll('[data-reveal]'));
        el.style.setProperty('--reveal-delay', Math.min(siblings.indexOf(el), 7) * 90 + 'ms');
      }
      observer.observe(el);
    });

    // Safety net: if the observer never fired (background tab, prerender, an
    // embedded webview that isn't compositing), nothing above the fold would
    // ever become visible. Sweep once the page has settled.
    window.addEventListener('load', function () {
      setTimeout(function () {
        document.querySelectorAll('[data-reveal]:not(.is-visible)').forEach(function (el) {
          if (el.getBoundingClientRect().top < window.innerHeight * 1.2) {
            el.classList.add('is-visible');
          }
        });
      }, 900);
    });
  }

  /* ---------------------------------------------------------------------------
     Process timeline rules
     ------------------------------------------------------------------------- */
  function initProcess() {
    var steps = document.querySelectorAll('.process__step');
    if (!steps.length) return;

    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
      steps.forEach(function (s) {
        s.classList.add('is-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var delay = parseInt(el.dataset.stepDelay || '0', 10);
          setTimeout(function () {
            el.classList.add('is-visible');
          }, delay);
          observer.unobserve(el);
        });
      },
      { threshold: 0.3 }
    );

    steps.forEach(function (el, i) {
      el.dataset.stepDelay = String(i * 140);
      observer.observe(el);
    });
  }

  /* ---------------------------------------------------------------------------
     Metric counters
     ------------------------------------------------------------------------- */
  function initCounters() {
    var counters = document.querySelectorAll('[data-count-to]');
    if (!counters.length) return;

    function render(el, value) {
      var decimals = parseInt(el.dataset.countDecimals || '0', 10);
      el.textContent =
        (el.dataset.countPrefix || '') +
        value.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        }) +
        (el.dataset.countSuffix || '');
    }

    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
      counters.forEach(function (el) {
        render(el, parseFloat(el.dataset.countTo));
      });
      return;
    }

    // Deliberately not zeroed up front. If the observer never fires — hidden
    // tab, prerender, a webview that isn't compositing — the authored figure
    // stays on screen instead of a misleading "0+".
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          observer.unobserve(el);

          var target = parseFloat(el.dataset.countTo);
          var duration = 1400;
          var start = null;
          render(el, 0);

          function frame(ts) {
            if (start === null) start = ts;
            var p = Math.min((ts - start) / duration, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            render(el, target * eased);
            if (p < 1) requestAnimationFrame(frame);
          }
          requestAnimationFrame(frame);
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ---------------------------------------------------------------------------
     Hero lattice
     A perturbed crystal lattice. Nodes drift on independent sine paths and are
     pushed gently away from the pointer; bonds fade with separation, so the
     structure reads as a material relaxing rather than a particle toy.
     ------------------------------------------------------------------------- */
  function initHeroCanvas() {
    var canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    var ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    var nodes = [];
    var width = 0;
    var height = 0;
    var dpr = 1;
    var pointer = { x: -9999, y: -9999, active: false };
    var rafId = null;
    var running = false;

    var SPACING = 74;
    var LINK_DIST = 104;
    var INFLUENCE = 150;

    function build() {
      var rect = canvas.getBoundingClientRect();
      width = Math.max(rect.width, 1);
      height = Math.max(rect.height, 1);
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      nodes = [];
      var cols = Math.ceil(width / SPACING) + 2;
      var rows = Math.ceil(height / SPACING) + 2;

      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          // Offset alternate rows into a hexagonal-ish packing.
          var ox = (r % 2) * (SPACING / 2);
          var bx = c * SPACING + ox - SPACING;
          var by = r * SPACING - SPACING;
          nodes.push({
            bx: bx,
            by: by,
            x: bx,
            y: by,
            phase: Math.random() * Math.PI * 2,
            speed: 0.28 + Math.random() * 0.42,
            amp: 3 + Math.random() * 5,
            size: Math.random() < 0.14 ? 2.1 : 1.2
          });
        }
      }
    }

    function draw(t) {
      ctx.clearRect(0, 0, width, height);

      var i;
      var n;
      for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        var drift = Math.sin(t * 0.00042 * n.speed + n.phase) * n.amp;
        var driftY = Math.cos(t * 0.00036 * n.speed + n.phase) * n.amp;
        var px = n.bx + drift;
        var py = n.by + driftY;

        if (pointer.active) {
          var dx = px - pointer.x;
          var dy = py - pointer.y;
          var dist = Math.hypot(dx, dy);
          if (dist < INFLUENCE && dist > 0.01) {
            var push = (1 - dist / INFLUENCE) * 22;
            px += (dx / dist) * push;
            py += (dy / dist) * push;
          }
        }

        n.x = px;
        n.y = py;
      }

      // Bonds
      ctx.lineWidth = 1;
      for (i = 0; i < nodes.length; i++) {
        var a = nodes[i];
        if (a.x < -60 || a.x > width + 60 || a.y < -60 || a.y > height + 60) continue;
        for (var j = i + 1; j < nodes.length; j++) {
          var b = nodes[j];
          var ddx = a.x - b.x;
          if (ddx > LINK_DIST || ddx < -LINK_DIST) continue;
          var ddy = a.y - b.y;
          if (ddy > LINK_DIST || ddy < -LINK_DIST) continue;
          var d = Math.hypot(ddx, ddy);
          if (d > LINK_DIST) continue;

          var alpha = (1 - d / LINK_DIST) * 0.26;
          ctx.strokeStyle = 'rgba(52, 211, 153,' + alpha.toFixed(3) + ')';
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // Nodes
      for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        if (n.x < -20 || n.x > width + 20 || n.y < -20 || n.y > height + 20) continue;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.size, 0, Math.PI * 2);
        ctx.fillStyle = n.size > 2 ? 'rgba(52, 211, 153, 0.75)' : 'rgba(150, 200, 214, 0.42)';
        ctx.fill();
      }
    }

    function loop(t) {
      draw(t);
      rafId = requestAnimationFrame(loop);
    }

    function start() {
      if (running || reduceMotion.matches) return;
      running = true;
      rafId = requestAnimationFrame(loop);
    }

    function stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    }

    build();
    if (reduceMotion.matches) {
      draw(0); // One static frame — the composition still reads.
    } else {
      start();
    }

    // Pointer, but only for devices that actually have one.
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      canvas.parentElement.addEventListener('pointermove', function (e) {
        var rect = canvas.getBoundingClientRect();
        pointer.x = e.clientX - rect.left;
        pointer.y = e.clientY - rect.top;
        pointer.active = true;
      });
      canvas.parentElement.addEventListener('pointerleave', function () {
        pointer.active = false;
      });
    }

    var resizeTimer;
    function scheduleRebuild() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        build();
        if (reduceMotion.matches) draw(0);
      }, 180);
    }

    window.addEventListener('resize', scheduleRebuild);

    // The hero can measure zero on first paint (fonts still loading, pane not
    // yet composited). Watching the box is more reliable than measuring once.
    if ('ResizeObserver' in window) {
      var lastW = 0;
      var lastH = 0;
      new ResizeObserver(function (entries) {
        var r = entries[0].contentRect;
        if (Math.abs(r.width - lastW) < 2 && Math.abs(r.height - lastH) < 2) return;
        lastW = r.width;
        lastH = r.height;
        scheduleRebuild();
      }).observe(canvas);
    }

    // Don't burn frames on a hero nobody is looking at.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) start();
            else stop();
          });
        },
        { threshold: 0 }
      ).observe(canvas);
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();
      else start();
    });

    reduceMotion.addEventListener('change', function (e) {
      if (e.matches) {
        stop();
        draw(0);
      } else {
        start();
      }
    });
  }

  /* ---------------------------------------------------------------------------
     Engagement brief form
     Validates on blur (never per keystroke), reports errors beside the field,
     announces them, and moves focus to the first problem.
     ------------------------------------------------------------------------- */
  function initForm() {
    var form = document.querySelector('[data-validate]');
    if (!form) return;

    var status = form.querySelector('.form__status');

    function fieldOf(input) {
      return input.closest('.field');
    }

    function messageFor(input) {
      if (input.validity.valueMissing) {
        return input.dataset.errorRequired || 'This field is required.';
      }
      if (input.validity.typeMismatch && input.type === 'email') {
        return 'Enter a valid email address, e.g. name@company.com';
      }
      if (input.validity.tooShort) {
        return 'Please give us at least ' + input.minLength + ' characters so we can respond usefully.';
      }
      return input.validationMessage || 'Please check this field.';
    }

    function validate(input) {
      var field = fieldOf(input);
      if (!field) return true;
      var errorEl = field.querySelector('.field__error');
      var ok = input.checkValidity();

      // tooShort only applies once the value is user-dirty, so a pasted or
      // programmatically set value would slip past checkValidity alone.
      var min = input.minLength;
      if (ok && min > 0 && input.value.length > 0 && input.value.length < min) {
        ok = false;
        field.classList.add('has-error');
        input.setAttribute('aria-invalid', 'true');
        if (errorEl) {
          errorEl.textContent =
            'Please give us at least ' + min + ' characters so we can respond usefully.';
        }
        return false;
      }

      field.classList.toggle('has-error', !ok);
      input.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (errorEl) errorEl.textContent = ok ? '' : messageFor(input);
      return ok;
    }

    var inputs = form.querySelectorAll('input[required], textarea[required], select[required], input[type="email"]');

    inputs.forEach(function (input) {
      input.addEventListener('blur', function () {
        validate(input);
      });
      // Once a field is marked bad, correct it live so the error clears promptly.
      input.addEventListener('input', function () {
        if (fieldOf(input) && fieldOf(input).classList.contains('has-error')) validate(input);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var firstBad = null;
      inputs.forEach(function (input) {
        if (!validate(input) && !firstBad) firstBad = input;
      });

      if (firstBad) {
        firstBad.focus();
        firstBad.scrollIntoView({
          behavior: reduceMotion.matches ? 'auto' : 'smooth',
          block: 'center'
        });
        return;
      }

      // No backend is wired up: this confirms locally and hands off to email.
      if (status) {
        status.classList.add('is-visible');
        status.focus();
      }
      form.querySelectorAll('input, textarea, select, button').forEach(function (el) {
        el.disabled = true;
      });
    });
  }

  /* ---------------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------------- */
  function boot() {
    initTheme();
    initHeader();
    initMegaMenu();
    initMobileNav();
    initReveal();
    initProcess();
    initCounters();
    initHeroCanvas();
    initForm();

    var yearEl = document.querySelectorAll('[data-year]');
    yearEl.forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
