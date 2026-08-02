/* =========================================================
   allumeriapacks — main.js
   - i18n (lang/*.json) with localStorage persistence
   - dynamic pack catalog rendering (search + type filter)
   - product/detail page rendering (pack.html?id=...)
   - submit form -> pre-filled GitHub issue (with char counters)
   ========================================================= */
(function () {
  "use strict";

  var LANG_STORAGE_KEY = "allumeriapacks:lang";
  var BANNER_STORAGE_KEY = "allumeriapacks:bannerDismissed";
  var AVAILABLE_LANGS = ["de", "en", "pl", "ru", "uk"];
  var DEFAULT_LANG = "de";
  var FALLBACK_LANG = "en";

  var SHORT_DESC_LIMIT = 160;
  var LONG_DESC_LIMIT = 1000;

  var GITHUB_ORG = "allumeriapacks";
  var GITHUB_REPO = "allumeriapacks.github.io";
  var GITHUB_REPO_URL = "https://github.com/" + GITHUB_ORG + "/" + GITHUB_REPO;

  var TYPE_ICON = { language: "\uD83D\uDDE3", texture: "\uD83C\uDFA8", mod: "\uD83E\uDDE9", other: "\uD83D\uDCE6" };

  var state = {
    lang: null,
    dict: {},
    packs: [],
    filter: "all",
    query: ""
  };

  /* ---------- helpers ---------- */

  function safeGet(storage, key) {
    try { return storage.getItem(key); } catch (e) { return null; }
  }
  function safeSet(storage, key, val) {
    try { storage.setItem(key, val); } catch (e) { /* ignore (private mode etc.) */ }
  }

  function getPath(obj, path) {
    return path.split(".").reduce(function (acc, part) {
      return acc && typeof acc === "object" ? acc[part] : undefined;
    }, obj);
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function detectInitialLang() {
    var stored = safeGet(window.localStorage, LANG_STORAGE_KEY);
    if (stored && AVAILABLE_LANGS.indexOf(stored) !== -1) return stored;
    var nav = (navigator.language || navigator.userLanguage || "").slice(0, 2).toLowerCase();
    if (AVAILABLE_LANGS.indexOf(nav) !== -1) return nav;
    return DEFAULT_LANG;
  }

  async function loadLang(code) {
    var res = await fetch("lang/" + code + ".json", { cache: "no-store" });
    if (!res.ok) throw new Error("lang file missing: " + code);
    return res.json();
  }

  /* ---------- i18n application ---------- */

  function applyTranslations() {
    var t = state.dict;
    document.documentElement.lang = state.lang;

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var val = getPath(t, el.getAttribute("data-i18n"));
      if (typeof val === "string") el.textContent = val;
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      var val = getPath(t, el.getAttribute("data-i18n-html"));
      if (typeof val === "string") el.innerHTML = val;
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      var val = getPath(t, el.getAttribute("data-i18n-aria"));
      if (typeof val === "string") el.setAttribute("aria-label", val);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      var val = getPath(t, el.getAttribute("data-i18n-placeholder"));
      if (typeof val === "string") el.setAttribute("placeholder", val);
    });

    if (t.meta) {
      document.title = t.meta.title;
      var metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute("content", t.meta.description);
      var ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute("content", t.meta.description);
      var ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute("content", t.meta.title);
    }

    document.dispatchEvent(new CustomEvent("allumeriapacks:i18n-applied"));
  }

  async function setLang(code, opts) {
    opts = opts || {};
    if (AVAILABLE_LANGS.indexOf(code) === -1) code = DEFAULT_LANG;
    var dict = await loadLang(code);
    state.lang = code;
    state.dict = dict;
    safeSet(window.localStorage, LANG_STORAGE_KEY, code);
    applyTranslations();
    renderLangSwitcher();
    if (!opts.skipRender && typeof window.__allumeriaRender === "function") {
      window.__allumeriaRender();
    }
  }

  /* ---------- language switcher UI ---------- */

  function renderLangSwitcher() {
    var btn = document.getElementById("lang-current");
    if (btn) {
      var meta = state.dict._meta || {};
      btn.textContent = (meta.flag ? meta.flag + " " : "") + (meta.label || state.lang.toUpperCase());
    }
    var menu = document.getElementById("lang-menu");
    if (!menu) return;
    menu.innerHTML = "";

    var pending = AVAILABLE_LANGS.map(function (code) {
      return code === state.lang ? Promise.resolve(state.dict) : loadLang(code).catch(function () { return null; });
    });

    Promise.all(pending).then(function (dicts) {
      AVAILABLE_LANGS.forEach(function (code, i) {
        var d = dicts[i];
        if (!d) return;
        var m = d._meta || {};
        var item = document.createElement("button");
        item.type = "button";
        item.setAttribute("aria-current", String(code === state.lang));
        item.innerHTML = '<span aria-hidden="true">' + (m.flag || "") + "</span> " + (m.label || code.toUpperCase());
        item.addEventListener("click", function () {
          setLang(code);
          closeLangMenu();
        });
        menu.appendChild(item);
      });
    });
  }

  function closeLangMenu() {
    var wrap = document.getElementById("lang-switch");
    if (wrap) wrap.classList.remove("open");
  }

  function initLangSwitcher() {
    var wrap = document.getElementById("lang-switch");
    var btn = document.getElementById("lang-current");
    if (!wrap || !btn) return;
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      wrap.classList.toggle("open");
    });
    document.addEventListener("click", function (e) {
      if (!wrap.contains(e.target)) closeLangMenu();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeLangMenu();
    });
  }

  /* ---------- banner ---------- */

  function initBanner() {
    var banner = document.getElementById("disclaimer-banner");
    if (!banner) return;
    if (safeGet(window.localStorage, BANNER_STORAGE_KEY) === "1") {
      banner.hidden = true;
      return;
    }
    var closeBtn = banner.querySelector(".dismiss");
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        banner.hidden = true;
        safeSet(window.localStorage, BANNER_STORAGE_KEY, "1");
      });
    }
  }

  /* ---------- mobile nav ---------- */

  function initNavToggle() {
    var toggle = document.getElementById("nav-toggle");
    var links = document.getElementById("nav-links");
    if (!toggle || !links) return;
    toggle.addEventListener("click", function () {
      var isOpen = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  /* ---------- disabled placeholder-link guard ---------- */

  function initDisabledLinkGuard() {
    document.addEventListener("click", function (e) {
      var link = e.target.closest('a[data-disabled="true"]');
      if (link) e.preventDefault();
    });
  }

  /* ---------- footer year ---------- */

  function initFooterYear() {
    var el = document.getElementById("footer-year");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  /* ---------- shared pack helpers ---------- */

  function pickLocalized(field) {
    if (!field) return "";
    return field[state.lang] || field[FALLBACK_LANG] || field[Object.keys(field)[0]] || "";
  }

  function typeLabel(t, type) {
    return t.pack["type_" + type] || t.pack.type_other;
  }
  function statusLabel(t, status) {
    return t.pack["status_" + status] || status;
  }
  function typeIcon(type) {
    return TYPE_ICON[type] || TYPE_ICON.other;
  }

  function downloadInfo(pack) {
    var has = pack.links && pack.links.download && pack.links.download.indexOf("REPLACE_WITH") !== 0;
    return { href: has ? pack.links.download : "#", disabled: !has };
  }

  /* =========================================================
     CATALOG PAGE (index.html)
     ========================================================= */

  async function loadPacks() {
    try {
      var res = await fetch("data/packs.json", { cache: "no-store" });
      var data = await res.json();
      state.packs = data.packs || [];
    } catch (e) {
      state.packs = [];
    }
  }

  function packMatchesQuery(pack, q) {
    if (!q) return true;
    var haystack = [
      pack.name,
      pack.author,
      pack.authorHandle,
      pack.creator,
      (pack.tags || []).join(" "),
      pickLocalized(pack.descriptionShort)
    ].join(" ").toLowerCase();
    return haystack.indexOf(q) !== -1;
  }

  function packCardHtml(pack, t) {
    var desc = escapeHtml(pickLocalized(pack.descriptionShort));
    var tags = (pack.tags || []).slice(0, 4).map(function (tag) {
      return "<li>" + escapeHtml(tag) + "</li>";
    }).join("");

    var official = pack.official
      ? '<div class="pack-card__official">' + escapeHtml(t.pack.official_badge) + "</div>"
      : "";

    var authorLine = pack.authorLink
      ? '<p class="pack-card__author">' + escapeHtml(t.pack.by) + ' <a href="' + escapeHtml(pack.authorLink) + '" target="_blank" rel="noopener">' + escapeHtml(pack.authorHandle || pack.author) + "</a></p>"
      : '<p class="pack-card__author">' + escapeHtml(t.pack.by) + " " + escapeHtml(pack.author || "") + "</p>";

    var thumb = pack.images && pack.images.logo
      ? '<img class="pack-card__thumb" src="' + escapeHtml(pack.images.logo) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.replaceWith(Object.assign(document.createElement(\'div\'),{className:\'pack-card__thumb-fallback\',textContent:\'' + typeIcon(pack.type) + '\'}))">'
      : '<div class="pack-card__thumb-fallback" aria-hidden="true">' + typeIcon(pack.type) + "</div>";

    return (
      '<article class="pack-card" data-type="' + escapeHtml(pack.type) + '">' +
        thumb +
        '<div class="pack-card__top">' +
          '<div class="pack-card__badge" aria-hidden="true">' + typeIcon(pack.type) + "</div>" +
          '<div class="pack-card__kicker">' + escapeHtml(typeLabel(t, pack.type)) + "</div>" +
        "</div>" +
        official +
        "<h3>" + escapeHtml(pack.name) + "</h3>" +
        authorLine +
        '<span class="status-tag status-tag--demo">' + escapeHtml(statusLabel(t, pack.status)) + "</span>" +
        '<p class="desc">' + desc + "</p>" +
        (tags ? '<ul class="pack-card__tags">' + tags + "</ul>" : "") +
        '<div class="pack-card__actions">' +
          '<a class="btn btn--primary btn--sm btn--block" href="pack.html?id=' + encodeURIComponent(pack.id) + '">' + escapeHtml(t.pack.details_cta) + "</a>" +
        "</div>" +
      "</article>"
    );
  }

  function renderCatalog() {
    var grid = document.getElementById("pack-grid");
    if (!grid) return;
    var t = state.dict;
    if (!t.pack) return;

    var q = state.query.trim().toLowerCase();
    var visible = state.packs.filter(function (p) {
      return (state.filter === "all" || p.type === state.filter) && packMatchesQuery(p, q);
    });

    grid.innerHTML = visible.map(function (p) { return packCardHtml(p, t); }).join("");

    var empty = document.getElementById("pack-empty");
    if (empty) {
      empty.hidden = visible.length > 0;
      if (visible.length === 0) {
        var isSearch = q.length > 0;
        var titleEl = empty.querySelector("h3");
        var textEl = empty.querySelector("p.empty-text");
        if (titleEl) titleEl.textContent = isSearch ? t.search.no_results_title : t.empty.title;
        if (textEl) textEl.textContent = isSearch ? t.search.no_results_text : t.empty.text;
      }
    }
  }

  function initSearch() {
    var input = document.getElementById("pack-search");
    var clearBtn = document.getElementById("search-clear");
    if (!input) return;
    input.addEventListener("input", function () {
      state.query = input.value;
      if (clearBtn) clearBtn.classList.toggle("show", state.query.length > 0);
      renderCatalog();
    });
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        input.value = "";
        state.query = "";
        clearBtn.classList.remove("show");
        renderCatalog();
        input.focus();
      });
    }
  }

  function initFilters() {
    var bar = document.getElementById("filter-bar");
    if (!bar) return;
    bar.addEventListener("click", function (e) {
      var chip = e.target.closest(".filter-chip");
      if (!chip) return;
      state.filter = chip.getAttribute("data-filter");
      bar.querySelectorAll(".filter-chip").forEach(function (c) {
        c.setAttribute("aria-pressed", String(c === chip));
      });
      renderCatalog();
    });
  }

  function initCatalogPage() {
    var grid = document.getElementById("pack-grid");
    if (!grid) return false;
    initSearch();
    initFilters();
    window.__allumeriaRender = renderCatalog;
    return true;
  }

  /* =========================================================
     PRODUCT / DETAIL PAGE (pack.html?id=...)
     ========================================================= */

  function getQueryId() {
    return new URLSearchParams(window.location.search).get("id");
  }

  function renderDetail() {
    var root = document.getElementById("detail-root");
    if (!root) return;
    var t = state.dict;
    if (!t.detail) return;

    var id = getQueryId();
    var pack = state.packs.find(function (p) { return p.id === id; });

    if (!pack) {
      root.innerHTML =
        '<div class="detail-notfound">' +
          "<h1>" + escapeHtml(t.detail.not_found_title) + "</h1>" +
          "<p>" + escapeHtml(t.detail.not_found_text) + "</p>" +
          '<a class="btn btn--primary" href="index.html">' + escapeHtml(t.detail.back_home) + "</a>" +
        "</div>";
      document.title = t.detail.not_found_title + " – allumeriapacks";
      return;
    }

    document.title = pack.name + " – allumeriapacks";
    var metaDesc = document.querySelector('meta[name="description"]');
    var shortDesc = pickLocalized(pack.descriptionShort);
    if (metaDesc && shortDesc) metaDesc.setAttribute("content", shortDesc);

    var thumb = pack.images && pack.images.logo
      ? '<img class="detail-header__thumb" src="' + escapeHtml(pack.images.logo) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.replaceWith(Object.assign(document.createElement(\'div\'),{className:\'detail-header__thumb-fallback\',textContent:\'' + typeIcon(pack.type) + '\'}))">'
      : '<div class="detail-header__thumb-fallback" aria-hidden="true">' + typeIcon(pack.type) + "</div>";

    var official = pack.official
      ? '<span class="pack-card__official">' + escapeHtml(t.pack.official_badge) + "</span>"
      : "";

    var dl = downloadInfo(pack);
    var creatorRow = pack.creator
      ? "<dt>" + escapeHtml(t.pack.creator_label) + "</dt><dd>" +
        (pack.creatorLink ? '<a href="' + escapeHtml(pack.creatorLink) + '" target="_blank" rel="noopener">' + escapeHtml(pack.creator) + "</a>" : escapeHtml(pack.creator)) +
        "</dd>"
      : "";

    var gallery = pack.images && pack.images.gallery && pack.images.gallery.length
      ? '<h2>' + escapeHtml(t.detail.gallery_title) + '</h2><div class="detail-gallery">' +
          pack.images.gallery.slice(0, 3).map(function (src) {
            return '<img src="' + escapeHtml(src) + '" alt="' + escapeHtml(pack.name) + '" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">';
          }).join("") +
        "</div>"
      : "";

    var langRow = pack.languages && pack.languages.length
      ? "<dt>" + escapeHtml(t.detail.languages_label) + "</dt><dd>" + escapeHtml(pack.languages.join(", ")) + "</dd>"
      : "";

    var tags = (pack.tags || []).map(function (tag) { return "<li>" + escapeHtml(tag) + "</li>"; }).join("");

    root.innerHTML =
      '<a class="detail-back" href="index.html#catalog">' + escapeHtml(t.detail.back) + "</a>" +
      '<div class="detail-header">' +
        thumb +
        "<div>" +
          official +
          '<h1 class="detail-header__title">' + escapeHtml(pack.name) + "</h1>" +
          '<p class="detail-header__sub">' + escapeHtml(t.pack.by) + " " +
            (pack.authorLink ? '<a href="' + escapeHtml(pack.authorLink) + '" target="_blank" rel="noopener">' + escapeHtml(pack.authorHandle || pack.author) + "</a>" : escapeHtml(pack.author || "")) +
          "</p>" +
          '<div class="detail-header__badges">' +
            '<span class="status-tag status-tag--demo">' + escapeHtml(statusLabel(t, pack.status)) + "</span>" +
            '<span class="pack-card__kicker">' + typeIcon(pack.type) + " " + escapeHtml(typeLabel(t, pack.type)) + "</span>" +
          "</div>" +
          (tags ? '<ul class="pack-card__tags">' + tags + "</ul>" : "") +
          '<div class="detail-header__actions">' +
            '<a class="btn btn--primary' + (dl.disabled ? " btn--disabled" : "") + '" href="' + escapeHtml(dl.href) + '"' +
              (dl.disabled ? ' aria-disabled="true" data-disabled="true" title="Link folgt in Kürze"' : ' target="_blank" rel="noopener"') +
              ">" + escapeHtml(t.pack.download) + "</a>" +
            (pack.links && pack.links.info ? '<a class="btn btn--ghost" href="' + escapeHtml(pack.links.info) + '" target="_blank" rel="noopener">' + escapeHtml(t.pack.info) + "</a>" : "") +
          "</div>" +
          '<p class="pack-card__external" style="margin-top:14px;">' + escapeHtml(t.pack.external_note) + "</p>" +
        "</div>" +
      "</div>" +
      '<div class="detail-grid">' +
        '<div class="detail-main">' +
          "<h2>" + escapeHtml(t.detail.description_title) + "</h2>" +
          "<p>" + escapeHtml(pickLocalized(pack.descriptionLong) || pickLocalized(pack.descriptionShort)) + "</p>" +
          gallery +
        "</div>" +
        '<aside class="detail-side">' +
          "<h2 style=\"margin-top:0;\">" + escapeHtml(t.detail.meta_title) + "</h2>" +
          "<dl>" +
            (pack.version ? "<dt>" + escapeHtml(t.detail.version_label) + "</dt><dd>v" + escapeHtml(pack.version) + "</dd>" : "") +
            (pack.updated ? "<dt>" + escapeHtml(t.detail.updated_label) + "</dt><dd>" + escapeHtml(pack.updated) + "</dd>" : "") +
            langRow +
            creatorRow +
          "</dl>" +
        "</aside>" +
      "</div>";
  }

  function initDetailPage() {
    var root = document.getElementById("detail-root");
    if (!root) return false;
    window.__allumeriaRender = renderDetail;
    return true;
  }

  /* =========================================================
     SUBMIT FORM (submit.html)
     ========================================================= */

  function wireCharCounter(fieldId, limit) {
    var field = document.getElementById(fieldId);
    var counter = document.getElementById(fieldId + "-counter");
    if (!field || !counter) return;
    function update() {
      var len = field.value.length;
      counter.textContent = len + " / " + limit;
      counter.classList.toggle("limit-near", len > limit * 0.85 && len <= limit);
      counter.classList.toggle("limit-over", len > limit);
    }
    field.addEventListener("input", update);
    update();
  }

  function initSubmitForm() {
    var form = document.getElementById("submit-form");
    if (!form) return;

    wireCharCounter("description-short", SHORT_DESC_LIMIT);
    wireCharCounter("description-long", LONG_DESC_LIMIT);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = form.elements;
      var name = f["pack-name"].value.trim();
      var type = f["pack-type"].value;
      var author = f["author"].value.trim();
      var link = f["link"].value.trim();
      var descShort = f["description-short"].value.trim().slice(0, SHORT_DESC_LIMIT);
      var descLong = f["description-long"].value.trim().slice(0, LONG_DESC_LIMIT);
      var languages = f["languages"] ? f["languages"].value.trim() : "";
      var tags = f["tags"] ? f["tags"].value.trim() : "";
      var creator = f["creator"] ? f["creator"].value.trim() : "";
      var creatorLink = f["creator-link"] ? f["creator-link"].value.trim() : "";
      var imgLogo = f["image-logo"] ? f["image-logo"].value.trim() : "";
      var imgGallery = ["image-gallery-1", "image-gallery-2", "image-gallery-3"]
        .map(function (id) { return f[id] ? f[id].value.trim() : ""; })
        .filter(Boolean);

      var title = "[Pack] " + (name || "Neues Pack");
      var body = [
        "### Name des Packs", name,
        "", "### Art", type,
        "", "### Ersteller", author,
        "", "### Download-Link", link,
        "", "### Kurzbeschreibung", descShort,
        "", "### Ausführliche Beschreibung", descLong,
        "", "### Sprache(n)", languages || "-",
        "", "### Tags", tags || "-",
        "", "### Asset-Ersteller", creator || "-",
        "", "### Link zum Asset-Ersteller", creatorLink || "-",
        "", "### Logo/Vorschaubild", imgLogo || "-",
        "", "### Weitere Bilder", imgGallery.length ? imgGallery.join("\n") : "-"
      ].join("\n");

      var params = new URLSearchParams();
      params.set("labels", "pack-submission");
      params.set("template", "submit-pack.yml");
      params.set("title", title);
      params.set("pack-name", name);
      params.set("pack-type", type);
      params.set("author", author);
      params.set("link", link);
      params.set("description-short", descShort);
      params.set("description-long", descLong);
      params.set("languages", languages);
      params.set("tags", tags);
      params.set("creator", creator);
      params.set("creator-link", creatorLink);
      params.set("image-logo", imgLogo);
      imgGallery.forEach(function (url, i) { params.set("image-gallery-" + (i + 1), url); });

      window.open(GITHUB_REPO_URL + "/issues/new?" + params.toString(), "_blank", "noopener");
    });
  }

  /* ---------- boot ---------- */

  document.addEventListener("DOMContentLoaded", async function () {
    initBanner();
    initNavToggle();
    initLangSwitcher();
    initDisabledLinkGuard();
    initFooterYear();
    initSubmitForm();

    var isCatalog = initCatalogPage();
    var isDetail = initDetailPage();

    await setLang(detectInitialLang(), { skipRender: true });

    if (isCatalog || isDetail) {
      await loadPacks();
    }
    if (typeof window.__allumeriaRender === "function") {
      window.__allumeriaRender();
    }
  });
})();
