# CVN Gratis-Katalog für Nuvio

Dieses Repository ist für **Nuvio Plugins** bestimmt, nicht für Stremio-Add-ons.

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

Das Manifest verwendet das Nuvio-Repositoryformat mit einem `scrapers`-Array. Nuvio-Provider müssen `getStreams(tmdbId, mediaType, season, episode)` exportieren und ein Array abspielbarer Stream-Objekte zurückgeben.

Die drei Provider-Dateien sind derzeit Platzhalter und liefern keine Streams. Deshalb sind alle drei Einträge im Manifest **deaktiviert**. Es wurde noch kein End-to-End-Test in der Nuvio-App durchgeführt. Dieses Repository ist aktuell **nicht als funktionierender Videokatalog freigegeben**.

## Vor einer Freigabe zwingend

Für jeden Provider müssen eine autorisierte Quelle, die geforderte deutsche Tonspur, ein tatsächlich abspielbarer Direktstream, korrekte Film-/Serienzuordnung sowie die Wiedergabe in Nuvio separat nachgewiesen und getestet werden.


## Quellen-Audit und Tests

Die aktuelle Quellenprüfung steht in [docs/source-audit.md](docs/source-audit.md). Sie dokumentiert kostenlose legale Recherche-Kandidaten, regionale Einschränkungen und die fehlenden Nachweise für Hentai mit deutscher Synchronisation.

Der Provider-Vertrag kann lokal mit Node.js geprüft werden:

```bash
node tests/provider-contract.test.js
```

Der Test bestätigt nur den Modulvertrag und das sichere Verhalten ohne verifizierte Streams. Er ist **kein** Nuvio- oder Wiedergabetest.
