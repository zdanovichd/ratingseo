(function () {
  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function initBurger() {
    var toggle = qs(".nav-toggle");
    var nav = qs("#site-nav");
    if (!toggle || !nav) return;

    function setOpen(open) {
      document.body.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    }

    toggle.addEventListener("click", function () {
      setOpen(!document.body.classList.contains("nav-open"));
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a") && document.body.classList.contains("nav-open")) {
        setOpen(false);
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });

    window.addEventListener("resize", function () {
      if (window.matchMedia("(min-width: 768px)").matches) setOpen(false);
    });
  }

  function initMoreMenu() {
    var nav = qs("#site-nav");
    var more = qs(".nav-more");
    var panel = qs(".nav-more-panel");
    var actions = qs(".header-actions");
    if (!nav || !more || !panel || !actions) return;

    var order = qsa("a[data-nav]", nav).map(function (a) {
      return a.getAttribute("data-nav");
    });

    function linksByOrder() {
      return order
        .map(function (key) {
          return qs('a[data-nav="' + key + '"]', document);
        })
        .filter(Boolean);
    }

    function restoreAll() {
      var mobileActions = qs(".nav-mobile-actions", nav);
      linksByOrder().forEach(function (a) {
        if (mobileActions) nav.insertBefore(a, mobileActions);
        else nav.appendChild(a);
      });
      more.hidden = true;
      more.open = false;
    }

    function fits() {
      // header row overflow: logo + nav + actions
      var inner = qs(".header-inner");
      if (!inner) return true;
      return inner.scrollWidth <= inner.clientWidth + 1;
    }

    function fit() {
      if (!window.matchMedia("(min-width: 768px)").matches) {
        restoreAll();
        return;
      }

      restoreAll();

      var guard = 0;
      while (!fits() && guard < 10) {
        guard += 1;
        var inNav = qsa(":scope > a[data-nav]", nav);
        if (inNav.length <= 2) break;
        var last = inNav[inNav.length - 1];
        panel.insertBefore(last, panel.firstChild);
        more.hidden = false;
      }

      if (!qsa("a", panel).length) {
        more.hidden = true;
        more.open = false;
      }
    }

    document.addEventListener("click", function (e) {
      if (!more.open) return;
      if (!more.contains(e.target)) more.open = false;
    });

    var scheduled = false;
    function schedule() {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(function () {
        scheduled = false;
        fit();
      });
    }

    window.addEventListener("resize", schedule);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(schedule).catch(schedule);
    } else {
      schedule();
    }
    schedule();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initBurger();
    initMoreMenu();
  });
})();
