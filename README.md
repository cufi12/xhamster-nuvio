# CVN-xHamster Deutsch für Nuvio

Community-Provider für die normale Filmsuche in Nuvio. Der Provider wird über das Manifest eingebunden; er stellt keine eigene Katalog- oder Browsing-Oberfläche bereit.

## Installation

Manifest-URL:

`https://raw.githubusercontent.com/cufi12/xhamster-nuvio/add-xhamster-provider/manifest.json`

In Nuvio als **Plugin-Repository** hinzufügen – nicht im Bereich „Addons“:

1. In Nuvio **Einstellungen → Inhalt & Entdeckung → Plugins** öffnen.
2. **Repository hinzufügen** wählen und die Manifest-URL oben einfügen.
3. Repository aktualisieren und den Provider **CVN-xHamster Deutsch** in der Providerliste aktivieren.
4. Falls der Provider Einstellungen anbietet, den eigenen TMDB-API-Schlüssel dort eintragen.

Die Menübezeichnungen können je nach App-Version leicht abweichen. Nicht jede Nuvio-Version unterstützt Plugins; bei fehlendem Plugin-Menü zuerst prüfen, ob die installierte App-Version Plugins unterstützt.

## Aktueller Stand

Aktuelle Version: **1.9.8**

- Unterstützt die Nuvio-Plugin-Schnittstelle `getStreams(tmdbId, mediaType)`.
- Unterstützt ausschließlich Filme. `other` wird von NuvioMobile intern als `tv` normalisiert und deshalb bewusst nicht als unterstützter Typ deklariert.
- Bevorzugt HLS-Streams (`.m3u8`).
- Fragt den persönlichen TMDB-API-Schlüssel über die Nuvio-Provider-Einstellungen ab; es ist kein API-Schlüssel im Quellcode hinterlegt.
- Verwendet TMDB-Metadaten zur Titelauflösung und berücksichtigt einen bekannten Alternativtitel.
- Normalisiert Umlaute, Unicode-Zeichen und Leerzeichen bei Titelvergleichen und verlangt bei längeren Titeln eine Mindestübereinstimmung.
- Gibt keine Treffer zurück, wenn Metadaten oder passende Stream-Informationen nicht verfügbar sind.

## Deutsche Sprache: noch nicht verifiziert

Der Provider kann derzeit **nicht feststellen**, ob ein Treffer deutsche Originalsprache, deutsche Synchronisation oder überhaupt eine deutschsprachige Tonspur enthält. Auch der deutsche Such-Host und ein passender Filmtitel sind dafür kein Beleg. Deshalb wird im Manifest keine bestätigte Inhaltssprache mehr deklariert. Der Name „Deutsch“ beschreibt aktuell das Projektziel, nicht eine garantierte Eigenschaft jedes gefundenen Streams.

Ein echter Deutschfilter benötigt verlässliche, öffentlich zugängliche Sprach-/Audio-Metadaten und eine erlaubte Integrationsmethode. Solange diese fehlen, werden Treffer nicht als deutsch verifiziert ausgegeben.

## Wichtige Einschränkungen

Die aktuelle Implementierung ist ein experimenteller Community-Provider und keine offizielle xHamster-Integration. Es gibt derzeit keine bestätigte offizielle API-/RSS-Freigabe oder Partnerschaft.

Der Provider umgeht keine Anmeldung, Altersprüfung, CAPTCHA-, DRM- oder Anti-Bot-Schutzmechanismen. Verfügbarkeit und Wiedergabe hängen von xHamster, Nuvio und den jeweils geltenden Zugriffsbedingungen ab.

## Automatische Prüfungen

GitHub Actions prüft bei Änderungen auf diesem Branch die JavaScript-Syntax, das Manifest und den Provider-Vertrag. Ein simulierter Laufzeittest prüft eine TMDB-Antwort, eine passende Videoseite, einen HLS-Stream, die Ablehnung nicht passender Titel, nicht unterstützte Serien und einen fehlenden API-Schlüssel. Diese Tests ersetzen keinen echten Wiedergabetest innerhalb der Nuvio-App.

## Entwicklung

Aktiver Provider: `providers/xhamster.js`

Änderungen erfolgen auf dem Branch `add-xhamster-provider`. Die Standard- bzw. Hauptbranch wird dadurch nicht verändert.

## Sicherheitshinweis

Ein früher im Quellcode enthaltener TMDB-Schlüssel gilt als offengelegt. Bitte diesen Schlüssel im TMDB-Konto widerrufen bzw. ersetzen. Version 1.9.8 enthält keinen fest eingebauten TMDB-Schlüssel; der neue Schlüssel wird über die Nuvio-Provider-Einstellung `tmdbApiKey` eingegeben.

**Hinweis zur Sichtbarkeit:** Das Provider-Schema markiert das Feld als Passwortfeld (`isPassword: true`). Im aktuell geprüften NuvioMobile-Code wird dieses Merkmal zwar ausgelesen, aber nicht an das Eingabefeld weitergegeben. Der Schlüssel kann deshalb beim Bearbeiten sichtbar sein. Der Eintrag wird von Nuvio lokal als Provider-Einstellung gespeichert; behandle ihn in der App daher weiterhin vertraulich.