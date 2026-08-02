# Contributing to allumeriapacks

Thanks for your interest! Here's how a pack makes it into the catalog:

## 1. Submit a pack

- Easiest way: use the form at [allumeriapacks.github.io/submit.html](https://allumeriapacks.github.io/submit.html) —
  it automatically opens a pre-filled GitHub issue.
- Or directly via [Issues → New Issue → "📦 Submit a pack"](../../issues/new/choose).

Important:
- **Files are not uploaded to this repo.** Host your pack externally
  (e.g. as a [GitHub Release](https://docs.github.com/en/repositories/releasing-projects-on-github)
  in your own repo, Mega, MediaFire, itch.io, etc.) and only link to it here.
- **Images as links only**, no file uploads — the logo/thumbnail and up to 3 additional screenshots
  are embedded via a direct image URL (`<img src="…">`). This way no executable files can be smuggled in.
- **Tags always stay in English** (a fixed taxonomy across the whole catalog, regardless of the
  website's UI language).

## 2. Review

A maintainer checks the submission for:

- A working, legal download link
- Image links (must be real images, not executable files)
- A plausible short (max. 160 characters) and full description (max. 1000 characters)
- A confirmed rights/license statement

## 3. Getting added to the catalog

Once approved, an entry is added to [`data/packs.json`](../data/packs.json), e.g.:

```json
{
  "id": "unique-slug",
  "name": "Pack name",
  "type": "mod",
  "author": "Display name",
  "authorHandle": "Gamertag",
  "authorLink": "https://…",
  "creator": "",
  "creatorLink": "",
  "official": false,
  "status": "demo",
  "version": "1.0",
  "updated": "2026-08-01",
  "languages": [],
  "descriptionShort": { "de": "…", "en": "…" },
  "descriptionLong": { "de": "…", "en": "…" },
  "images": { "logo": "https://…", "gallery": ["https://…"] },
  "links": { "download": "https://…", "info": "" },
  "tags": ["mod", "gameplay"]
}
```

`id` is also used as the URL for the product page: `pack.html?id=unique-slug`.
The site renders new entries automatically — no further code needed.

## Adding a new site language

1. Create a new file `lang/<code>.json` (copy the structure of `lang/de.json` and translate it).
   Do **not** translate the tags in `data/packs.json` — those stay in English.
2. Add the code to `AVAILABLE_LANGS` in `assets/js/main.js`.

## Code of conduct

- No content that violates applicable law or infringes on third-party rights.
- No insults, hate speech, or spam in submissions.
- allumeriapacks is a pure fan project with no affiliation to the official Allumeria developers.

---

# Mitmachen bei allumeriapacks (Deutsch)

Danke für dein Interesse! So kommt ein Pack in den Katalog:

## 1. Pack einreichen

- Am einfachsten über das Formular auf [allumeriapacks.github.io/submit.html](https://allumeriapacks.github.io/submit.html) —
  das öffnet automatisch ein vorausgefülltes GitHub-Issue.
- Oder direkt über [Issues → New Issue → „📦 Pack einreichen"](../../issues/new/choose).

Wichtig:
- **Dateien werden nicht in diesem Repo hochgeladen.** Lade dein Pack extern hoch
  (z. B. als [GitHub Release](https://docs.github.com/de/repositories/releasing-projects-on-github)
  in einem eigenen Repo, Mega, MediaFire, itch.io o. ä.) und verlinke nur darauf.
- **Bilder nur als Link**, kein Datei-Upload — Logo/Vorschaubild und bis zu 3 weitere Screenshots werden
  per direkter Bild-URL eingebunden (`<img src="…">`). So können keine ausführbaren Dateien eingeschleust werden.
- **Tags bleiben immer auf Englisch** (feste Taxonomie über den ganzen Katalog hinweg, unabhängig von der
  UI-Sprache der Website).

## 2. Review

Ein Maintainer prüft die Einreichung auf:

- Funktionierenden, legalen Download-Link
- Bild-Links (müssen echte Bilder sein, keine ausführbaren Dateien)
- Plausible Kurz- (max. 160 Zeichen) und Langbeschreibung (max. 1000 Zeichen)
- Bestätigte Rechte-/Lizenzangabe

## 3. Aufnahme in den Katalog

Nach Freigabe wird ein Eintrag in [`data/packs.json`](../data/packs.json) ergänzt, z. B.:

```json
{
  "id": "eindeutiger-slug",
  "name": "Name des Packs",
  "type": "mod",
  "author": "Anzeigename",
  "authorHandle": "Gamertag",
  "authorLink": "https://…",
  "creator": "",
  "creatorLink": "",
  "official": false,
  "status": "demo",
  "version": "1.0",
  "updated": "2026-08-01",
  "languages": [],
  "descriptionShort": { "de": "…", "en": "…" },
  "descriptionLong": { "de": "…", "en": "…" },
  "images": { "logo": "https://…", "gallery": ["https://…"] },
  "links": { "download": "https://…", "info": "" },
  "tags": ["mod", "gameplay"]
}
```

`id` wird auch als URL für die Produktseite verwendet: `pack.html?id=eindeutiger-slug`.
Die Seite rendert neue Einträge automatisch — kein weiterer Code nötig.

## Neue Website-Sprache hinzufügen

1. Neue Datei `lang/<code>.json` anlegen (Struktur wie `lang/de.json` kopieren und übersetzen).
   Tags in `data/packs.json` **nicht** mit übersetzen — die bleiben Englisch.
2. In `assets/js/main.js` den Code zu `AVAILABLE_LANGS` hinzufügen.

## Verhaltensregeln

- Kein Inhalt, der gegen geltendes Recht verstößt oder Rechte Dritter verletzt.
- Keine Beleidigungen, Hassrede oder Spam in Einreichungen.
- allumeriapacks ist ein reines Fan-Projekt ohne Verbindung zu den offiziellen Allumeria-Entwicklern.
