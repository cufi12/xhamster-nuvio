# CVN-xHamster Deutsch für Nuvio

Community-Provider für die normale Filmsuche in Nuvio. Der Provider wird über das Manifest eingebunden; er stellt keine eigene Katalog- oder Browsing-Oberfläche bereit.

## Installation

Manifest-URL:

`https://raw.githubusercontent.com/cufi12/xhamster-nuvio/add-xhamster-provider/manifest.json`

In Nuvio bzw. einer kompatiblen Nuvio-basierten App als Plugin-Manifest hinzufügen.

## Aktueller Stand

Aktuelle Version: **1.9.3**

- Unterstützt die Nuvio-Plugin-Schnittstelle `getStreams(tmdbId, mediaType)`.
- Sucht derzeit nur bei Filmen bzw. `other`; Serien werden nicht unterstützt.
- Bevorzugt HLS-Streams (`.m3u8`).
- Fragt den persönlichen TMDB-API-Schlüssel über die Nuvio-Provider-Einstellungen ab; es ist kein API-Schlüssel im Quellcode hinterlegt.
- Verwendet TMDB-Metadaten zur Titelauflösung und berücksichtigt einen bekannten Alternativtitel.
- Normalisiert Umlaute, Unicode-Zeichen und Leerzeichen bei Titelvergleichen korrekt und verlangt bei längeren Titeln eine Mindestübereinstimmung, um zufällige Treffer zu reduzieren.
- Gibt keine Treffer zurück, wenn Metadaten oder passende Stream-Informationen nicht verfügbar sind.

## Wichtige Einschränkungen

Die aktuelle Implementierung ist ein experimenteller Community-Provider und keine offizielle xHamster-Integration. Es gibt derzeit keine bestätigte offizielle API-/RSS-Freigabe oder Partnerschaft.

Titelähnlichkeit allein kann **nicht zuverlässig** belegen, dass ein Treffer eine professionelle Studio-Produktion ist oder deutsche Originalsprache bzw. Synchronisation enthält. Diese Filter dürfen daher nicht als garantiert dargestellt werden. Eine verlässliche Umsetzung benötigt entsprechende, offiziell zugängliche Metadaten und eine von xHamster erlaubte Integrationsmethode.

Der Provider umgeht keine Anmeldung, Altersprüfung, CAPTCHA-, DRM- oder Anti-Bot-Schutzmechanismen. Verfügbarkeit und Wiedergabe hängen von xHamster, Nuvio und den jeweils geltenden Zugriffsbedingungen ab.

## Entwicklung

Aktiver Provider: `providers/xhamster.js`

Änderungen erfolgen auf dem Branch `add-xhamster-provider`. Die Standard- bzw. Hauptbranch wird dadurch nicht verändert.


## Sicherheitshinweis

Ein früher im Quellcode enthaltener TMDB-Schlüssel gilt als offengelegt. Bitte diesen Schlüssel im TMDB-Konto widerrufen bzw. ersetzen. Version 1.9.3 enthält keinen fest eingebauten TMDB-Schlüssel; der neue Schlüssel wird über die geschützte Provider-Einstellung `tmdbApiKey` eingegeben.
