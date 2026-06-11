# Diagflo Design System
## FAANG APM Grade Design Documentation

---

## 🎨 Brand Colors

### Primary Gradient
```css
/* Orange to Amber - Brand Identity */
background: linear-gradient(135deg, #f97316 0%, #f59e0b 100%);
```

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `orange-500` | `#f97316` | rgb(249, 115, 22) | Primary accent, gradient start |
| `amber-500` | `#f59e0b` | rgb(245, 158, 11) | Gradient end |
| `orange-400` | `#fb923c` | rgb(251, 146, 60) | Light mode accents |
| `orange-600` | `#ea580c` | rgb(234, 88, 12) | Hover states |

### Dark Mode Palette
| Token | Hex | Usage |
|-------|-----|-------|
| `bg-primary` | `#131b1f` | Main background |
| `bg-secondary` | `#111111` | Card backgrounds |
| `bg-elevated` | `#1A1A1A` | Elevated surfaces |
| `border-subtle` | `#ffffff0d` | Subtle borders (5% white) |
| `border-default` | `#ffffff14` | Default borders (8% white) |

### Text Colors (Dark Mode)
| Token | Hex | Usage |
|-------|-----|-------|
| `text-primary` | `#F5F5F7` | Headlines, primary text |
| `text-secondary` | `#A1A1A6` | Body text, descriptions |
| `text-muted` | `#86868B` | Captions, helper text |

### Light Mode Palette
| Token | Hex | Usage |
|-------|-----|-------|
| `bg-primary` | `#f6f7f8` | Main background |
| `bg-secondary` | `#ffffff` | Card backgrounds |
| `text-primary` | `#111111` | Headlines |
| `text-secondary` | `#515154` | Body text |
| `text-muted` | `#6E6E73` | Captions |

---

## 🔤 Typography

### Font Family
```css
font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Type Scale
| Level | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|--------|-------------|----------------|-------|
| H1 | 72px (4.5rem) | 600 (Semibold) | 1.05 | -0.02em (tighter) | Hero headlines |
| H2 | 48px (3rem) | 600 (Semibold) | 1.1 | -0.02em | Section titles |
| H3 | 24px (1.5rem) | 600 (Semibold) | 1.3 | -0.01em | Card titles |
| Body Large | 20px (1.25rem) | 400 (Normal) | 1.6 | 0.01em | Hero subheadlines |
| Body | 16px (1rem) | 400 (Normal) | 1.5 | 0 | Default body text |
| Body Small | 14px (0.875rem) | 500 (Medium) | 1.4 | 0 | Labels, captions |
| Caption | 12px (0.75rem) | 500 (Medium) | 1.4 | 0.02em | Helper text |

---

## 📐 Spacing System

### Base Unit: 4px

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Minimal gaps |
| `space-2` | 8px | Icon gaps, tight spacing |
| `space-3` | 12px | Small component padding |
| `space-4` | 16px | Default padding |
| `space-6` | 24px | Section gaps |
| `space-8` | 32px | Large gaps |
| `space-10` | 40px | Hero spacing |
| `space-12` | 48px | Section padding |
| `space-16` | 64px | Major section breaks |
| `space-24` | 96px | Hero padding (desktop) |

### Border Radius
| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 8px | Small buttons, badges |
| `radius-md` | 12px | Cards, inputs |
| `radius-lg` | 16px | Large cards |
| `radius-xl` | 24px | Modals, hero cards |
| `radius-full` | 9999px | Pills, circular buttons |

---

## 🖼️ Logo Specifications

### Logo Sizes
| Context | Size | File |
|---------|------|------|
| Favicon | 16×16, 32×32 | favicon.ico |
| Navbar | 36×36 | Inline SVG |
| Footer | 28×28 | Inline SVG |
| App Icon | 180×180 | apple-touch-icon.png |
| OG Image | 512×512 | og-logo.png |

### Clear Space
Minimum clear space around logo: **50% of logo width** on all sides.

### Logo Don'ts
- ❌ Never stretch or distort
- ❌ Never change gradient direction
- ❌ Never use on busy backgrounds without container
- ❌ Never rotate
- ❌ Never add drop shadows or effects

---

## 🔘 Button Specifications

### Primary Button (CTA)
```css
/* Dark Mode */
background: linear-gradient(180deg, #ffffff 0%, #f3f4f6 100%);
color: #000000;
padding: 16px 32px;
border-radius: 9999px;
font-size: 16px;
font-weight: 500;
box-shadow: 0 10px 15px -3px rgba(255, 255, 255, 0.1);

/* Light Mode */
background: linear-gradient(180deg, #111111 0%, #222222 100%);
color: #ffffff;
box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);

/* Hover */
transform: scale(1.02);

/* Active */
transform: scale(0.98);
```

### Secondary Button
```css
background: transparent;
border: 1px solid rgba(255, 255, 255, 0.1);
color: #A1A1A6;
padding: 12px 24px;
border-radius: 9999px;

/* Hover */
border-color: rgba(255, 255, 255, 0.2);
color: #ffffff;
```

---

## 📦 Card Specifications

### Preview Card (Hero)
```css
/* Dark Mode */
background: #111111;
border: 1px solid rgba(255, 255, 255, 0.08);
border-radius: 16px;
box-shadow: 
  0 25px 50px -12px rgba(249, 115, 22, 0.05),
  0 0 0 1px rgba(255, 255, 255, 0.05);

/* Light Mode */
background: #ffffff;
border: 1px solid rgba(0, 0, 0, 0.08);
box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
```

### Feature Card
```css
background: transparent;
border: 1px solid rgba(255, 255, 255, 0.08);
border-radius: 24px;
padding: 32px;
```

---

## 🎭 Animation Specifications

### Entrance Animations
```css
/* Fade In Up */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
animation: fadeInUp 0.8s ease-out;
```

### Transition Defaults
```css
transition: all 0.2s ease;
transition: all 0.3s ease; /* For larger elements */
transition: all 0.7s ease-out; /* For hero elements */
```

### Hover Effects
- Buttons: `transform: scale(1.02)`
- Cards: `transform: translateY(-4px)`
- Links: `opacity: 1` (from 0.6)
- Icons: `transform: scale(1.1)`

---

## 📱 Responsive Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablets |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large desktop |
| `2xl` | 1536px | Ultra-wide |

---

## ✅ Component Checklist

### Logo Variants
- [ ] Logo with gradient background (primary)
- [ ] Logo white monochrome (for dark backgrounds)
- [ ] Logo dark monochrome (for light backgrounds)
- [ ] Favicon ICO (16x16, 32x32)
- [ ] Apple Touch Icon (180x180)
- [ ] OG Image (1200x630)

### UI Components
- [ ] Primary Button (dark/light)
- [ ] Secondary Button (dark/light)
- [ ] Input Field
- [ ] Card (feature card)
- [ ] Preview Card (hero)
- [ ] Navigation Bar
- [ ] Footer
- [ ] Badge/Pill
- [ ] Tooltip

### Icons
- [ ] Arrow Forward
- [ ] Check Circle
- [ ] Sun/Moon (theme toggle)
- [ ] Menu (hamburger)
- [ ] Social: X, LinkedIn, GitHub

---

## 📁 Asset Export Settings

### SVG
- Outline strokes
- Include ID attributes
- Optimize with SVGO

### PNG
- @1x, @2x, @3x for retina
- Transparent background (unless specified)

### Favicon
- ICO format with 16x16, 32x32, 48x48 embedded
- PNG fallbacks

---

*Design System v1.0 — Diagflo*
*Created: January 2026*
