(function () {
  const PAGE = 10;
  const UTM = {
    source: "ratingseo",
    medium: "referral",
    campaign: "agency_rating",
  };

  const TIER_LABEL = {
    premium: "Premium",
    standard: "Standard",
    economy: "Economy",
  };

  const data = window.RATING_DATA;
  if (!data) {
    console.error("RATING_DATA is missing");
    return;
  }

  let niche = "Все ниши";
  let visible = PAGE;

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function withUtm(url, agencyId) {
    try {
      const u = new URL(url);
      u.searchParams.set("utm_source", UTM.source);
      u.searchParams.set("utm_medium", UTM.medium);
      u.searchParams.set("utm_campaign", UTM.campaign);
      u.searchParams.set("utm_content", agencyId);
      return u.toString();
    } catch {
      const sep = url.includes("?") ? "&" : "?";
      return (
        url +
        sep +
        "utm_source=" +
        encodeURIComponent(UTM.source) +
        "&utm_medium=" +
        encodeURIComponent(UTM.medium) +
        "&utm_campaign=" +
        encodeURIComponent(UTM.campaign) +
        "&utm_content=" +
        encodeURIComponent(agencyId)
      );
    }
  }

  function filteredAgencies() {
    if (niche === "Все ниши") return data.agencies;
    return data.agencies.filter(function (a) {
      return a.niches.indexOf(niche) !== -1;
    });
  }

  function renderTrust() {
    const root = document.getElementById("trust-marquee");
    if (!root) return;
    const brands = data.trustBrands.concat(data.trustBrands);
    root.innerHTML = brands
      .map(function (b) {
        return "<span>" + escapeHtml(b) + "</span>";
      })
      .join("");
  }

  function renderFilters() {
    const root = document.getElementById("filters");
    if (!root) return;
    root.innerHTML = data.niches
      .map(function (item) {
        const active = item === niche ? " is-active" : "";
        return (
          '<button type="button" class="filter-btn' +
          active +
          '" data-niche="' +
          escapeHtml(item) +
          '" role="tab" aria-selected="' +
          (item === niche ? "true" : "false") +
          '">' +
          escapeHtml(item) +
          "</button>"
        );
      })
      .join("");
  }

  function renderAgency(agency, index, displayRank) {
    const delay = Math.min(index, 8) * 40;
    const tags = agency.niches
      .map(function (n) {
        return '<span class="tag">' + escapeHtml(n) + "</span>";
      })
      .join("");
    const href = withUtm(agency.website, agency.id);
    const rank = String(displayRank).padStart(2, "0");

    return (
      '<article class="rank-row animate-rise" role="listitem" style="animation-delay:' +
      delay +
      'ms">' +
      '<div class="rank-col">' +
      '<span class="rank-num">' +
      rank +
      "</span>" +
      '<span class="tier tier-' +
      escapeHtml(agency.tier) +
      '">' +
      TIER_LABEL[agency.tier] +
      "</span>" +
      "</div>" +
      '<div class="agency-main">' +
      '<div class="agency-title-row">' +
      '<h3 class="agency-name">' +
      (agency.rank <= 10
        ? '<a class="agency-name-link" href="/agency/' +
          encodeURIComponent(agency.id) +
          '/">' +
          escapeHtml(agency.name) +
          "</a>"
        : escapeHtml(agency.name)) +
      "</h3>" +
      '<span class="agency-city">' +
      escapeHtml(agency.city) +
      "</span>" +
      "</div>" +
      '<p class="agency-summary">' +
      escapeHtml(agency.summary) +
      "</p>" +
      '<div class="tags">' +
      tags +
      "</div>" +
      "</div>" +
      '<div class="meta-block">' +
      '<div class="meta-item"><div class="meta-label">Опыт</div><div class="meta-value">' +
      agency.years +
      " лет</div></div>" +
      '<div class="meta-item"><div class="meta-label">Кейсы</div><div class="meta-value">' +
      agency.cases +
      "+</div></div>" +
      "</div>" +
      '<div class="score-block">' +
      '<div class="score-label">Score</div>' +
      '<div class="score-value">' +
      Number(agency.score).toFixed(1) +
      "</div>" +
      "</div>" +
      '<div class="link-block">' +
      '<a class="btn btn-outline-light" href="' +
      escapeHtml(href) +
      '" target="_blank" rel="noopener noreferrer">Сайт →</a>' +
      "</div>" +
      "</article>"
    );
  }

  function nicheSlug(name) {
    return (data.nicheSlugs && data.nicheSlugs[name]) || "";
  }

  function renderRanking() {
    const list = document.getElementById("agency-list");
    const count = document.getElementById("rating-count");
    const lead = document.getElementById("rating-lead");
    const cycle = document.getElementById("rating-cycle");
    const nicheLink = document.getElementById("niche-page-link");
    const nicheAnchor = document.getElementById("niche-page-anchor");
    const moreWrap = document.getElementById("load-more-wrap");
    const moreBtn = document.getElementById("load-more");
    if (!list) return;

    const filtered = filteredAgencies();
    const shown = filtered.slice(0, visible);
    const slug = nicheSlug(niche);

    if (cycle) {
      if (niche === "Все ниши") {
        cycle.textContent =
          "Q3 2026 · Index v1.2 · следующий пересчёт Q4";
      } else {
        cycle.textContent =
          "Ниша «" +
          niche +
          "» · Q3 2026 · Index v1.2 · следующий пересчёт Q4";
      }
    }

    if (nicheLink && nicheAnchor) {
      if (niche !== "Все ниши" && slug) {
        nicheLink.hidden = false;
        nicheAnchor.href = "/rating/" + slug + "/";
        nicheAnchor.textContent =
          "Открыть страницу ниши «" + niche + "» →";
      } else {
        nicheLink.hidden = true;
      }
    }

    if (lead) {
      if (niche === "Все ниши") {
        lead.innerHTML =
          data.agencies.length +
          " карточек в открытой выборке · цикл Q3 2026. Топ пересчитаем в Q4 — позиции могут измениться. " +
          '<a href="/rating/">Все нишевые рейтинги</a>';
      } else {
        lead.textContent =
          "Только агентства с нишей «" +
          niche +
          "» в досье. Score общий (Index v1.2), порядок — среди попавших в фильтр.";
      }
    }

    if (count) {
      count.textContent = "Показано " + shown.length + " из " + filtered.length;
    }

    if (shown.length === 0) {
      list.innerHTML =
        '<p class="empty-state">В этой нише пока нет агентств в открытой выборке.</p>';
    } else {
      const useLocalRank = niche !== "Все ниши";
      list.innerHTML = shown
        .map(function (agency, i) {
          const displayRank = useLocalRank ? i + 1 : agency.rank;
          return renderAgency(agency, i, displayRank);
        })
        .join("");
    }

    if (moreWrap && moreBtn) {
      if (visible < filtered.length) {
        moreWrap.hidden = false;
        moreBtn.textContent =
          "Загрузить ещё (" + (filtered.length - visible) + ")";
      } else {
        moreWrap.hidden = true;
      }
    }
  }

  function renderWeights() {
    const root = document.getElementById("weights");
    if (!root) return;
    root.innerHTML = data.methodologyWeights
      .map(function (item) {
        const width = Math.min(100, item.weight * 2.2);
        return (
          '<article class="weight-card">' +
          '<div class="weight-top">' +
          "<h3>" +
          escapeHtml(item.title) +
          "</h3>" +
          '<span class="weight-pct">' +
          item.weight +
          "%</span>" +
          "</div>" +
          '<div class="weight-bar" aria-hidden="true"><span style="width:' +
          width +
          '%"></span></div>' +
          "<p>" +
          escapeHtml(item.text) +
          "</p>" +
          "</article>"
        );
      })
      .join("");
  }

  function renderQuestions() {
    const root = document.getElementById("questions");
    if (!root) return;
    root.innerHTML = data.questions
      .map(function (q, i) {
        const num = String(i + 1).padStart(2, "0");
        return (
          "<li><span class=\"q-num\">" +
          num +
          '</span><p class="q-text">' +
          escapeHtml(q) +
          "</p></li>"
        );
      })
      .join("");
  }

  function renderFaq() {
    const root = document.getElementById("faq-list");
    if (!root) return;
    root.innerHTML = data.faqItems
      .map(function (item) {
        return (
          '<details class="faq-item">' +
          "<summary><h3>" +
          escapeHtml(item.q) +
          '</h3><span class="chev" aria-hidden="true">+</span></summary>' +
          "<p>" +
          escapeHtml(item.a) +
          "</p>" +
          "</details>"
        );
      })
      .join("");
  }

  function bindEvents() {
    const filters = document.getElementById("filters");
    if (filters) {
      filters.addEventListener("click", function (e) {
        const btn = e.target.closest("[data-niche]");
        if (!btn) return;
        niche = btn.getAttribute("data-niche");
        visible = PAGE;
        renderFilters();
        renderRanking();
      });
    }

    const moreBtn = document.getElementById("load-more");
    if (moreBtn) {
      moreBtn.addEventListener("click", function () {
        visible += PAGE;
        renderRanking();
      });
    }

    const form = document.getElementById("lead-form");
    const success = document.getElementById("form-success");
    if (form && success) {
      bindFormSubmit(form, success, document.getElementById("lead-form-error"), {
        subject: "RatingSEO — заявка на подбор агентства",
      });
    }

    const joinForm = document.getElementById("join-form");
    const joinSuccess = document.getElementById("join-form-success");
    if (joinForm && joinSuccess) {
      bindFormSubmit(joinForm, joinSuccess, document.getElementById("join-form-error"), {
        subject: "RatingSEO — заявка попасть в рейтинг",
      });
    }

    bindJoinModal();

    const year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());
  }

  function bindJoinModal() {
    const modal = document.getElementById("join-modal");
    if (!modal) return;

    function openModal() {
      modal.hidden = false;
      document.body.classList.add("modal-open");
      const first = modal.querySelector("input:not([type=hidden])");
      if (first) first.focus();
    }

    function closeModal() {
      modal.hidden = true;
      document.body.classList.remove("modal-open");
    }

    document.querySelectorAll("[data-open-join]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        openModal();
      });
    });

    document.querySelectorAll("[data-close-join]").forEach(function (el) {
      el.addEventListener("click", closeModal);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.hidden) closeModal();
    });
  }

  function getFormEmail() {
    const config = window.SITE_CONFIG || {};
    return String(config.formEmail || "").trim();
  }

  function getFormEndpoint() {
    const config = window.SITE_CONFIG || {};
    return String(config.formEndpoint || "send.php").trim();
  }

  function bindFormSubmit(form, success, errorEl, options) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const privacy = form.querySelector('input[name="privacy"]');
      if (privacy && !privacy.checked) {
        if (errorEl) {
          errorEl.hidden = false;
          errorEl.textContent = "Отметьте согласие с политикой конфиденциальности.";
        }
        privacy.focus();
        return;
      }

      const endpoint = getFormEndpoint();
      const toEmail = getFormEmail();
      if (!endpoint) {
        if (errorEl) {
          errorEl.hidden = false;
          errorEl.textContent = "Не задан formEndpoint в config.js.";
        }
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const payload = Object.fromEntries(new FormData(form).entries());
      payload._subject = options.subject;
      payload._honey = "";
      if (toEmail) payload._to = toEmail;

      if (errorEl) {
        errorEl.hidden = true;
        errorEl.textContent = "";
      }
      if (submitBtn) submitBtn.disabled = true;

      fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          return res.json().then(function (body) {
            return { ok: res.ok, body: body };
          });
        })
        .then(function (result) {
          if (!result.ok || (result.body && result.body.ok === false)) {
            throw new Error(
              (result.body && result.body.error) ||
                "Не удалось отправить заявку"
            );
          }
          form.classList.add("is-hidden");
          success.classList.add("is-visible");
        })
        .catch(function (err) {
          if (errorEl) {
            errorEl.hidden = false;
            errorEl.textContent =
              err.message ||
              "Ошибка отправки. Проверьте mail-config.php на Beget.";
          }
        })
        .finally(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }

  function injectItemListJsonLd() {
    const items = data.agencies.slice(0, 10).map(function (a, i) {
      return {
        "@type": "ListItem",
        position: i + 1,
        name: a.name,
        url: withUtm(a.website, a.id),
      };
    });

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Топ SEO-агентств RatingSEO",
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      numberOfItems: data.agencies.length,
      itemListElement: items,
    });
    document.head.appendChild(script);
  }

  renderTrust();
  renderFilters();
  renderRanking();
  renderWeights();
  renderQuestions();
  renderFaq();
  bindEvents();
  injectItemListJsonLd();
})();
