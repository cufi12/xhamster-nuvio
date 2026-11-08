# Quellen-Audit – 8. November 2026

Dieses Audit trennt kostenlose Recherche-Kandidaten von technisch integrierbaren Nuvio-Streams. Ein technisch erreichbarer Stream ist nicht automatisch lizenziert.

## xHamster – entfernt

Der xHamster-Provider wurde aus dem aktiven Nuvio-Manifest entfernt. Die bisherige Implementierung rief einen Apify-Actor auf und konnte ohne gültige Apify-Konfiguration keine Katalogdaten liefern. Ein unabhängiger Ersatz wurde nicht als zuverlässig bestätigt; deshalb wird kein nicht getesteter Scraper aktiviert.

Es werden keine Logins, Altersprüfungen, CAPTCHAs, DRM, Paywalls oder Anti-Bot-Schutz umgangen. Der separate Render-Backend-Dienst wird durch diese Manifest-Änderung nicht automatisch gelöscht; er ist damit aber nicht mehr als aktiver Nuvio-Provider registriert.

## Ergebnis je ursprünglicher Kategorie

### 1. Deutsche Studios

Recherche-Kandidaten, noch nicht als Nuvio-Quelle freigegeben:
- Netzkino / PLAION: werbefinanzierter Gratisdienst mit Filmen. Vor Integration müssen Titelrechte, konkrete Video-URL und Player-Kompatibilität einzeln geprüft werden.
- Offizielle YouTube-Kanäle von Rechteinhabern/Verleihern: nur eindeutig vom Rechteinhaber veröffentlichte Titel berücksichtigen.
- ARD/ZDF/ARTE/3sat-Mediatheken: kostenlos, aber regionale Lizenzfenster und wechselnde Verfügbarkeit; keine Direktstream-Extraktion ohne offizielle Schnittstelle.

### 2. German Dub – aller Welt

- Rakuten TV Free, Pluto TV, Netzkino und werbefinanzierte Gratisbereiche sind mögliche legale Kataloge.
- Die Existenz eines Titels im Katalog beweist keine deutsche Synchronspur. Vor Aufnahme muss die Audioauswahl des konkreten Titels nachweislich Deutsch enthalten.
- YouTube Primetime Free ist nur in ausgewählten Ländern verfügbar; keine pauschale Verfügbarkeitszusage für die Schweiz.

### 3. Hentai – German Dub

Kein belastbarer, kostenloser, öffentlich zugänglicher und lizenzierter Anbieter mit nachgewiesener deutscher Synchron-Tonspur wurde in dieser Recherche bestätigt. Ungeprüfte Recherche-Hinweise werden nicht als Stream-Quellen eingebunden.

## Freigabekriterien pro Titel

1. Quelle ist Rechteinhaber oder nachweislich autorisierter Distributor.
2. Wiedergabe ist ohne verpflichtende Zahlung, Abo oder PPV möglich.
3. Regionale Verfügbarkeit ist für den Zielmarkt geprüft.
4. Bei deutscher Synchronisation ist die deutsche Audiospur im Player bestätigt (Untertitel zählen nicht).
5. Der konkrete Stream funktioniert im Nuvio-Player.
6. Film-/Serien-ID, Staffel und Episode stimmen.

## Status

Der xHamster-Provider ist aus dem aktiven Manifest entfernt. Open Culture Archive bleibt aktiviert; die übrigen Provider bleiben deaktiviert, bis Quellen und Streams verifiziert sind.
