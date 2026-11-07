# Quellen-Audit – 7. November 2026

Dieses Audit trennt **kostenlose legale Anbieter** von **direkt integrierbaren Nuvio-Streams**. Ein Anbieter kann legal sein, ohne eine öffentliche Direktstream-Schnittstelle zu erlauben.

## Nachprüfung vorhandener Nuvio-Provider (7. November 2026)

Ein öffentliches Community-Repository `InvalidPandaa/nuvio-german-providers` enthält GPL-3.0-or-later-Code für ARD, ARTE und Netzkino. Das bestätigt, dass es bereits technische Implementierungsansätze gibt, aber **nicht**, dass diese in diesem Repository unverändert funktionieren, dass jeder Treffer zum gewünschten Titel passt oder dass ein Nuvio-Wiedergabetest bestanden wurde. Die dortige Sammlung enthält daneben Drittanbieter-/Hoster-Provider, die ausdrücklich nicht übernommen werden. Vor einer Übernahme sind Lizenzhinweise und vollständiger Quelltext zu erhalten, die Schnittstellen an die aktuelle Nuvio-Version anzupassen und echte Tests durchzuführen.

**Entscheidung:** ARD, ARTE und Netzkino bleiben legale Recherche-Kandidaten für die erste Kategorie bzw. für einzelne Titel mit bestätigter deutscher Tonspur. Sie werden noch nicht als funktionierende Provider aktiviert. Für ARTE/ARD sind Titelrechte und Länderfenster titelbezogen zu prüfen; bei Netzkino müssen die konkrete Veröffentlichung und Stream-URL geprüft werden. Ein bloßer API-Treffer reicht nicht.

## Ergebnis je Kategorie

### 1. Deutsche Studios

**Recherche-Kandidaten, noch nicht als Nuvio-Quelle freigegeben:**
- Netzkino / PLAION: werbefinanzierter Gratisdienst mit Filmen. Vor Integration müssen Titelrechte, konkrete Video-URL und Player-Kompatibilität einzeln geprüft werden.
- Offizielle YouTube-Kanäle von Rechteinhabern/Verleihern (z. B. Cinenet Deutschland, Moviedome, Fabella, UCM.One): nur eindeutig vom Rechteinhaber veröffentlichte Titel berücksichtigen. YouTube-Seiten sind nicht automatisch native Direktstreams.
- ARD/ZDF/ARTE/3sat-Mediatheken: kostenlos, aber regionale Lizenzfenster und wechselnde Verfügbarkeit; keine Direktstream-Extraktion ohne offizielle Schnittstelle.

### 2. German Dub – aller Welt

- Rakuten TV Free, Pluto TV, Netzkino und werbefinanzierte Gratisbereiche sind mögliche legale Kataloge.
- Die Existenz eines Titels im Katalog beweist keine deutsche Synchronspur. Vor Aufnahme muss die Audioauswahl des konkreten Titels nachweislich Deutsch enthalten.
- YouTube Primetime Free ist laut YouTube-Hilfe nur in ausgewählten Ländern verfügbar; Deutschland ist genannt, die Schweiz nicht. Daher keine pauschale Verfügbarkeitszusage.

### 3. Hentai – German Dub

**Kein belastbarer, kostenloser, öffentlich zugänglicher und lizenzierter Anbieter mit nachgewiesener deutscher Synchron-Tonspur wurde in dieser Recherche bestätigt.**

Anime-Loads, HentaiCloud und HentaiZilla bleiben ungeprüfte Recherche-Hinweise und werden nicht als Stream-Quellen eingebunden. Ein Verzeichnis oder ein frei erreichbarer Player belegt keine Verbreitungsrechte. HentaiClouds beispielhafte Episode wird nicht aufgenommen, solange Rechte und deutsche Tonspur nicht belegt sind.

## Ausschlüsse

- xHamster, Eporner und AdultEmbed: vollständig ausgeschlossen.
- Keine Cam-, Dating-, Chat-, Spiele-, Premium-only- oder PPV-Angebote.
- Keine Umgehung von Anmeldung, Altersprüfung, CAPTCHA, DRM, Paywall oder Anti-Bot-Schutz.

## Freigabekriterien pro Titel

Ein Titel darf erst dann als Stream zurückgegeben werden, wenn alle Punkte dokumentiert sind:

1. Quelle ist Rechteinhaber oder nachweislich autorisierter Distributor.
2. Wiedergabe ist ohne verpflichtende Zahlung, Abo oder PPV möglich.
3. Regionale Verfügbarkeit ist für den Zielmarkt geprüft.
4. Bei Kategorie 2/3 ist die **deutsche Audiospur** im Player bestätigt (Untertitel zählen nicht).
5. Der konkrete Stream funktioniert in Nuvios Android-/iOS-Player.
6. Film-/Serien-ID, Staffel und Episode stimmen.

## Status

Die drei Provider bleiben deaktiviert. Diese Entscheidung verhindert, dass unbestätigte oder rechtswidrig verbreitete Streams als fertige, funktionierende Quellen ausgegeben werden.

## Recherchebelege

- Comparis, „Filme und Serien kostenlos streamen in der Schweiz“ (30.03.2026): listet SRF/ARD/ZDF, Play Suisse, Rakuten TV Free, Netzkino und UCM.One; weist auf Lizenz-/Länderbeschränkungen hin.
- Offizielle Play Suisse-Seite: kostenloses SRG-Angebot; überwiegend Originalsprache mit Untertiteln, andere Audioversionen nur sofern verfügbar.
- YouTube-Hilfe „Kostenlose Primetime-Filme auf YouTube“: Verfügbarkeit nur in Deutschland, USA, Australien, Japan und UK genannt.
