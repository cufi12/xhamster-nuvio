# CVN Gratis-Katalog für Nuvio

Dieses Repository ist für **Nuvio JavaScript-Plugin-Repositories** bestimmt, nicht für Stremio-Add-ons.

## Installation

Manifest-URL:
`https://raw.githubusercontent.com/cufi12/xhamster-nuvio/add-xhamster-provider/manifest.json`

## Geplante Kategorien

1. **Deutsche Studios** – deutsche Studios und Produktionen.
2. **German Dub · Aller Welt** – internationale Filme mit tatsächlich deutscher Synchron-Tonspur.
3. **Hentai · German Dub** – japanische Hentai-Filme und Serien mit tatsächlich deutscher Synchronisation.

## Prüfregeln

- Nur kostenlose, öffentlich erreichbare Videoangebote.
- Keine Cam-, Dating-, Chat-, Spiele-, Premium-only- oder PPV-Angebote.
- xHamster, Eporner und AdultEmbed sind ausdrücklich ausgeschlossen.
- Anime-Loads, HentaiCloud und HentaiZilla sind bislang nur Recherche-Kandidaten; keine dieser Seiten ist als autorisierte und technisch funktionierende Quelle bestätigt.
- Ein Verzeichniseintrag, eine frei erreichbare Videoseite oder eine deutsche Untertitelspur beweist weder Einbindungsrechte noch deutsche Synchronisation.
- Keine Umgehung von Logins, Altersprüfungen, CAPTCHAs, DRM, Paywalls oder Anti-Bot-Schutz.

## Technischer Status – ausdrücklich kein Release

Das Manifest entspricht dem aktuellen Nuvio-Plugin-Repositorymodell (`PluginManifest`) mit `name`, `version` und einem `scrapers`-Array. Jeder Eintrag enthält die vom Nuvio-Modell benötigten Felder `id`, `name`, `version` und `filename`. Nuvio ruft `getStreams(tmdbId, mediaType, season, episode)` auf und erwartet ein Array von Stream-Objekten (`title`, `url`, optional `name`, `quality`, `language`, `headers`). Der aktuelle NuvioTV-Quellcode verwendet für JS-Plugins QuickJS; ältere Provider-Anleitungen mit Hermes sind nicht maßgeblich.

Die drei Provider-Dateien sind derzeit Platzhalter und liefern keine Streams. Deshalb sind alle drei Einträge im Manifest **deaktiviert**. Es wurde noch kein End-to-End-Test in der Nuvio-App durchgeführt. Die lokale Vertragsprüfung ersetzt weder den Nuvio-Plugin-Tester noch einen echten Wiedergabetest. Dieses Repository ist aktuell **nicht als funktionierender Videokatalog freigegeben**.

## Vor einer Freigabe zwingend

Für jeden Provider müssen eine autorisierte Quelle, die geforderte deutsche Tonspur, ein tatsächlich abspielbarer Direktstream, korrekte Film-/Serienzuordnung sowie die Wiedergabe in Nuvio separat nachgewiesen und getestet werden.


## Quellen-Audit und Tests

Die aktuelle Quellenprüfung steht in [docs/source-audit.md](docs/source-audit.md). Sie dokumentiert kostenlose legale Recherche-Kandidaten, regionale Einschränkungen und die fehlenden Nachweise für Hentai mit deutscher Synchronisation.

Der Provider-Vertrag kann lokal mit Node.js geprüft werden:

```bash
node tests/provider-contract.test.js
```

Der Test bestätigt nur den Modulvertrag und das sichere Verhalten ohne verifizierte Streams. Er ist **kein** Nuvio- oder Wiedergabetest.
