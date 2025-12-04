# Migration Package Integration Plan

## Overview
This document outlines the plan to integrate the migration package components into the litecoin-fund project, adapting from Pages Router to App Router.

## Current State
- ✅ App Router structure (`app/` directory)
- ✅ Webflow service integration (`services/webflow/`)
- ✅ Basic project pages (`app/projects/`)
- ✅ API routes (`app/api/`)

## Migration Package Contents
- Pages Router pages (`pages/projects/`)
- Reusable components (20+ components)
- Donation context and state management
- Utilities and helpers
- Types definitions

## Integration Strategy

### Phase 1: Components Setup ✅
- [x] Create components directory structure
- [ ] Copy reusable UI components
- [ ] Adapt components for App Router

### Phase 2: Context & State Management
- [ ] Set up DonationContext for App Router
- [ ] Integrate with layout.tsx
- [ ] Test donation state management

### Phase 3: Enhanced Project Pages
- [ ] Enhance project detail page with:
  - Tab navigation (Info, Updates, FAQs, etc.)
  - Donation stats sidebar
  - Social links
  - Project updates/posts
- [ ] Add project submission page
- [ ] Add submission confirmation page

### Phase 4: Donation Features
- [ ] Integrate payment modals
- [ ] Add donation stats components
- [ ] Connect to TGB API

### Phase 5: Utilities & Helpers
- [ ] Copy and adapt utility functions
- [ ] Update type definitions
- [ ] Add status helpers

## Key Adaptations Needed

### 1. Pages Router → App Router
- Convert `getStaticProps` → Server Components
- Convert `getStaticPaths` → `generateStaticParams`
- Update routing from `useRouter` → `usePathname`, `useSearchParams`

### 2. Import Paths
- Update `@/components/` paths
- Update relative imports
- Ensure TypeScript path aliases match

### 3. Data Fetching
- Replace `utils/webflow.ts` calls with `services/webflow/projects.ts`
- Adapt data structures to match our Project type
- Update API route handlers

### 4. Styling
- Ensure Tailwind config matches
- Verify Space Grotesk font is loaded
- Check color palette consistency

## Files to Integrate

### High Priority
1. `components/ProjectHeader.tsx` - Project title/summary
2. `components/ProjectMenu.tsx` - Tab navigation
3. `components/MenuSections.tsx` - Content sections
4. `components/AsideSection.tsx` - Stats sidebar
5. `components/DonationStats.tsx` - Donation display
6. `contexts/DonationContext.tsx` - State management

### Medium Priority
7. `components/ProjectCard.tsx` - Enhanced project cards
8. `components/ProjectContent.tsx` - Content renderer
9. `components/ProjectUpdate.tsx` - Update display
10. `components/ProjectSocialLinks.tsx` - Social links
11. `components/PaymentModal.tsx` - Payment flow
12. `components/ThankYouModal.tsx` - Confirmation

### Lower Priority
13. Section components (Blue, Grey, White, etc.)
14. FAQ components
15. Posts list components
16. Submission form components

## Next Steps
1. Copy components to `components/projects/`
2. Adapt for App Router
3. Integrate with existing pages
4. Test functionality
5. Update documentation

