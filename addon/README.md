# CVN xHamster Katalog (Addon)

Dies ist ein eigenständiges Stremio-Protokoll-Addon für Nuvio. Es ist getrennt vom lokalen Nuvio-Scraper-Plugin im Repository-Root.

## Live-Betrieb

Das Addon ist auf Render bereitgestellt: `https://cvn-xhamster-catalog.onrender.com/manifest.json`. Der Dienst startet mit Node.js und liefert das Addon-Manifest. Die fünf Kataloge suchen derzeit ausschließlich auf xHamster; der Eintrag „Weitere Dub-Suchtreffer“ ist ausdrücklich kein Plattformmix.

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

Der vorhandene Render-Dienst verwendet das Verzeichnis `addon`, Node.js 20+ und `npm start`. Die Addon-URL für Nuvio lautet `https://cvn-xhamster-catalog.onrender.com/manifest.json`.

## Sprache und Plattformrechte

Deutsche Suchbegriffe, Tags und Titel sind kein Beweis für eine deutsche Tonspur. Das Addon markiert solche Treffer daher nicht als technisch bestätigte Audiosprache. Eine HLS-Tonspur gilt nur dann als technisch deutsch gekennzeichnet, wenn die Playlist eine AUDIO-Rendition mit `LANGUAGE=de` ausweist. Das ersetzt keinen Hörtest.

ThePornDude und andere Verzeichnisse verlinken unabhängige Anbieter; sie erteilen keine Rechte zur Übernahme ihrer Videos. Die recherchierten deutschsprachigen Portale haben bislang keine belastbare Kombination aus deutscher Tonspur, öffentlich spielbarem MP4/HLS und offizieller Nuvio-Einbettungsfreigabe geliefert. Sie werden deshalb nicht als angeblich funktionierende Quellen eingespeist.

## Einschränkungen

xHamster kann HTML-Strukturen, Suchpfade und Medienauslieferung jederzeit ändern. Der Extractor ist deshalb experimentell. Nur HLS-URLs, die bereits direkt in einer öffentlich erreichbaren Videoseite eingebettet sind, werden zurückgegeben. Es gibt keinen Proxy für gesperrte Inhalte.
