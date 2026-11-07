# CVN Gratis-Katalog für Nuvio

Dieses Repository ist ein **Nuvio-Plugin-Repository** (Provider-Manifest), nicht das separate Stremio-Addon.

## Installation in Nuvio

Unter **Einstellungen → Plugins → Add Repository** diese Manifest-URL einfügen:

`https://raw.githubusercontent.com/cufi12/xhamster-nuvio/add-xhamster-provider/manifest.json`

Danach die Repository-Liste aktualisieren und die gewünschten CVN-Provider aktivieren.

## Drei Bereiche

1. **Deutsche Studios & Klassiker** – deutsche Produktionen und Klassiker.
2. **German Dub · Italien, Europa & USA** – nur Titel mit nachgewiesener deutscher Synchron-Tonspur.
3. **Hentai · Japanischer Originalton** – japanische Originalton-Fassungen.

## Aktueller Funktionsstand

- Das Manifest verwendet jetzt das Nuvio-Plugin-Format: eine JSON-Liste mit Provider-Einträgen.
- Jede Kategorie besitzt eine eigene JavaScript-Datei mit dem von Nuvio erwarteten `getStreams`-Export.
- Die Provider geben aktuell absichtlich **keine Streams** zurück, bis kostenlose, öffentlich erreichbare Quellen und deren tatsächliche Wiedergabe verifiziert wurden.
- Es werden keine Titel, Tonspuren oder abspielbaren URLs erfunden.
- xHamster, Eporner und AdultEmbed sind nicht integriert und werden nicht reaktiviert.
- Keine Umgehung von Logins, Altersprüfungen, CAPTCHAs, DRM, Paywalls oder Anti-Bot-Schutz.
- Nur kostenlose, öffentlich zugängliche Inhalte; keine Abos oder PPV.

## Separates Stremio-Addon

Das Render-Addon ist ein eigener Dienst und wird **nicht** als Plugin-Repository installiert:
`https://cvn-xhamster-catalog.onrender.com/manifest.json`
