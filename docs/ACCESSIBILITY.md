# Accessibility handoff

The site is intended to meet WCAG 2.2 AA after final content and browser testing.

## Implemented foundation

- Semantic landmarks, a skip link, descriptive page titles, and current-page navigation state.
- Keyboard-operable mobile navigation with Escape handling and contained focus while open.
- Focus moves to the new section heading when hash-based navigation changes pages, with a polite screen-reader announcement.
- Visible focus styling across links, buttons, and form controls.
- Reduced-motion support, increased-contrast preferences, Windows forced-colors support, responsive reflow, and minimum-size navigation controls.
- Portal availability and unavailable states are announced without relying on color alone.
- The public contact page does not ask patients to enter health information into an unprotected form.
- The Google map is consent-gated, keyboard operable, and titled when loaded.

## Manual acceptance checks before launch

- Navigate every route and action using only Tab, Shift+Tab, Enter, Space, arrow keys where applicable, and Escape.
- Test at 200% and 400% zoom without horizontal page scrolling at common mobile widths.
- Test VoiceOver/Safari and NVDA/Firefox or NVDA/Chrome, including page changes and portal status messages.
- Confirm text and interactive-state contrast in both themes after final colors and content are locked.
- Confirm that focus is never hidden behind the sticky header or mobile drawer.
- Verify meaningful content remains understandable with animation, background graphics, and custom styles disabled.
- Re-run automated WCAG checks after replacing placeholders or adding a portal vendor widget.

Useful standards and guidance: [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [WAI form guidance](https://www.w3.org/WAI/tutorials/forms/), and [WAI developing tips](https://www.w3.org/WAI/tips/developing/).
