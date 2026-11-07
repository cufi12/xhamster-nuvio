# CVN Multi-Plattform-Katalog (Addon)

Eigenständiges Stremio-kompatibles Addon für Nuvio. Es ist getrennt vom Nuvio-Scraper-Plugin im Repository-Root.

## Live-Betrieb

Manifest: `https://cvn-xhamster-catalog.onrender.com/manifest.json`

Der Katalog **xHamster** liefert eine eigene Startseiten-Reihe mit neuesten Treffern. Zusätzlich gibt es **xHamster · Suche** sowie optionale Filterkataloge für Kategorie, Tag, Creator und Channel.

## Plattformstatus

- **xHamster:** öffentliche Videoseiten werden durchsucht; direkt veröffentlichte MP4/HLS-Quellen können als Streams zurückgegeben werden.
- Ein sichtbarer Katalogeintrag bedeutet nicht automatisch, dass die Quelle in Nuvios integriertem Player abspielbar ist.

## ID- und Stream-Regeln

- Jeder Film erhält eine deterministische ID aus seiner kanonischen öffentlichen Videoseiten-URL (`xh:` + Base64URL). Änderungen an Titel, Poster oder Beschreibung ändern die ID nicht.
- Metadaten und Stream-Abfragen verwenden dieselbe ID. Nach einem Serverneustart wird der Datensatz bei Bedarf über die exakte Videoseiten-URL beim Actor erneut gesucht.
- Stream-Kandidaten aus Actor-Daten werden nicht ungeprüft ausgegeben. Jede URL muss über einen begrenzten HTTP-HEAD- bzw. Range-GET-Test erreichbar sein und einen Video-, HLS- oder DASH-Medientyp liefern. Andernfalls bleibt `streams` leer.
- Der Stream-Test folgt HTTP-Weiterleitungen, akzeptiert nur HTTP(S) und prüft höchstens vier Kandidaten pro Video. Ein Katalogeintrag allein ist kein Wiedergabenachweis.

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

Es werden keine Anmeldungen, Altersprüfungen, CAPTCHAs, DRM- oder Anti-Bot-Schutzmechanismen umgangen. Nur öffentlich verfügbare Metadaten und direkt freigegebene Medienquellen werden verwendet.
