# Audio Files

Dieses Verzeichnis sollte die folgenden Sound-Effekt-Dateien enthalten:

## Benötigte Dateien:

- `button-press.mp3` - Sprung-Sound
- `hit.mp3` - Kollisions-Sound (Game Over)
- `score.mp3` - Punkte-Erreichungs-Sound

## Wo bekommst du die Sounds?

### Option 1: Von Chrome extrahieren
Die Sounds sind base64-kodiert im Chrome-Quellcode eingebettet. Du kannst sie über die Chrome DevTools extrahieren.

### Option 2: Eigene Sounds erstellen
Du kannst einfache Sound-Effekte erstellen mit:
- **Audacity** (kostenlos)
- **Online Sound Generatoren**
- **Freesound.org** (freie Sound-Bibliothek)

### Option 3: Web Audio API (Standard)
Das Spiel hat bereits einen Fallback auf generierte Sounds über die Web Audio API. Wenn keine MP3-Dateien vorhanden sind, werden synthetisierte Töne verwendet.

## Sound-Empfehlungen:

- **button-press.mp3**: Kurzer "Bleep" oder "Pop"-Sound (50-100ms)
- **hit.mp3**: Tieferer "Bump" oder "Thud"-Sound (100-200ms)
- **score.mp3**: Positiver "Ding" oder "Chime"-Sound (100-150ms)

Alle Sounds sollten kurz sein und schnell laden (< 10KB pro Datei empfohlen).
