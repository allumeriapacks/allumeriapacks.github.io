/* =========================================================
   allumeriapacks — main.js
   - i18n (lang/*.json) with localStorage persistence
   - dynamic pack catalog rendering from data/packs.json
   - filter chips
   - submit form -> pre-filled GitHub issue
   ========================================================= */
(function () {
  "use strict";

  var LANG_STORAGE_KEY = "allumeriapacks:lang";
  var BANNER_STORAGE_KEY = "allumeriapacks:bannerDismissed";
  var AVAILABLE_LANGS = ["de", "en", "pl", "ru", "uk"];
  var DEFAULT_LANG = "de";
  var FALLBACK_LANG = "en";

  var GITHUB_ORG = "allumeriapacks";
  var GITHUB_REPO = "allumeriapacks.github.io";
  var GITHUB_REPO_URL = "https://github.com/" + GITHUB_ORG + "/" + GITHUB_REPO;

  var state = {
    lang: null,
    dict: {},
    packs: [],
    filter: "all"
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
      var key = el.getAttribute("data-i18n");
      var val = getPath(t, key);
      if (typeof val === "string") el.textContent = val;
    });

    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-html");
      var val = getPath(t, key);
      if (typeof val === "string") el.innerHTML = val;
    });

    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-aria");
      var val = getPath(t, key);
      if (typeof val === "string") el.setAttribute("aria-label", val);
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-placeholder");
      var val = getPath(t, key);
      if (typeof val === "string") el.setAttribute("placeholder", val);
    });

    // document meta
    if (t.meta) {
      document.title = t.meta.title;
      var metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute("content", t.meta.description);
      var ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute("content", t.meta.description);
      var ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute("content", t.meta.title);
    }
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
    if (!opts.skipPacks) renderPacks();
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
      return code === state.lang
        ? Promise.resolve(state.dict)
        : loadLang(code).catch(function () { return null; });
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

  /* ---------- pack catalog ---------- */

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function pickDescription(pack) {
    if (!pack.description) return "";
    return pack.description[state.lang] || pack.description[FALLBACK_LANG] ||
      pack.description[Object.keys(pack.description)[0]] || "";
  }

  function typeLabel(t, type) {
    return t.pack["type_" + type] || t.pack.type_other;
  }
  function statusLabel(t, status) {
    return t.pack["status_" + status] || status;
  }

  function packCardHtml(pack, t) {
    var desc = escapeHtml(pickDescription(pack));
    var tags = (pack.tags || []).map(function (tag) {
      return "<li>" + escapeHtml(tag) + "</li>";
    }).join("");

    var official = pack.official
      ? '<div class="pack-card__official">' + escapeHtml(t.pack.official_badge) + "</div>"
      : "";

    var authorLine = pack.authorLink
      ? '<p class="pack-card__author">' + escapeHtml(t.pack.by) + ' <a href="' + escapeHtml(pack.authorLink) + '" target="_blank" rel="noopener">' + escapeHtml(pack.authorHandle || pack.author) + "</a></p>"
      : '<p class="pack-card__author">' + escapeHtml(t.pack.by) + " " + escapeHtml(pack.author || "") + "</p>";

    var badgeIcon = pack.type === "language" ? "🗣" : pack.type === "texture" ? "🎨" : "📦";

    var downloadDisabled = !pack.links || !pack.links.download || pack.links.download.indexOf("REPLACE_WITH") === 0;
    var downloadHref = downloadDisabled ? "#" : escapeHtml(pack.links.download);

    var infoBtn = pack.links && pack.links.info
      ? '<a class="btn btn--ghost btn--sm" href="' + escapeHtml(pack.links.info) + '" target="_blank" rel="noopener">' + escapeHtml(t.pack.info) + "</a>"
      : "";

    return (
      '<article class="pack-card" data-type="' + escapeHtml(pack.type) + '">' +
        '<div class="pack-card__top">' +
          '<div class="pack-card__badge" aria-hidden="true">' + badgeIcon + "</div>" +
          '<div class="pack-card__kicker">' + escapeHtml(typeLabel(t, pack.type)) + "</div>" +
        "</div>" +
        official +
        "<h3>" + escapeHtml(pack.name) + "</h3>" +
        authorLine +
        '<span class="status-tag status-tag--demo">' + escapeHtml(statusLabel(t, pack.status)) + "</span>" +
        '<p class="desc">' + desc + "</p>" +
        (tags ? '<ul class="pack-card__tags">' + tags + "</ul>" : "") +
        '<div class="pack-card__external">' + escapeHtml(t.pack.external_note) + "</div>" +
        '<div class="pack-card__meta">' +
          (pack.version ? "<span><strong>v" + escapeHtml(pack.version) + "</strong></span>" : "") +
          (pack.updated ? "<span>" + escapeHtml(pack.updated) + "</span>" : "") +
        "</div>" +
        '<div class="pack-card__actions">' +
          '<a class="btn btn--primary btn--sm' + (downloadDisabled ? " btn--disabled" : "") + '" href="' + downloadHref + '"' +
            (downloadDisabled ? ' aria-disabled="true" title="Link folgt in Kürze"' : ' target="_blank" rel="noopener"') +
            (downloadDisabled ? ' data-disabled="true"' : "") + ">" + escapeHtml(t.pack.download) + "</a>" +
          infoBtn +
        "</div>" +
      "</article>"
    );
  }

  function renderPacks() {
    var grid = document.getElementById("pack-grid");
    var empty = document.getElementById("pack-empty");
    if (!grid) return;
    var t = state.dict;
    if (!t.pack) return;

    var visible = state.packs.filter(function (p) {
      return state.filter === "all" || p.type === state.filter;
    });

    grid.innerHTML = visible.map(function (p) { return packCardHtml(p, t); }).join("");

    if (empty) {
      empty.hidden = visible.length > 0;
      if (visible.length === 0) {
        var titleEl = empty.querySelector("h3");
        var textEl = empty.querySelector("p");
        if (titleEl) titleEl.textContent = t.empty.title;
        if (textEl) textEl.textContent = t.empty.text;
      }
    }
  }

  function initDisabledLinkGuard() {
    document.addEventListener("click", function (e) {
      var link = e.target.closest('a[data-disabled="true"]');
      if (link) e.preventDefault();
    });
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
      renderPacks();
    });
  }

  async function loadPacks() {
    try {
      var res = await fetch("data/packs.json", { cache: "no-store" });
      var data = await res.json();
      state.packs = data.packs || [];
    } catch (e) {
      state.packs = [];
    }
    renderPacks();
  }

  /* ---------- submit form -> GitHub issue ---------- */

  function initSubmitForm() {
    var form = document.getElementById("submit-form");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.elements["pack-name"].value.trim();
      var type = form.elements["pack-type"].value;
      var author = form.elements["author"].value.trim();
      var link = form.elements["link"].value.trim();
      var description = form.elements["description"].value.trim();
      var languages = form.elements["languages"] ? form.elements["languages"].value.trim() : "";

      var title = "[Pack] " + (name || "Neues Pack");
      var body = [
        "### Name des Packs", name,
        "", "### Art", type,
        "", "### Ersteller", author,
        "", "### Download-Link", link,
        "", "### Beschreibung", description,
        "", "### Sprache(n)", languages || "-"
      ].join("\n");

      var url = GITHUB_REPO_URL +
        "/issues/new?labels=pack-submission&template=submit-pack.yml" +
        "&title=" + encodeURIComponent(title) +
        "&pack-name=" + encodeURIComponent(name) +
        "&pack-type=" + encodeURIComponent(type) +
        "&author=" + encodeURIComponent(author) +
        "&link=" + encodeURIComponent(link) +
        "&description=" + encodeURIComponent(description) +
        "&languages=" + encodeURIComponent(languages);

      window.open(url, "_blank", "noopener");
    });
  }

  /* ---------- footer year ---------- */

  function initFooterYear() {
    var el = document.getElementById("footer-year");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  /* ---------- boot ---------- */

  document.addEventListener("DOMContentLoaded", async function () {
    initBanner();
    initNavToggle();
    initLangSwitcher();
    initFilters();
    initSubmitForm();
    initFooterYear();
    initDisabledLinkGuard();

    await setLang(detectInitialLang(), { skipPacks: true });
    await loadPacks();
  });
})();
