# Quellen-Audit – 7. November 2026

Dieses Audit trennt kostenlose Recherche-Kandidaten von technisch integrierbaren Nuvio-Streams. Ein technisch erreichbarer Stream ist nicht automatisch lizenziert.

## xHamster – separater Nuvio-Provider

Auf ausdrücklichen Nutzerwunsch wird xHamster als eigener Provider im Nuvio-Manifest geführt. Er ist **nicht** Teil der drei Kategorien des Gratis-/Deutsch-Katalogs.

- Die Nuvio-TMDB-ID wird über einen vom Nutzer in den Provider-Einstellungen hinterlegten TMDB API Key in einen Filmtitel aufgelöst.
- Die Suche erfolgt über den bestehenden Apify-Backend-Dienst.
- Das Backend gibt nur direkte Medien-URLs zurück, die einen Medien-Content-Type-Test bestanden haben.
- Dieser technische Test bestätigt weder Urheberschaft noch Verbreitungsrechte. Es gibt keine pauschale Aussage, dass Inhalte auf xHamster autorisiert oder kostenlos nutzbar sind.
- Keine Umgehung von Anmeldung, Altersprüfung, CAPTCHA, DRM, Paywall oder Anti-Bot-Schutz.
- Ein echter Nuvio-Plugin- und Wiedergabetest steht noch aus.

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

Kein belastbarer, kostenloser, öffentlich zugänglicher und lizenzierter Anbieter mit nachgewiesener deutscher Synchron-Tonspur wurde in dieser Recherche bestätigt. Anime-Loads, HentaiCloud und HentaiZilla bleiben ungeprüfte Recherche-Hinweise und werden nicht als Stream-Quellen eingebunden.

## Freigabekriterien pro Titel

1. Quelle ist Rechteinhaber oder nachweislich autorisierter Distributor.
2. Wiedergabe ist ohne verpflichtende Zahlung, Abo oder PPV möglich.
3. Regionale Verfügbarkeit ist für den Zielmarkt geprüft.
4. Bei deutscher Synchronisation ist die deutsche Audiospur im Player bestätigt (Untertitel zählen nicht).
5. Der konkrete Stream funktioniert im Nuvio-Player.
6. Film-/Serien-ID, Staffel und Episode stimmen.

## Status

Der xHamster-Provider ist technisch registriert, benötigt aber einen TMDB API Key und einen End-to-End-Test. Die drei ursprünglichen Provider bleiben deaktiviert, bis Quellen und Streams verifiziert sind.
