(function () {
  var registryPromise = null;
  var byNumber = null;

  function normalize(value) {
    return String(value || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "")
      .replace(/_/g, "-");
  }

  function loadRegistry() {
    if (!registryPromise) {
      registryPromise = fetch("/awards/registry.json", { cache: "no-cache" })
        .then(function (r) {
          if (!r.ok) throw new Error("registry");
          return r.json();
        })
        .then(function (data) {
          byNumber = Object.create(null);
          (data.awards || []).forEach(function (a) {
            byNumber[normalize(a.number)] = a;
          });
          return data;
        });
    }
    return registryPromise;
  }

  function typeLabel(type) {
    return type === "top10" ? "Top-10 Award" : "Participant Award";
  }

  function renderResult(el, award) {
    if (!award) {
      el.hidden = false;
      el.className = "award-verify-result is-invalid";
      el.innerHTML =
        "<strong>Номер не найден.</strong> Проверьте написание или убедитесь, что документ относится к циклу Q3 2026.";
      return;
    }

    el.hidden = false;
    el.className = "award-verify-result is-valid";
    el.innerHTML =
      '<div class="award-verify-ok">Документ действителен</div>' +
      "<dl>" +
      "<div><dt>Номер</dt><dd>" +
      award.number +
      "</dd></div>" +
      "<div><dt>Тип</dt><dd>" +
      typeLabel(award.type) +
      "</dd></div>" +
      "<div><dt>Агентство</dt><dd>" +
      award.agencyName +
      "</dd></div>" +
      "<div><dt>Место / статус</dt><dd>" +
      (award.type === "top10" ? "#" + String(award.rank).padStart(2, "0") : "участник таблицы") +
      "</dd></div>" +
      "<div><dt>Score</dt><dd>" +
      award.score +
      "</dd></div>" +
      "<div><dt>Цикл</dt><dd>" +
      award.cycle +
      " · Index " +
      award.indexVersion +
      "</dd></div>" +
      "</dl>" +
      '<div class="award-verify-actions">' +
      '<a class="btn btn-signal" href="' +
      award.file +
      '" download="' +
      award.number +
      '.pdf">Скачать PDF</a>' +
      '<a class="btn btn-ghost" href="' +
      award.page +
      '">Страница award</a>' +
      "</div>";
  }

  async function verify(raw) {
    var el = document.getElementById("award-verify-result");
    if (!el) return;
    el.hidden = false;
    el.className = "award-verify-result";
    el.textContent = "Проверяем…";
    try {
      await loadRegistry();
      renderResult(el, byNumber[normalize(raw)] || null);
    } catch (err) {
      console.error(err);
      el.className = "award-verify-result is-invalid";
      el.innerHTML = "<strong>Не удалось загрузить реестр.</strong> Обновите страницу и попробуйте снова.";
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("award-verify-form");
    var input = document.getElementById("award-number");
    if (!form || !input) return;

    loadRegistry().catch(function () {});

    var params = new URLSearchParams(location.search);
    if (params.get("n")) {
      input.value = params.get("n");
      verify(params.get("n"));
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var n = input.value;
      var url = new URL(location.href);
      url.hash = "verify";
      if (n) url.searchParams.set("n", normalize(n));
      else url.searchParams.delete("n");
      history.replaceState(null, "", url);
      verify(n);
    });
  });
})();
