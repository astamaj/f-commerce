---
name: quiet-operational-studio
source: derived
tokens: 'real values live in src/app/globals.css; read them there, never duplicate them'
contrast: 'verified in the implementation pass for light and dark semantic pairs'
---

## Build mandate

Build the seller console as a calm, precise workspace for repeated order work. Every surface should feel complete, useful, and branded, with clear loading, empty, error, and success states. Prefer an intentional hierarchy over decoration, and keep every action close to the information it changes.

## Character and direction

The visual language is a quiet operational studio. Near black ink, cool sky accents, and restrained surfaces create confidence without making the interface feel heavy. Comfortable spacing gives records room to breathe, while IBM Plex Mono marks values that sellers scan or compare.

## Composition patterns

Authenticated screens use the seller shell with a stable desktop sidebar or mobile bottom navigation. Page content starts with a concise title and context, then moves into actions, filters, and the primary record surface. Cards frame focused tools and repeated records, while broad page sections stay unframed. Empty states explain what to do next, and errors offer recovery.

## Component and usage rules

Use semantic HTML and the shared primitives in `src/components/ui`. Keep primary actions in sky, use signal colors only with text or icon meaning, and reserve elevation for focused tools. Use compact status pills, comfortable control sizing, and direct Lucide imports for icons. Do not add raw color values or one off spacing to feature components.

## Responsive and accessibility direction

Start from the smallest screen. Use cards with priority fields for dense records on small screens and tables on wider screens. Navigation uses a desktop sidebar and mobile bottom bar, with safe area padding on mobile. Every interactive target remains at least 44 by 44 CSS pixels. Keyboard focus, semantic labels, screen reader announcements, color contrast, and reduced motion are part of the component contract.
