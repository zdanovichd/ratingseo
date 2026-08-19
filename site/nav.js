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


  function appendFooterTrustLinks() {
    var footerNav = qs(".footer-nav");
    if (!footerNav) return;
    var links = [
      { href: "/editorial-policy/", label: "Редполитика" },
      { href: "/fact-checking-policy/", label: "Фактчекинг" },
      { href: "/corrections-policy/", label: "Исправления" },
      { href: "/methodology-changelog/", label: "Changelog" },
      { href: "/editorial/", label: "Разборы" }
    ];
    links.forEach(function (item) {
      if (qs('a[href="' + item.href + '"]', footerNav)) return;
      var a = document.createElement("a");
      a.href = item.href;
      a.textContent = item.label;
      footerNav.appendChild(a);
    });
  }

  function buildTrustStampHtml() {
    return (
      '<section class="section section-paper2 trust-stamp-section">' +
      '<div class="container">' +
      '<div class="trust-stamp">' +
      '<p><strong>Проверка карточки:</strong> редакция RatingSEO · обновлено 07.08.2026</p>' +
      '<p><strong>Основание пересчёта:</strong> цикл Q3 2026, Index v1.2, верификация открытых данных и кейсов.</p>' +
      '<p><strong>Процедуры:</strong> <a href="/editorial-policy/">редполитика</a>, <a href="/fact-checking-policy/">фактчекинг</a>, <a href="/corrections-policy/">политика исправлений</a>.</p>' +
      '</div>' +
      '</div>' +
      '</section>'
    );
  }

  function enhanceAgencyPage() {
    if (!location.pathname.startsWith("/agency/") || location.pathname === "/agency/") return;
    if (qs(".trust-stamp-section")) return;
    var main = qs("main");
    if (!main) return;
    main.insertAdjacentHTML("beforeend", buildTrustStampHtml());

    var body = qs(".agency-body");
    if (!body || qs(".agency-verified-facts", body)) return;
    body.insertAdjacentHTML(
      "beforeend",
      '<section class="agency-verified-facts" aria-label="Проверенные данные">' +
        '<h3>Проверенные данные</h3>' +
        '<ul>' +
          '<li>Ниша в карточке = ниши, где агентство показало верифицируемые кейсы в текущем цикле.</li>' +
          '<li>Score и ранг рассчитываются одинаковой формулой для всех участников.</li>' +
          '<li>Обновление досье фиксируется публично в <a href="/methodology-changelog/">changelog методологии</a>.</li>' +
        '</ul>' +
      '</section>'
    );
  }

  function enhanceNichePage() {
    if (!location.pathname.startsWith("/rating/") || location.pathname === "/rating/") return;
    if (qs(".niche-expert-note")) return;
    var sectionHead = qs(".section-head");
    if (!sectionHead) return;
    sectionHead.insertAdjacentHTML(
      "beforeend",
      '<div class="niche-expert-note">' +
      '<h3>Как выбирать подрядчика в этой нише</h3>' +
      '<p>Смотрите на связку бизнес-метрик и технической зрелости: подтверждённые кейсы за 6–12 месяцев, прозрачный backlog задач, SLA по внедрению и понятные ограничения прогноза.</p>' +
      '<p><a href="/editorial/">Редакционные разборы</a> · <a href="/methodology/">Полная методика</a></p>' +
      '</div>'
    );
  }

  function enhanceAgencyHubAndNicheHub() {
    if (location.pathname !== "/agency/" && location.pathname !== "/rating/") return;
    var section = qs("main .section-paper2 .container");
    if (!section || qs(".hub-trust-block", section)) return;
    section.insertAdjacentHTML(
      "beforeend",
      '<div class="hub-trust-block">' +
      '<h3>Редакция и апелляции</h3>' +
      '<p>Для запроса пересмотра карточки, уточнения фактов или исправлений: <a href="mailto:info@ratingseo.ru">info@ratingseo.ru</a>.</p>' +
      '<p>Срок первичного ответа — до 3 рабочих дней. Процесс и SLA: <a href="/corrections-policy/">политика исправлений</a>.</p>' +
      '</div>'
    );
  }

  document.addEventListener("DOMContentLoaded", function () {
    initBurger();
    initMoreMenu();
    appendFooterTrustLinks();
    enhanceAgencyPage();
    enhanceNichePage();
    enhanceAgencyHubAndNicheHub();
  });
})();
