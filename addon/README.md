# CVN Multi-Plattform-Katalog (Addon)

Eigenständiges Stremio-kompatibles Addon für Nuvio.

## Live-Betrieb

Manifest: `https://cvn-xhamster-catalog.onrender.com/manifest.json`

Die Startseite enthält vier getrennte iXXX-Verzeichniskataloge:

- **German Dub · Spielfilme:** nur Titel mit ausdrücklich angegebener deutscher Synchronisation und mindestens 90 Minuten Laufzeit.
- **German Dub · Anime:** separate Suche nach Anime mit deutscher Synchronisation.
- **Deutsche Studios · Magma:** nur Treffer, deren Titel Magma nennt, ab 90 Minuten.
- **Deutsche Studios · MMV:** nur Treffer, deren Titel MMV nennt, ab 90 Minuten.

Die bisherigen kurzen xHamster-Kataloge sind aus dem Manifest entfernt. Eine neue xHamster-Langfilmquelle kann später ergänzt werden, sobald die konkrete URL vorliegt.

## Quellen und Wiedergabe

iXXX ist ein Verzeichnis, das Einträge auf externe Anbieter weiterleitet. Der Adapter liest öffentliche Titel-, Laufzeit-, Poster- und Quellenmetadaten aus. Er löst keine externen Redirects auf und gibt keine ungeprüften Medienstreams aus. Deshalb können Einträge im Katalog sichtbar sein, ohne dass die Wiedergabe direkt in Nuvio funktioniert.

## Lokal starten

Voraussetzung: Node.js 20 oder neuer.

```sh
cd addon
npm install
npm test
npm start
```

Manifest lokal: `http://localhost:7000/manifest.json`

## Grenzen

Es werden keine Anmeldungen, Altersprüfungen, CAPTCHAs, DRM- oder Anti-Bot-Schutzmechanismen umgangen. Nur öffentlich erreichbare Metadaten und vom Anbieter freigegebene Links werden verwendet.
