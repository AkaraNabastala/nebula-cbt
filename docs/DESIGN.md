# AkaraNabastala CBT — Design Direction

## 1. Product Identity

- Product name: AkaraNabastala CBT
- Product type: Computer Based Test platform
- Audience: SD, SMP, SMA, and equivalent education levels
- Primary language: Indonesian
- Brand direction: Clear, calm, trustworthy, simple, and accessible.

## 2. Design Principles

1. Simplicity: show only elements that help users complete their tasks.
2. Performance first: avoid unnecessary decoration and animation.
3. Clarity: use concise labels and familiar language.
4. Accessibility: maintain readable contrast, keyboard access, and visible focus.
5. Responsive: support desktop, laptop, tablet, and mobile.
6. Consistency: use shared design tokens and reusable components.

## 3. Visual Direction

- Initial theme: light mode only.
- Visual inspiration: sky, open space, and sky colors.
- Overall appearance: clean, calm, lightweight, and functional.
- Avoid excessive gradients, shadows, animations, and decorative elements.
- Use Poppins as the primary typeface.

## 4. Color Palette

| Token | Name | Hex |
|---|---|---|
| --color-brand-navy | Deep Sky Navy | #183B5B |
| --color-brand-blue | Sky Blue | #318BCB |
| --color-brand-light | Light Sky | #B9E3FA |
| --color-surface | Cloud White | #F4F8FC |
| --color-white | Pure White | #FFFFFF |

### Color usage

- Deep Sky Navy: primary actions, important text, and strong emphasis.
- Sky Blue: accent elements and non-text visual emphasis.
- Light Sky: subtle highlights and supporting surfaces.
- Cloud White: page background.
- Pure White: cards, panels, and input surfaces.

### Contrast requirements

- Normal text must meet WCAG AA contrast (at least 4.5:1).
- Large text and meaningful UI graphics must meet applicable WCAG AA requirements.
- Do not use Sky Blue (#318BCB) with white text for normal-sized text.
- Verify foreground/background combinations with the Antislop contrast checker.

## 5. Typography

- Primary font: Poppins.
- Available weights: 400, 500, 600, 700.
- Use clear hierarchy and readable sizes.
- Avoid unnecessarily small text.
- Use concise Indonesian labels.

## 6. Interaction

- Keep controls clear and predictable.
- Use visible hover, focus, disabled, loading, success, and error states where relevant.
- Buttons and interactive elements must communicate their purpose.
- Avoid animation unless it provides meaningful feedback.

## 7. Responsive Design

- Support desktop, laptop, tablet, and mobile.
- Prevent horizontal overflow.
- Keep touch targets comfortable on touch devices.
- Reflow layouts according to available screen space.
- Prioritize the exam experience on smaller screens.

## 8. Theme Architecture

- Start with light mode only.
- Implement colors through CSS variables/design tokens.
- Keep component styles independent from hardcoded color values.
- Structure tokens so dark mode can be added later without rewriting components.
- Dark mode is a future enhancement, not part of the initial release.

## 9. Design Dials

- ENERGY: 1
- RHYTHM: 1
- MOTION: 1

The interface should remain calm, consistent, and focused on completing tasks.
