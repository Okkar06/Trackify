# Trackify Frontend Page Design (Desktop-first)

## Global Styles (Design Tokens)
- Background: #0A0A0A
- Surface/Card: #181818
- Border: #2A2A2A
- Text primary: #FFFFFF
- Text secondary: #A1A1A1
- Accent: monochrome only (use white/gray variants; no bright colors)
- Radius: 12px (cards), 10px (inputs/buttons)
- Shadow: very subtle (or none) to keep premium minimal
- Typography: Inter/system; clear hierarchy (H1 24–28, H2 18–20, body 14–16)
- Buttons: solid (white text on near-black or inverse), clear hover (slightly lighter border/surface), disabled uses reduced opacity
- Links: underline on hover; otherwise subtle gray

## Shared Layout: SidebarLayout
### Layout
- Desktop: CSS Grid `grid-cols-[280px_1fr]` or Flexbox with fixed-width sidebar.
- Main area: `min-h-screen` with padding container (24px) and content max width (e.g., 1200–1280px).
- Responsive: below ~1024px, sidebar collapses to icon rail or becomes overlay drawer; content remains full width.

### Structure
1. Left Sidebar (persistent)
   - Brand/logo (top)
   - Primary nav items (Dashboard, Style Guide)
   - Active item state (border/indicator + stronger text)
2. Header (in main content)
   - Page title (left)
   - Reserved action slot (right; placeholders only)
3. Content area
   - Stacked sections; cards arranged in simple grids

### Interaction states
- Sidebar item: default / hover / active
- Focus styles: visible focus ring (gray/white) for keyboard accessibility

---

## Page: App Shell (Dashboard)
### Meta Information
- Title: “Trackify — Dashboard”
- Description: “Trackify UI foundation dashboard placeholder.”
- Open Graph: title + description (no image required yet)

### Page Structure
- Uses SidebarLayout.
- Content uses a stacked layout:
  1. KPI card row (3 cards)
  2. Recent activity table placeholder (single card)
  3. Notes/empty state card

### Sections & Components
- KPI Cards
  - Card header (label) + large value text
  - Secondary helper text beneath
- Table Placeholder
  - Header row + 3–5 sample rows using muted borders
- Empty State
  - Short message + secondary button (disabled) showing future intent

---

## Page: UI Style Guide
### Meta Information
- Title: “Trackify — UI Style Guide”
- Description: “Monochrome theme tokens and component previews.”
- Open Graph: title + description

### Page Structure
- Uses SidebarLayout.
- Main content is a vertical documentation layout with section anchors:
  1. Colors
  2. Typography
  3. Buttons
  4. Inputs
  5. Cards & layout

### Sections & Components
- Token Swatches
  - Small blocks for bg/surface/border/text with hex values
- Component Gallery
  - Buttons: default/hover/disabled
  - Inputs: default/focus/error (error can remain monochrome with border change)
  - Cards: normal vs “dense” spacing
- Layout Examples
  - 2-column form layout (desktop)
  - 3-column card grid (desktop)

---

## Page: Not Found
### Meta Information
- Title: “Trackify — Not Found”
- Description: “The page you’re looking for doesn’t exist.”
- Open Graph: title

### Page Structure
- Centered card layout (no complex content)
- Primary CTA back to Dashboard

### Sections & Components
- Title + short explanation text
- Primary button: “Go to Dashboard”
- Secondary link: “Back” (optional)