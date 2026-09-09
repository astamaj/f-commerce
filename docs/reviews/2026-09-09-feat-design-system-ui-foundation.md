# Review, feat/design-system-ui-foundation, 2026-09-09

**Reviewed by**: GitHub Copilot (author on Opus; contrasting Sonnet unavailable)
**Scope**: 130 files, branch vs main
**Verdict**: Changes requested

## Summary

This change replaces the generated page with a seller console foundation, including responsive navigation, theme support, shared primitives, and frontend tooling. The desktop shell is structured clearly, but the mobile navigation still renders labels and the shared overlay behavior does not implement the focus trap required by the UI specification. The current tests cover the dashboard and theme toggle, but not the new overlay and primitive accessibility contracts.

## Major

### 🟠 Mobile navigation still renders labels, `frontend/src/components/shell/shell.tsx:67`

**Problem**: The mobile route links always render `<span>{item.label}</span>`, and the mobile More button also renders a visible `More` label at line 177. The mobile navigation therefore remains icon and text based instead of icons only.
**Why it matters**: This directly violates the requested mobile navigation behavior and makes the five item bottom bar less compact on small screens.
**Suggested fix**: Hide the route and More labels in the mobile bottom navigation while retaining accessible names through the link text or an appropriate screen reader only label.

### 🟠 Overlay focus is not trapped, `frontend/src/components/ui/primitives.tsx:232`

**Problem**: `useOverlay` focuses the dialog or sheet and handles Escape, but it does not keep Tab and Shift Tab inside the open overlay. Focus can move to the page behind the modal.
**Why it matters**: The governing UI specification requires dialogs and sheets to trap focus. Keyboard and assistive technology users can lose their place and interact with background controls while the modal is open.
**Suggested fix**: Add focus containment for both forward and reverse tab navigation, and verify focus returns to the trigger after close.

## Minor

### 🟡 Primitive accessibility behavior is not covered by tests, `frontend/src/app/page.test.tsx:20`

**Problem**: The changed test file covers dashboard rendering and theme switching, but there are no assertions for overlay focus containment, Escape dismissal, focus restoration, form labels, live regions, reduced motion, or the other primitive contracts listed in AC 3 and AC 5.
**Why it matters**: The configured Vitest suite will not detect regressions in the shared primitives that later screens depend on.
**Suggested fix**: Add focused primitive tests for the specified keyboard, focus, labeling, live region, theme, and reduced motion behavior.

## Strengths

- The seller shell separates desktop and mobile navigation surfaces and uses semantic navigation labels.
- The frontend test and type checking setup is wired into the workspace and the theme toggle has a meaningful interaction assertion.

## Test coverage

Tests are configured with Vitest and Playwright. The current unit tests cover the dashboard surface and theme switching. The browser test checks the dashboard and responsive navigation presence, but does not assert the mobile labels are hidden or exercise overlay keyboard behavior. Runtime verification previously confirmed the mobile labels remained visible at a 390 by 844 viewport.

This review was performed inline by GitHub Copilot because the requested Sonnet reviewer was unavailable in this session. For an independent second opinion from a different provider, switch your model with `/model` or paste the diff into another assistant and rerun the review.
