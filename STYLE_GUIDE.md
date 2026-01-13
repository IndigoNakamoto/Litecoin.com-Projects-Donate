# Navigation Component Style Guide

## Overview
The Navigation component is a responsive, scroll-aware header navigation with dropdown menus, mobile hamburger menu, and dynamic color transitions. This style guide documents the design patterns, conventions, and implementation details used in the Navigation component.

## Component Structure

### File Organization
```
components/Navigation.tsx
├── Imports and Dependencies
├── State Management
├── Event Handlers
├── Dynamic Styling Calculations
├── Render Logic
└── Styled JSX
```

### Key Dependencies
- **React Hooks**: `useState`, `useEffect`, `useRef`
- **Next.js**: `Link` component
- **Styling**: Tailwind CSS + styled-jsx + inline styles
- **Assets**: SVG logo component

## Design Patterns

### 1. Dynamic Color Interpolation

The component uses a sophisticated color interpolation system that transitions between light and dark themes based on scroll position.

```typescript
const interpolateColor = (startColor: string, endColor: string, factor: number) => {
  const startMatch = startColor.slice(1).match(/.{2}/g) || []
  const endMatch = endColor.slice(1).match(/.{2}/g) || []
  const result = startMatch.map((hex, i) => {
    return Math.round(
      parseInt(hex, 16) * (1 - factor) +
        parseInt(endMatch[i] || '00', 16) * factor
    )
      .toString(16)
      .padStart(2, '0')
  })
  return `#${result.join('')}`
}
```

**Usage:**
- `bgOpacity` ranges from 0 (transparent) to 1 (fully opaque)
- Colors transition from `#222222` (dark) to `#C6D3D6` (light)
- Applied to: header background, text colors, dropdown backgrounds

### 2. Responsive Design Strategy

The component implements a mobile-first approach with distinct layouts:

**Breakpoints:**
- **Desktop**: > 992px (Tailwind: `md` and above)
- **Mobile**: ≤ 992px

**Dynamic Values:**
```typescript
const headerHeight = isMobile ? 70 : 82
const baseLogoSize = isMobile ? 130 : 142
const minLogoSize = isMobile ? 124 : 124
```

### 3. Scroll-Based Animations

**Scroll Metrics:**
- `maxScrollHeight = 225px` (animation trigger zone)
- `bgOpacity = Math.min(scrollPosition / maxScrollHeight, 1)`

**Animated Properties:**
- Header background opacity
- Logo size scaling
- Font size reduction
- Margin adjustments

### 4. Dropdown System

**State Management:**
```typescript
const [dropdownOpen, setDropdownOpen] = useState({
  useLitecoin: false,
  theFoundation: false,
  learn: false,
})
```

**Animation Classes:**
- `dropdown-enter-active`: Fade in with opacity
- `dropdown-exit-active`: Fade out with opacity
- Transition duration: `200ms ease-in-out`

## Styling Conventions

### 1. CSS-in-JS with styled-jsx

**Location:** Bottom of component before closing JSX tag

**Pattern:**
```jsx
<style jsx>{`
  :root {
    --menu-item-margin: ${scaledMargin - 1.9}px;
    --dropdown-width: 180px;
  }

  .nav-toggle { ... }
  .dropdown-enter-active { ... }
  .dropdown-exit-active { ... }
`}</style>
```

### 2. Inline Styles with Dynamic Values

**Pattern:**
```jsx
style={{
  backgroundColor: `rgba(34, 34, 34, ${bgOpacity})`,
  height: `${headerHeight}px`,
  fontSize: `${scaledFontSize}px`,
  color: fontColor,
}}
```

### 3. Tailwind CSS Classes

**Responsive Classes:**
- `md:clear-left` - Desktop-specific positioning
- `short:py-0.5` - Custom breakpoint adjustments

**Layout Classes:**
- `fixed left-0 right-0 top-0 z-40` - Header positioning
- `flex items-center justify-between` - Main layout

### 4. CSS Custom Properties

**Dynamic Variables:**
- `--menu-item-margin`
- `--dropdown-width`

**Usage:**
```css
width: var(--dropdown-width);
margin-right: var(--menu-item-margin);
```

## Color Palette

### Primary Colors
- **Dark Theme**: `#222222` (Charcoal)
- **Light Theme**: `#C6D3D6` (Light Gray-Blue)
- **Transition Point**: 50% opacity (`bgOpacity < 0.5`)

### Logo Colors
- **Dark Background**: `#ffffff` (White)
- **Light Background**: `#000000` (Black)

### Interactive Elements
- **Hamburger Menu**: Interpolates between `#222222` → `#ffffff`
- **Social Icons**: Interpolates between `#222222` → `#ffffff`

## Typography

### Font Families
1. **Primary**: System font stack
   ```
   system-ui, -apple-system, BlinkMacSystemFont, Segoe UI,
   Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans,
   Helvetica Neue, sans-serif
   ```

2. **Mobile Menu**: `font-space-grotesk`

### Font Sizes
**Desktop (scaled):**
- Base: `16px`
- Min: `14.25px`
- Scaling factor: `(scrollPosition / maxScrollHeight) * 2`

**Mobile:**
- Menu items: `2.1rem`
- Consistent across all mobile navigation items

### Letter Spacing
- Menu items: `-0.2px` (tight tracking)
- Buttons: `-0.01em`

## Spacing and Layout

### Header Dimensions
- **Desktop Height**: `82px` → `70px` (scroll reduction)
- **Mobile Height**: `70px` (fixed)

### Logo Scaling
- **Desktop**: `142px` → `124px`
- **Mobile**: `130px` → `124px`

### Margins and Padding
- **Scaled Margin**: `14px` → `12px`
- **Menu Item Spacing**: `--menu-item-margin` (calculated)
- **Dropdown Padding**: `ml-2 mt-2 p-2 pl-4`

## Interactive Elements

### Hamburger Menu
**Structure:**
```html
<div className="nav-toggle">
  <span className="bar"></span>
  <span className="bar"></span>
  <span className="bar"></span>
</div>
```

**Animation:**
- Closed: Three horizontal bars
- Open: X shape with rotations
- Transition: `300ms ease-in-out`

### Dropdown Menus
**Trigger:** Button click or click outside
**Animation:** Fade in/out with visibility toggle
**Positioning:** `absolute left-0 top-full mt-3`

### SVG Icons
**Chevron Arrows:**
- Size: `h-4 w-4` (desktop), `h-10 w-10` (mobile)
- Rotation: `180deg` when open
- Instant transition: `transform 0ms`

## Accessibility

### ARIA Attributes
```jsx
aria-expanded={dropdownOpen.useLitecoin}
aria-haspopup="true"
aria-label="menu"
role="button"
tabIndex={0}
```

### Keyboard Navigation
- Tab navigation through menu items
- Enter/Space to toggle dropdowns
- Escape to close menus

### Screen Reader Support
- Semantic HTML structure
- Descriptive button labels
- Proper heading hierarchy

## Mobile Navigation

### Layout Structure
```jsx
<div className="fixed bottom-0 right-0 top-0 z-30 min-w-full">
  <nav className="mt-10 h-full">
    {/* Menu items */}
  </nav>
  <HorizontalSocialIcons />
</div>
```

### Animation
- Slide in: `translate-x-0`
- Slide out: `translate-x-[105%]`
- Duration: `300ms ease-in`

## Performance Considerations

### Optimizations
1. **Event Listeners**: Properly cleaned up in `useEffect` return
2. **Dynamic Calculations**: Computed on scroll/resize only
3. **CSS Transitions**: Hardware-accelerated transforms
4. **Conditional Rendering**: Dropdowns only render when open

### Memory Management
- Refs properly typed: `HTMLLIElement | null`
- State updates batched where possible
- Event listeners removed on unmount

## Browser Compatibility

### Supported Features
- CSS Custom Properties (CSS Variables)
- CSS Transforms and Transitions
- Flexbox Layout
- CSS Grid (minimal usage)

### Fallbacks
- Graceful degradation for older browsers
- Inline styles as fallback for CSS variables
- Progressive enhancement approach

## Maintenance Guidelines

### Adding New Menu Items
1. Update state objects (`dropdownOpen`, `mobileDropdownOpen`)
2. Add refs if dropdown functionality needed
3. Update `titleToKey` mapping
4. Add to mobile menu array
5. Update click outside handler

### Modifying Colors
1. Update `interpolateColor` calls
2. Test across full scroll range
3. Verify contrast ratios
4. Update color constants documentation

### Responsive Adjustments
1. Test at breakpoint (992px)
2. Update `isMobile` calculations
3. Adjust scaled values for new ranges
4. Verify touch targets on mobile

## Testing Checklist

### Visual Testing
- [ ] Colors transition smoothly on scroll
- [ ] Dropdowns animate correctly
- [ ] Mobile menu slides in/out properly
- [ ] Logo scales appropriately
- [ ] Text remains readable at all states

### Functional Testing
- [ ] All links work correctly
- [ ] Dropdowns open/close on click
- [ ] Mobile menu toggles hamburger
- [ ] Click outside closes dropdowns
- [ ] Keyboard navigation works

### Performance Testing
- [ ] No layout thrashing on scroll
- [ ] Smooth animations at 60fps
- [ ] Memory usage remains stable
- [ ] Bundle size impact minimal
