# CVN xHamster Katalog (Addon)

Dies ist ein eigenständiges Stremio-Protokoll-Addon für Nuvio. Es ist getrennt vom lokalen Nuvio-Scraper-Plugin im Repository-Root.

## Funktionen

- Katalog-Feed über die öffentlich erreichbare xHamster-Startseite
- Volltextsuche über öffentliche xHamster-Suchergebnisse
- Videodetails (Titel, Poster, Beschreibung)
- Stream-Auflösung aus direkt eingebetteten HLS-URLs (.m3u8)

Es werden keine Anmeldungen, Altersprüfungen, CAPTCHAs, DRM- oder Anti-Bot-Schutzmechanismen umgangen. Falls xHamster eine Seite sperrt oder eine Altersprüfung verlangt, liefert das Addon keine Ergebnisse.

## Lokal starten

Voraussetzung: Node.js 20 oder neuer.

```sh
cd addon
npm install
npm start
```

Manifest lokal: `http://localhost:7000/manifest.json`

## Bereitstellung

Das Addon muss auf einem öffentlich erreichbaren Node.js-Host betrieben werden. Als Startbefehl `npm start`, Arbeitsverzeichnis `addon`, Runtime Node 20+ und Port aus der Umgebungsvariable `PORT` verwenden. Danach in Nuvio unter **Addons** die URL `https://DEINE-DOMAIN/manifest.json` hinzufügen.

Die GitHub-Repository-URL allein ist keine Addon-URL. Ein Deployment wurde noch nicht durchgeführt, da dafür Zugriff auf einen Hosting-Anbieter erforderlich ist.

## Einschränkungen

xHamster kann HTML-Strukturen, Suchpfade und Medienauslieferung jederzeit ändern. Der Extractor ist deshalb experimentell. Nur HLS-URLs, die bereits direkt in einer öffentlich erreichbaren Videoseite eingebettet sind, werden zurückgegeben. Es gibt keinen Proxy für gesperrte Inhalte.
