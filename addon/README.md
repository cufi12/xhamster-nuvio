# CVN Multi-Plattform-Katalog (Addon)

Eigenständiges Stremio-kompatibles Addon für Nuvio. Der HTTP-Server verwendet ausschließlich die integrierten Node.js-Module; es gibt keine Laufzeit-Abhängigkeiten von npm-Paketen.

## Live-Betrieb

Manifest: `https://cvn-xhamster-catalog.onrender.com/manifest.json`

Das Addon bietet folgende Kataloge:

- **iXXX · German Dub · Spielfilme:** Titel mit ausdrücklich erkannter deutscher Synchronisation und mindestens 90 Minuten Laufzeit.
- **iXXX · German Dub · Anime:** separate Anime-Suche mit deutscher Synchronisations-Kennzeichnung.
- **iXXX · Studio Magma · Spielfilme:** Titel, die Magma nennen, ab 90 Minuten.
- **iXXX · Studio MMV · Spielfilme:** Titel, die MMV nennen, ab 90 Minuten.
- **xHamster Suche:** Suchanfrage erzeugt einen Eintrag, der die passende Suchseite extern öffnet.

## Quellen und Wiedergabe

iXXX ist ein Verzeichnis, das Einträge auf externe Anbieter weiterleitet. Der Adapter liest öffentlich erreichbare Titel-, Laufzeit-, Poster- und Quellenmetadaten aus. Er löst keine externen Redirects auf und gibt keine ungeprüften Medienstreams aus. xHamster wird ausschließlich als externe Suchseite geöffnet. Deshalb können Einträge im Katalog sichtbar sein, ohne dass eine Wiedergabe direkt in Nuvio funktioniert.

Es werden keine Anmeldungen, Altersprüfungen, CAPTCHAs, DRM- oder Anti-Bot-Schutzmechanismen umgangen. Nur öffentlich erreichbare Metadaten und vom Anbieter freigegebene Links werden verwendet.

## Lokal starten

Voraussetzung: Node.js 20 oder neuer.

```sh
cd addon
npm ci
npm test
npm start
```

Manifest lokal: `http://localhost:7000/manifest.json`
