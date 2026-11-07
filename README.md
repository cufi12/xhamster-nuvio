# CVN-xHamster Deutsch für Nuvio

Community-Projekt mit zwei getrennten Komponenten: einem lokalen Nuvio-Stream-Provider und einem eigenständigen Stremio-kompatiblen Katalog-Addon.

## xHamster-Katalog-Addon

Der Katalog ist neu und getrennt vom lokalen Plugin. Er bietet einen Feed, eine Suchfunktion, Videodetails und – sofern eine direkt eingebettete öffentliche HLS-Adresse vorhanden ist – Streams.

**Das Addon ist noch nicht öffentlich bereitgestellt.** Es muss zuerst auf einem Node.js-Host laufen. Ein Render-Blueprint liegt in `render.yaml`. Beim Deployment den Branch `add-xhamster-provider` auswählen. Render soll das Verzeichnis `addon` als Root verwenden und `npm start` ausführen.

Nach erfolgreichem Deployment die vom Host ausgegebene URL mit `/manifest.json` in Nuvio unter **Addons** hinzufügen. Beispiel: `https://DEINE-DOMAIN/manifest.json`. Die GitHub-Raw-Manifest-URL des Nuvio-Plugins ist hierfür nicht geeignet.

Details und lokale Startanleitung: [addon/README.md](addon/README.md).

## Bestehender Nuvio-Stream-Provider

Manifest-URL:

`https://raw.githubusercontent.com/cufi12/xhamster-nuvio/add-xhamster-provider/manifest.json`

In Nuvio als **Plugin-Repository** hinzufügen – nicht im Bereich „Addons“:

1. In Nuvio **Einstellungen → Inhalt & Entdeckung → Plugins** öffnen.
2. **Repository hinzufügen** wählen und die Manifest-URL oben einfügen.
3. Repository aktualisieren und den Provider **CVN-xHamster Deutsch** in der Providerliste aktivieren.
4. Falls der Provider Einstellungen anbietet, den eigenen TMDB-API-Schlüssel dort eintragen.

Die Menübezeichnungen können je nach App-Version leicht abweichen. Nicht jede Nuvio-Version unterstützt Plugins; bei fehlendem Plugin-Menü zuerst prüfen, ob die installierte App-Version Plugins unterstützt.

## Aktueller Stand des Providers

Aktuelle Version: **1.9.9**

- Unterstützt die Nuvio-Plugin-Schnittstelle `getStreams(tmdbId, mediaType)`.
- Unterstützt ausschließlich Filme. `other` wird von NuvioMobile intern als `tv` normalisiert und deshalb bewusst nicht als unterstützter Typ deklariert.
- Bevorzugt HLS-Streams (`.m3u8`) und nutzt direkt veröffentlichte MP4-Streams als Fallback.
- Liest öffentliche xHamster-Player-Metadaten aus `initials-script` und übergibt die erforderlichen Referer-Header an Nuvios Player.
- Fragt den persönlichen TMDB-API-Schlüssel über die Nuvio-Provider-Einstellungen ab; es ist kein API-Schlüssel im Quellcode hinterlegt.
- Verwendet TMDB-Metadaten zur Titelauflösung und berücksichtigt einen bekannten Alternativtitel.
- Normalisiert Umlaute, Unicode-Zeichen und Leerzeichen bei Titelvergleichen und verlangt bei längeren Titeln eine Mindestübereinstimmung.
- Gibt keine Treffer zurück, wenn Metadaten oder passende Stream-Informationen nicht verfügbar sind.

## Deutsche Sprache: noch nicht verifiziert

Der Provider kann derzeit **nicht feststellen**, ob ein Treffer deutsche Originalsprache, deutsche Synchronisation oder überhaupt eine deutschsprachige Tonspur enthält. Auch der deutsche Such-Host und ein passender Filmtitel sind dafür kein Beleg. Deshalb wird im Manifest keine bestätigte Inhaltssprache deklariert. Der Name „Deutsch“ beschreibt aktuell das Projektziel, nicht eine garantierte Eigenschaft jedes gefundenen Streams.

Ein echter Deutschfilter benötigt verlässliche, öffentlich zugängliche Sprach-/Audio-Metadaten und eine erlaubte Integrationsmethode. Solange diese fehlen, werden Treffer nicht als deutsch verifiziert ausgegeben.

## Wichtige Einschränkungen

Beide Komponenten sind experimentelle Community-Integrationen und keine offizielle xHamster-Integration. Es gibt derzeit keine bestätigte offizielle API-/RSS-Freigabe oder Partnerschaft.

Der Katalog und Provider verwenden nur öffentlich erreichbare Seiten und direkt eingebettete Medienadressen. Sie umgehen keine Anmeldung, Altersprüfung, CAPTCHA-, DRM- oder Anti-Bot-Schutzmechanismen. Verfügbarkeit und Wiedergabe hängen von xHamster, Nuvio und den jeweils geltenden Zugriffsbedingungen ab.

## Automatische Prüfungen

GitHub Actions prüft die JavaScript-Syntax des Providers und Katalog-Addons, den Provider-Vertrag sowie simulierte Katalogsuche, Metadaten, ID-Validierung und HLS-Extraktion. Diese Tests ersetzen keinen echten Wiedergabetest innerhalb der Nuvio-App.

## Entwicklung

- Lokaler Nuvio-Provider: `providers/xhamster.js`
- Katalog-Addon: `addon/`

Änderungen erfolgen auf dem Branch `add-xhamster-provider`. Die Standard- bzw. Hauptbranch wird dadurch nicht verändert.

## Sicherheitshinweis

Ein früher im Quellcode enthaltener TMDB-Schlüssel gilt als offengelegt. Bitte diesen Schlüssel im TMDB-Konto widerrufen bzw. ersetzen. Version 1.9.9 enthält keinen fest eingebauten TMDB-Schlüssel; der neue Schlüssel wird über die Nuvio-Provider-Einstellung `tmdbApiKey` eingegeben.

**Hinweis zur Sichtbarkeit:** Das Provider-Schema markiert das Feld als Passwortfeld (`isPassword: true`). Im aktuell geprüften NuvioMobile-Code wird dieses Merkmal zwar ausgelesen, aber nicht an das Eingabefeld weitergegeben. Der Schlüssel kann deshalb beim Bearbeiten sichtbar sein. Der Eintrag wird von Nuvio lokal als Provider-Einstellung gespeichert; behandle ihn in der App daher weiterhin vertraulich.
