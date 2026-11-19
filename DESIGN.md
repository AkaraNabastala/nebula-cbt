# Nebula CBT interface direction

## Product
Nebula CBT is the computer-based testing product by AkaraNabastala.
The interface serves administrators, teachers, and students.

## Existing brand direction retained
- Navy `#183B5B` remains the primary brand color.
- Blue `#318BCB` remains the interaction accent.
- Poppins remains the existing interface typeface.
- Light and dark themes remain supported.
- The interface prioritizes readable information density and short task paths.

## Design read
Authenticated CBT workspace for school administrators, teachers, and students.
A confident academic workspace with a richer focal point, clear hierarchy, and restrained motion.
ENERGY 2 / RHYTHM 2 / MOTION 1.

## Performance decisions
- Sonner is used as one lightweight notification layer for action feedback; no additional UI framework is introduced.
- No remote fonts or third-party runtime scripts.
- No large decorative hero media in authenticated screens.
- Role dashboards render only the current user's relevant overview.
- Visible navigation points only to implemented, role-appropriate screens; unfinished capabilities are not presented as active controls.
- The workspace header remains sticky at the top during scrolling, while the desktop sidebar stays independently anchored.
- Mobile workspace navigation uses a compact disclosure menu instead of squeezing the desktop navigation row.


## Information architecture refinement
- A screen owns one primary administrative task. Academic years, subjects, and classes are separate destinations rather than tabs inside one mixed page.
- Student enrollment and teacher assignment are separate destinations because they have different actors, inputs, and lifecycle actions.
- Sidebar groups follow the user's work: Users, Academic, CBT, and System. Account settings remain a distinct destination.
- Desktop uses a compact, persistent sidebar; mobile uses the same groups inside a left-side drawer.
- Each data page has one clear heading, a short explanation, its primary action, and one focused list. Creation forms live in dialogs, not stacked inline panels.

## Initial setup
- Institution identity, optional logo, education level, and optional departments are collected in a one-time setup screen before the admin workspace opens.
- The education level is locked after setup; the setup screen is not exposed as a routine navigation destination.

## Dialog behavior
- Native modal dialogs are centered in the viewport at all breakpoints.
- The backdrop uses a dark scrim and restrained blur to separate the active task from the workspace.
- Dialog height is bounded by the dynamic viewport; long forms scroll inside the dialog rather than moving the page behind it.
- Native Escape behavior, backdrop dismissal, focus management, and visible close controls are retained.

## Layout character
- Keep the navy brand panel as a strong anchor, use blue only for active navigation and key actions, and give data surfaces clear grouping.
- Avoid turning every data block into a card. Lists and tables remain flat when they represent repeated records.
- Prioritize one task per screen, clear page titles, and a shorter path to the main action over decorative dashboard metrics.
