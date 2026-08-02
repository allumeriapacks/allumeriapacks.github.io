# allumeriapacks

**Fanmade, unofficial** hub for language, texture, and other packs for *Allumeria*.
Not affiliated with the official Allumeria developers.

🔗 Live: **https://allumeriapacks.github.io/**

## What is this?

A static, free GitHub Pages website (organization root repo `allumeriapacks/allumeriapacks.github.io`)
that catalogs language and texture packs for Allumeria. Downloads are hosted **externally**
(GitHub Free doesn't offer unlimited file hosting via Pages) — the site only links out.

Anyone can propose their own pack: fill out the form on `/submit.html` → it automatically opens a
pre-filled GitHub issue → after review it gets added to `data/packs.json` and shows up automatically
in the catalog with its own product page (`pack.html?id=…`). See [`CONTRIBUTING.md`](CONTRIBUTING.md) for details.

The catalog supports full-text search, filtering by type (language/texture/mod/other), and only
links to downloads on the product page — not directly on the catalog card. Tags are always in
English (fixed taxonomy), regardless of the selected UI language.

## Tech stack

Plain HTML/CSS/vanilla JS, no build step, no framework — runs as-is on GitHub Pages.

```
index.html              Homepage with search + catalog
pack.html                Product page per pack (download only here)
submit.html              Form for submitting a pack
assets/css/style.css     Styles (rustic wood/campfire theme)
assets/js/main.js        i18n, catalog/detail rendering, search, filters, issue bridge
assets/img/              Procedurally generated textures, favicon, OG image
lang/{de,en,pl,ru,uk}.json   UI translations (extensible)
data/packs.json          The actual pack catalog
.github/ISSUE_TEMPLATE/  Issue form for new submissions
```

## Linking your own downloads

You still need to replace the two placeholder entries in `data/packs.json`
(`REPLACE_WITH_RELEASE_URL`) with real download links. Recommendation: a separate repo per pack +
**GitHub Release** (free, no limit beyond Pages, direct and stable download URL) — alternatives
include itch.io, Mega, or MediaFire.

## License / rights

All packs linked here remain the property of their respective creators. The website code itself
can be freely adapted.

---

# allumeriapacks (Deutsch)

**Fanmade, inoffizielle** Sammelstelle für Sprach-, Textur- und andere Pakete zu *Allumeria*.
Nicht verbunden mit den offiziellen Allumeria-Entwicklern.

🔗 Live: **https://allumeriapacks.github.io/**

## Was ist das?

Eine statische, kostenlose GitHub-Pages-Website (Organisations-Root-Repo `allumeriapacks/allumeriapacks.github.io`),
die Sprach- und Texturepakete für Allumeria katalogisiert. Downloads werden **extern** gehostet
(GitHub Free hat kein unbegrenztes Datei-Hosting über Pages) — die Seite verlinkt nur.

Jede*r kann ein eigenes Pack vorschlagen: Formular auf `/submit.html` → öffnet automatisch ein
vorausgefülltes GitHub-Issue → nach Prüfung wird es in `data/packs.json` aufgenommen und erscheint
automatisch im Katalog samt eigener Produktseite (`pack.html?id=…`). Details siehe [`CONTRIBUTING.md`](CONTRIBUTING.md).

Der Katalog unterstützt Volltextsuche, Filter nach Typ (Sprache/Textur/Mod/Sonstiges) und
verlinkt Downloads erst auf der Produktseite — nicht direkt auf der Katalog-Karte. Tags sind
immer Englisch (feste Taxonomie), unabhängig von der gewählten UI-Sprache.

## Tech-Stack

Reines HTML/CSS/Vanilla-JS, kein Build-Schritt, kein Framework — läuft 1:1 auf GitHub Pages.

```
index.html              Startseite mit Suche + Katalog
pack.html                Produktseite pro Pack (Download nur hier)
submit.html              Formular zum Einreichen eines Packs
assets/css/style.css     Styles (rustikales Holz-/Lagerfeuer-Theme)
assets/js/main.js        i18n, Katalog-/Detail-Rendering, Suche, Filter, Issue-Bridge
assets/img/              Prozedural generierte Texturen, Favicon, OG-Bild
lang/{de,en,pl,ru,uk}.json   UI-Übersetzungen (erweiterbar)
data/packs.json          Der eigentliche Pack-Katalog
.github/ISSUE_TEMPLATE/  Issue-Formular für neue Einreichungen
```

## Eigene Downloads verlinken

Die beiden Platzhalter-Einträge in `data/packs.json` (`REPLACE_WITH_RELEASE_URL`) musst du noch
durch echte Download-Links ersetzen. Empfehlung: separates Repo pro Pack + **GitHub Release**
(kostenlos, kein Limit über Pages hinaus, direkte, stabile Download-URL) — Alternativen sind
z. B. itch.io, Mega oder MediaFire.

## Lizenz / Rechte

Alle hier verlinkten Pakete bleiben Eigentum ihrer jeweiligen Ersteller. Der Website-Code selbst
kann frei angepasst werden.
