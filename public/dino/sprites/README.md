# Sprite Images

Dieses Verzeichnis sollte die folgenden Sprite-Dateien enthalten:

## Benötigte Dateien:

- `sprite-1x.png` - Standard-Auflösung Sprite-Sheet (ca. 1200x68 px)
- `sprite-2x.png` - High-DPI Sprite-Sheet (ca. 2400x136 px)

## Wo bekommst du die Sprites?

### Option 1: Von Chrome extrahieren
Die originalen Chrome Dino Sprites findest du in:
```
chrome://dino/
```
Öffne Chrome DevTools (F12), gehe zu "Network" und lade die Seite neu. Suche nach den Bild-Dateien.

### Option 2: Von GitHub herunterladen
Suche nach "chrome dino sprites" auf GitHub. Es gibt mehrere Repositories mit den Original-Sprites:
- https://github.com/wayou/t-rex-runner (enthält die Original-Assets)
- https://chromium.googlesource.com/chromium/src (Chromium Source Code)

### Option 3: Eigene Sprites erstellen
Du kannst auch eigene Sprites erstellen, solange sie das gleiche Layout wie die Original-Chrome-Sprites haben.

## Sprite-Layout

Das Sprite-Sheet enthält alle Spiel-Grafiken in einer Datei:
- T-Rex (stehend, laufend, springend, geduckt, tot)
- Kakteen (klein, mittel, groß)
- Pterodaktylen (verschiedene Animationsphasen)
- Wolken
- Boden/Horizont
- Sterne und Mond (für Nachtmodus)
- "GAME OVER" Text
- Neustart-Button

Bis du die echten Sprites hast, wird das Spiel mit fehlenden Grafiken laufen (nur Kollisionsboxen werden funktionieren).
