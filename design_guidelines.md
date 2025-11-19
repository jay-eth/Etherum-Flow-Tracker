# Ethereum Transaction Flow Tracker - Design Guidelines

## Design Approach

**Selected Framework:** Material Design with blockchain explorer aesthetics (Etherscan, Blockchair)
**Rationale:** Information-dense, data-focused application requiring clarity, scannable layouts, and custom visualization components. Material Design provides robust patterns for dashboards while allowing customization for blockchain-specific elements.

---

## Core Design Elements

### Typography
- **Primary Font:** Inter (Google Fonts) - exceptional readability for data-heavy interfaces
- **Monospace Font:** JetBrains Mono - for addresses, hashes, and numerical data
- **Hierarchy:**
  - H1: 2.5rem/2xl (Dashboard title)
  - H2: 1.75rem/xl (Section headers)
  - H3: 1.25rem/lg (Card titles, panel headers)
  - Body: 0.875rem/sm (Transaction details, labels)
  - Mono: 0.8125rem/xs (Addresses, hashes - always monospace)

### Layout System
**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16
- Component padding: p-4, p-6
- Section gaps: gap-6, gap-8
- Card spacing: m-4, p-6
- Tight data rows: py-2, px-4

**Grid Structure:**
- Main container: max-w-7xl mx-auto px-4
- Two-column layout for desktop: 70% visualization / 30% details panel
- Single column stack on mobile/tablet

---

## Component Library

### Header/Navigation
- Fixed top bar with app title and utilities
- Search bar prominently centered (60% width on desktop)
- Input field with monospace font for address/hash entry
- Validation indicators (checkmark/error icon inline)
- Theme toggle (sun/moon icon) positioned top-right

### Transaction Flow Visualization (Centerpiece)
- Large canvas area (min-height: 600px on desktop)
- Node-based diagram showing transaction relationships
- Center node: Queried address (larger, emphasized)
- Connected nodes: Related transactions with directional arrows
- Each node displays: truncated address, ETH amount, timestamp
- Zoom controls overlay (bottom-right corner)
- Pan/drag interaction affordance (cursor changes)

### Transaction Details Panel
- Sticky sidebar (on desktop) or bottom sheet (mobile)
- Segmented sections with clear dividers:
  - Transaction Hash (copyable with icon)
  - Block Number & Confirmations
  - Timestamp (human-readable + Unix)
  - Value & Gas Fees (prominent display)
  - From/To Addresses (truncated with copy buttons)
  - Status badge (success/pending/failed)

### Data Display Components
- **Cards:** Elevated (shadow-md), rounded-lg, p-6
- **Tables:** Striped rows, sticky headers, monospace for addresses
- **Badges:** Rounded-full, text-xs, px-3 py-1 (for status indicators)
- **Copy Buttons:** Icon-only, hover to show tooltip, positioned inline with addresses

### Empty/Loading States
- Skeleton loaders for data fetching (pulsing rectangles matching content shape)
- Empty state: Centered illustration placeholder with instructional text
- Error state: Warning icon with retry button

### Input Validation
- Real-time validation as user types
- Visual feedback: Border change + inline message
- Supported formats clearly indicated (placeholder text)
- Example addresses/hashes shown below input

---

## Layout Specifications

### Desktop (≥1024px)
```
┌─────────────────────────────────────────┐
│  Header (Search Bar + Controls)         │
├──────────────────────┬──────────────────┤
│                      │                  │
│  Transaction Flow    │  Details Panel   │
│  Visualization       │  (Sticky)        │
│  (70%)              │  (30%)           │
│                      │                  │
└──────────────────────┴──────────────────┘
```

### Mobile/Tablet (<1024px)
- Stack vertically
- Search bar: Full width with compact padding
- Visualization: Responsive height (400px min)
- Details panel: Collapsible accordion below graph

---

## Interaction Patterns

### Transaction Flow Interactions
- Click node: Load details in side panel
- Hover node: Highlight + show tooltip with full data
- Double-click node: Expand to show that address's flow
- Pinch/scroll: Zoom in/out
- Drag: Pan around canvas

### Data Interactions
- Address/Hash hover: Show copy icon
- Click copy: Visual confirmation (checkmark animation)
- External links: Open Etherscan in new tab (icon indicator)

---

## Animations
**Minimal & Purposeful Only:**
- Node hover: Scale 1.05 with 150ms ease
- Copy confirmation: Checkmark fade-in 200ms
- Panel transitions: Slide 300ms ease-out
- Loading skeletons: Pulse 1.5s infinite
- **NO scroll animations, parallax, or decorative motion**

---

## Icons
**Library:** Heroicons (via CDN) - outline style for UI, solid for badges
- Search: magnifying-glass
- Copy: clipboard-document
- External link: arrow-top-right-on-square
- Theme toggle: sun/moon
- Status: check-circle, exclamation-circle, clock

---

## Images
**No hero images.** This is a pure utility dashboard - every pixel serves data visualization and functionality.

---

## Accessibility
- All addresses/hashes: monospace font, sufficient contrast
- Copy buttons: Visible focus states, keyboard accessible
- ARIA labels for icon-only buttons
- Keyboard navigation through transaction nodes (tab order)
- Screen reader announcements for data updates

---

## Key Design Principles
1. **Data First:** Maximize information density without clutter
2. **Scannable:** Use whitespace and typography to create clear visual hierarchy
3. **Trustworthy:** Monospace fonts and precise alignment convey accuracy
4. **Fast Feedback:** Immediate validation and loading states
5. **Professional:** Blockchain tools demand technical aesthetics - clean, precise, functional