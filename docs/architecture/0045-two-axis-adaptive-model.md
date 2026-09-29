# ADR-0045: Zwei-Achsen-Adaptives Modell — eine App, keine getrennten Systeme

**Status:** Accepted
**Date:** 2026-06-04
**Slice:** cross-cutting
**Category:** UI-Architektur

## Context

Das Projekt hielt ursprünglich (docs/backlog.md, Stable Directions) die Richtungsentscheidung
"Desktop after mobile; two separate interaction systems": Mobile und Desktop als zwei
getrennte Systeme, getrennt nach **Eingabetyp** (Touch vs. Mouse/Keyboard), Desktop als
nachgelagerter separater Block. Parallel entstand eine Frage: Wie soll die App zwischen
mobiler und Desktop-Ansicht wechseln, und wie wird das Gerät detektiert?

Diese Framing-Entscheidung zeigte Schwächen:
- Moderne Geräte verwischen die alte Mobile/Desktop-Grenze (Touch-Laptops, mausbetriebene
  Phones, Tablets mit Tastatur).
- Das Detektierungs- und Versionswechsel-Problem ist prinzipiell schwer lösbar — es gibt
  keinen zuverlässigen automatischen Mechanismus, der alle Hybridgeräte korrekt klassifiziert.
- "Request Desktop Site" auf iOS ändert nur den User-Agent-String, nicht den physischen
  Viewport und nicht die `pointer`-Media-Query — ein UA-basierter Switch wäre unzuverlässig.

## Decision

Die App ist **EINE adaptive Anwendung** — keine getrennten Versionen, kein Versions-Switch.
Die Präsentation adaptiert sich entlang **zwei unabhängiger Achsen**:

### Axis 1 — Screen Format (räumliches Layout)

Bestimmt, **wo** Elemente sitzen. Schmal/Hochformat → Dock-Leiste unten, Daumenzone.
Breit/Querformat → Side-Rail, mehr Gleichzeitigkeit, weniger "Reach"-basiertes Layout.
Dies ist die responsive Achse (CSS-Breakpoints).

**Wichtig:** Die Dock-Kanten-Position (Bottom-Bar vs. Side-Rail) hängt vom **Screen-Format**
ab, NICHT vom Eingabetyp. Ein Phone, das per Maus bedient wird, behält seine Bar unten —
weil eine Side-Rail im schmalen Hochformat ungeeignet ist, nicht weil es Touch ist.

### Axis 2 — Input Type (additive Fähigkeiten)

Bestimmt, **was** man tun kann, ohne das räumliche Layout zu verändern. Touch ist immer die
Basis (funktioniert überall): Gesten (Swipe, Long-Hold), große Targets. Wenn Maus/Tastatur
vorhanden ist, kommen **ZUSÄTZLICHE** Fähigkeiten hinzu: Hover-Tooltips, Rechtsklick-Menüs,
Tastaturkürzel. Progressive Enhancement, keine separate Version.

### Unabhängigkeit der Achsen

Alle vier Kombinationen ergeben Sinn: schmal+Touch, schmal+Maus, breit+Touch, breit+Maus.
Der aktuelle Mobile-Prototyp ist die "schmal + Touch"-Region; der bestehende App-Code ist
die "breit + Maus"-Region. Beide sind Regionen EINER adaptiven App.

### Boundary zu ADR-0032

Axis-1-Frame-Layout-Adaptation (wo Sidebar/Bands sitzen, abhängig vom Screen-Format) ≠
das Pad-Grid-Column-Reflow, das ADR-0032 adressiert. ADR-0032 verbietet automatisches
Reflow der **Pad-Grid-Spaltenanzahl** (die Pads selbst). Axis 1 betrifft das **umgebende
Frame-Layout**. Beide sind unabhängig; kein Widerspruch.

### Dichte / Target-Größe

"Dichtere Targets" gehört zu Axis 1 (Screen-Größe → größere Screens ermöglichen dichtere
Layouts), NICHT zu Axis 2 (Eingabetyp). Die Touch-Mindestgröße (~44 px) gilt als Basis
für alle Inputs. Eine Maus trifft große Targets problemlos; keine eingabetyp-getriebene
Dichte-Änderung ist angenommen. Wenn dichtere Layouts je gewünscht werden, gehören sie
in Axis 1, Large-Screen — nicht hier eingebaut.

### Detektierung

- **Screen-Format (Axis 1):** Standard-CSS-Breakpoints. Exakte Schwellenwerte werden
  empirisch auf echten Geräten bestimmt — noch nicht festgelegt.
- **Eingabetyp (Axis 2):** `pointer: coarse/fine` und `hover`-Media-Queries / Pointer
  Events API. Das ist der etablierte, zuverlässige Web-Standard.
- **Nicht verwendbar:** Browser-UA-basierter Switch ("Request Desktop Site" auf iOS
  ändert nur den UA, Viewport und `pointer`-Query bleiben unverändert — unzuverlässig
  und unnötig unter dem adaptiven Modell).

## Consequences

**Positiv:**
- Das Detektierungs- und Versions-Switch-Problem löst sich auf: keine exklusiven Versionen
  → nichts zu wechseln, nichts falsch zu detektieren.
- Hybridgeräte (Touch-Laptop, Maus am Tablet) werden korrekt behandelt: Achse 1 adaptiert
  das Layout, Achse 2 schaltet Extras dazu — kein falsches Einordnen in eine Kategorie.
- Bestehender Desktop-App-Code und der Mobile-Prototyp sind bereits zwei Regionen der
  ONE App; keine Parallelentwicklung zweier Systeme.
- Klares Verantwortungsprinzip: "Ändert sich wo etwas sitzt?" → Axis 1. "Kommt eine
  Aktion hinzu?" → Axis 2.

**Negativ / Trade-offs:**
- Die exakten Breakpoint-Schwellenwerte (ab wann die Sidebar von unten nach links wandert)
  sind noch nicht festgelegt — empirische Kalibrierung auf echten Geräten nötig.
- Bestehende Code- und Design-Artefakte, die die alte Zweiteilung implizieren, müssen
  sukzessive angepasst werden (eine Arbeit, die mit dem Einwachsen des Mobile-Prototyps
  in die App einsetzt).

## Alternatives Considered

**Zwei separate Systeme (verworfen):** Ursprüngliche Richtung — Mobile und Desktop als
getrennte Systeme, getrennt nach Eingabetyp. Verworfen, weil Hybridgeräte keiner Kategorie
sauber zugeordnet werden können und das Detektierungs-/Switch-Problem prinzipiell unlösbar
ist.

**UA-basierter Switch:** "Request Desktop Site" als Auslöser. Verworfen: iOS ändert nur den
UA-String, nicht Viewport und `pointer`-Query — falsch positiv auf dem häufigsten Anwendungsfall.

## Related

- **ADRs:** ADR-0006 (Plattform-Targets, API-Verfügbarkeit), ADR-0032 (Pad-Grid 4 Spalten
  konstant — grenzabgrenzung zu Axis 1, siehe oben)
- **BACKLOG:** §Stable Directions → "Two-axis adaptive model" (ersetzt "Desktop after mobile;
  two separate interaction systems")
- **Dokumente:** `docs/backlog.md §Stable Directions`
