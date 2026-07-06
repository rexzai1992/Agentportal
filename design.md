# Travel Agent UI Design Guide

This document describes the visual design system for the Travel Agent OTA app. It covers layout, styling, colors, buttons, tabs, forms, motion, and page composition only. Backend and database architecture are intentionally out of scope.

## Design Direction

Travel Agent is an operations dashboard for admins, agents, partners, finance users, and gate staff. The interface should feel clear, fast, and work-focused: easy to scan, easy to act on, and calm during repeated daily use.

The current style is a soft bento dashboard:

- Light neutral workspace background.
- White translucent cards.
- Emerald as the main action and success color.
- Slate for text, navigation, and secondary actions.
- Amber and red reserved for warning and destructive states.
- Rounded pill controls and large rounded cards.
- Minimal motion through transitions, hover states, and skeleton loading.

## Core UI Files

- Global styles: `frontend/app/globals.css`
- App shell and navigation: `frontend/components/layout/app-shell.tsx`
- Protected page wrapper: `frontend/components/layout/protected-shell.tsx`
- UI primitives: `frontend/components/ui/*`
- Shared fetch helper: `frontend/lib/fetcher.ts`
- Session-aware UI routing: `frontend/hooks/use-session.ts`

## Layout System

### Page Frame

All protected pages should render inside `ProtectedShell`, which wraps content with `AppShell`.

Use this structure for authenticated pages:

```tsx
<ProtectedShell
  roles={["ADMIN"]}
  title="Page Title"
  subtitle="Short page purpose"
>
  <PageContent />
</ProtectedShell>
```

The shell provides:

- Fixed left sidebar.
- Page header with title and subtitle.
- User identity chip.
- Role-aware navigation.
- Consistent page padding and max width.

### Content Width

The main app container uses:

- `max-w-[1480px]`
- `px-3 py-3` on mobile
- `sm:px-5 sm:py-5` on larger screens

Use dense, practical layouts. Avoid marketing-style hero sections inside the app.

### Grid Patterns

Use `bento-grid` for repeated sections:

```tsx
<section className="bento-grid lg:grid-cols-[1fr_1fr]">
  ...
</section>
```

Common grid rules:

- Use `grid gap-3` for compact forms.
- Use `sm:grid-cols-2` for two-column forms.
- Use `xl:grid-cols-4` for metric cards.
- Wrap tables in `overflow-x-auto` for mobile.

## Color System

Defined in `frontend/app/globals.css`:

```css
:root {
  --background: 240 244 246;
  --foreground: 15 23 42;
  --card: 255 255 255;
  --muted: 100 116 139;
  --primary: 16 185 129;
  --secondary: 30 41 59;
  --warning: 245 158 11;
  --danger: 220 38 38;
}
```

### Semantic Usage

- Primary action: emerald `bg-emerald-500`, hover `bg-emerald-600`.
- Secondary action: slate `bg-slate-900`, hover `bg-slate-800`.
- Neutral surface: white or `bg-white/90`.
- Muted text: `text-slate-500`.
- Main text: `text-slate-900`.
- Success badge/state: emerald.
- Warning badge/state: amber.
- Danger/error/destructive: red.

Do not introduce new dominant brand colors without updating this file.

## Background

The app background uses soft radial gradients over a light neutral base:

```css
body {
  background:
    radial-gradient(circle at 4% 8%, rgba(16, 185, 129, 0.22), transparent 24%),
    radial-gradient(circle at 96% 8%, rgba(15, 23, 42, 0.14), transparent 24%),
    radial-gradient(circle at 85% 88%, rgba(245, 158, 11, 0.16), transparent 32%),
    rgb(var(--background));
}
```

Keep background decoration subtle. Do not add extra decorative blobs or unrelated illustration layers inside dashboard pages.

## Typography

Font:

- `Plus Jakarta Sans`
- Loaded in `frontend/app/layout.tsx`

Recommended hierarchy:

- Page title: `text-2xl font-bold sm:text-3xl`
- Section title: `section-title`
- Card labels: `text-sm font-medium`
- Table headers: `text-xs uppercase tracking-wide text-slate-500`
- Body/table text: `text-sm`
- Muted helper text: `muted`

Avoid oversized display type inside admin/agent screens. These pages are tools, not landing pages.

## Shape, Radius, and Surface

Current radius language:

- Main cards: `rounded-3xl`
- Buttons/forms: `rounded-2xl`
- Sidebar nav items: `rounded-xl`
- Badges: `rounded-full`
- Modal: `rounded-3xl`

Main card utilities:

```css
.card {
  @apply rounded-3xl border border-white/70 bg-white/90 shadow-[0_14px_40px_-26px_rgba(15,23,42,0.7)] backdrop-blur;
}

.bento-card {
  @apply rounded-3xl border border-white/70 bg-white/90 p-5 shadow-[0_14px_40px_-26px_rgba(15,23,42,0.7)] backdrop-blur;
}
```

Use `Card` for contained panels and repeated page sections. Avoid putting cards inside cards unless the inner element is a genuine item tile or modal content.

## Buttons

Use `frontend/components/ui/button.tsx`.

Base style:

```tsx
"inline-flex min-h-10 items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition"
```

### Variants

Primary:

- Use for main save, submit, login, create, confirm actions.
- Style: emerald background, white text, emerald shadow.

Secondary:

- Use for strong secondary actions.
- Style: slate background, white text.

Ghost:

- Use for toolbar actions, pagination, sidebar logout, less important actions.
- Style: white surface, slate text, subtle ring.

Danger:

- Use for delete, reject, cancel, destructive flows.
- Style: red background, white text.

### Button Rules

- Buttons should be verbs: `Submit`, `Save`, `Approve`, `Reject`, `Generate`.
- Use loading text for async actions: `Saving...`, `Submitting...`.
- Keep destructive buttons visually distinct with `variant="danger"`.
- For icon-only buttons, include `aria-label` and `title`.
- Keep button height stable; do not let loading states resize the button.

## Tabs

Use `frontend/components/ui/tabs.tsx`.

Current tab style:

- Container: `inline-flex rounded-2xl bg-slate-100 p-1`
- Active tab: `bg-white text-emerald-700 shadow-sm`
- Inactive tab: `text-slate-500 hover:text-slate-800`
- Tab button: `rounded-xl px-4 py-2 text-sm font-semibold transition`

Use tabs for peer views inside the same workflow, for example:

- Report type filters.
- Status groups.
- Payment review stages.
- Agent/partner split views.

Do not use tabs for primary app navigation; that belongs in the sidebar.

## Forms

Inputs, selects, and textareas share the same visual language:

- Full width.
- Rounded `2xl`.
- `border-slate-200`.
- `bg-white/95`.
- `text-sm text-slate-900`.
- Emerald focus ring.

Example:

```tsx
<Input
  value={form.title}
  onChange={(event) => setForm({ ...form, title: event.target.value })}
/>
```

Form layout:

- Use labels above inputs.
- Use `grid gap-3`.
- Use `sm:grid-cols-2` for paired fields.
- Use `sm:col-span-2` for full-width fields such as upload or description.
- Place validation errors above the affected form group or at the top of the card.

Error style:

```tsx
<p className="rounded-xl bg-red-50 p-2 text-sm text-red-600">
  Error message
</p>
```

## Tables

Use tables for scan-heavy admin data.

Recommended table style:

```tsx
<div className="overflow-x-auto">
  <table className="min-w-full text-sm">
    <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
      ...
    </thead>
    <tbody>
      <tr className="border-t border-slate-100">
        ...
      </tr>
    </tbody>
  </table>
</div>
```

Table rules:

- Headers are uppercase and muted.
- Primary row text uses `font-medium text-slate-800`.
- Secondary row text uses `text-slate-600`.
- Status values use `Badge`.
- Always wrap wide tables in `overflow-x-auto`.
- Keep action columns compact.

## Badges And Status

Use `frontend/components/ui/badge.tsx`.

Tones:

- `default`: neutral/inactive/general.
- `success`: active/paid/approved.
- `warning`: pending/needs review.
- `danger`: expired/rejected/failed.

Examples:

```tsx
<Badge tone="success">ACTIVE</Badge>
<Badge tone="warning">PENDING</Badge>
<Badge tone="danger">EXPIRED</Badge>
```

Keep badge labels short and uppercase when they mirror system statuses.

## Navigation

Navigation lives in the fixed sidebar in `AppShell`.

Current behavior:

- Collapsed width: `92px`.
- Expanded width: `286px`.
- Expands on hover.
- Collapses on route change.
- Uses lucide icons.
- Active item uses emerald tint and ring.
- Related sidebar pages are grouped under green sections with child rows.

Role-specific menus:

- Admin: dashboard, agent, partner, account renewal, scheme, complimentary, offline payment, configuration, announcement, report.
- Agent: dashboard, ticket management, reports, profile, documentation, settings.
- Finance: offline payments, settings.
- Staff: scanner, tickets, settings.

If adding a route, add a clear icon from `lucide-react` and keep labels short.

### Sidebar Groups

Use grouped sidebar sections for workflows that belong together.

Visual pattern:

- Parent row uses a relevant icon, clear label, and a chevron.
- Expanded group uses emerald green.
- Groups are closed by default and open only when the user expands them or when the current page is inside the group.
- Child rows are indented.
- Child rows use a leading hyphen marker.
- Active child text is white.
- Inactive child text is muted slate and brightens on hover.

Admin groups:

- Agent: Agent Requests, Active Agents.
- Partner: Partner Requests, Active Partners.
- Scheme: Outlets, Products, Purchase Schemes.

Admin direct links:

- Dashboard
- Account Renewal
- Complimentary
- Offline Payment
- Configuration
- Announcement
- Report

Agent children:

- Ticket Purchase
- Incomplete Order
- Voucher Issued

## Modals

Use `frontend/components/ui/modal.tsx`.

Modal style:

- Overlay: `bg-slate-900/40`.
- Container: `max-w-lg`, `rounded-3xl`, white background, `shadow-xl`.
- Close button: icon-only `X`, rounded, hover background.
- Escape key closes the modal.
- Clicking outside closes the modal.

Use modals for focused tasks, not full-page workflows. Long forms should be pages or cards.

## Loading, Empty, And Error States

Use `LoadingState` for protected pages and content fetches.

Loading:

- Skeletons use `animate-pulse`.
- Preserve approximate layout shape to avoid jumpy pages.

Empty:

```tsx
<p className="py-6 text-center text-sm text-slate-400">
  No records yet.
</p>
```

Error:

- Use red-tinted alert blocks.
- Keep copy short and actionable.
- Do not show raw stack traces in UI.

## Motion And Animation

Motion is intentionally minimal.

Existing motion patterns:

- `transition` on buttons, tabs, form controls, sidebar links.
- Sidebar width transition: `transition-[width] duration-300`.
- Main content padding transition: `transition-[padding-left] duration-300`.
- Skeleton loading: `animate-pulse`.
- Hover color and background changes.

Motion rules:

- Keep animation duration between 150ms and 300ms.
- Animate opacity, color, transform, or width only when useful.
- Do not animate large tables or dense lists on every render.
- Do not use bouncing or decorative animations in admin workflows.
- Respect stability: loading text, icons, and badges should not resize layouts.

## Icons

Use `lucide-react` icons.

Rules:

- Sidebar icons: `h-4 w-4`.
- Icon-only controls need `aria-label`.
- Pick literal icons: `Megaphone` for announcements, `Wallet` for payments, `ScanLine` for scanner.
- Do not hand-roll SVG icons unless lucide has no suitable option.

## Page Pattern

Recommended CRUD page layout:

1. `ProtectedShell` with role, title, subtitle.
2. Top action row with a primary button.
3. Optional form card toggled by state.
4. Data card containing loading, empty, or table/list state.
5. Pagination below the table when needed.

Example pattern:

```tsx
<ProtectedShell roles={["ADMIN"]} title="Announcement" subtitle="Share notices">
  <div className="mb-4">
    <Button>Add New Announcement</Button>
  </div>

  <Card className="mb-4">
    <h3 className="section-title mb-3">Add New Announcement</h3>
    ...
  </Card>

  <Card>
    ...
  </Card>
</ProtectedShell>
```

## Responsive Rules

- Use single-column layouts by default.
- Add `sm:grid-cols-2` for forms.
- Add wider grids only when the content benefits from side-by-side scanning.
- Tables must scroll horizontally on mobile.
- Keep sidebar interaction usable on narrow screens.
- Do not let long labels overflow buttons, badges, or table cells.

## Do And Do Not

Do:

- Use existing UI primitives before adding new component styles.
- Keep screens dense but readable.
- Use emerald only for primary/success states.
- Use badges for statuses.
- Use skeletons for async content.
- Use tabs for same-level view switches.
- Keep labels and headings direct.

Do not:

- Add marketing-style hero sections inside the app.
- Add decorative background blobs beyond the global background.
- Add new colors casually.
- Put cards inside cards for normal layout.
- Use large animations or playful motion on admin workflows.
- Use tabs as app-wide navigation.
- Show raw backend errors to end users.

## When Adding A New Screen

Before building:

1. Choose the role and shell title.
2. Decide whether the page is table-first, form-first, or dashboard-first.
3. Reuse `Button`, `Card`, `Input`, `Select`, `Badge`, `Tabs`, `Modal`, and `LoadingState`.
4. Define loading, empty, error, and success states.
5. Check mobile width with tables and long labels.
6. Keep the page visually consistent with `frontend/app/admin/announcements/page.tsx` and other existing admin pages.
