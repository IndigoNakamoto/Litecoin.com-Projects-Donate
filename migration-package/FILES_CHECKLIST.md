# Files Checklist

Use this checklist to verify all files are copied correctly.

## ✅ Pages (4 files)

- [ ] `pages/projects/index.tsx` - Projects listing page
- [ ] `pages/projects/[slug].tsx` - Individual project page
- [ ] `pages/projects/submit.tsx` - Submission form
- [ ] `pages/projects/submitted.tsx` - Submission confirmation

## ✅ Core Components (10 files)

- [ ] `components/ProjectHeader.tsx` - Project title and summary
- [ ] `components/ProjectMenu.tsx` - Tab navigation
- [ ] `components/MenuSections.tsx` - Content sections
- [ ] `components/AsideSection.tsx` - Sidebar with stats
- [ ] `components/ProjectCard.tsx` - Project card
- [ ] `components/ProjectContent.tsx` - Content renderer
- [ ] `components/ProjectUpdate.tsx` - Update component
- [ ] `components/ProjectSocialLinks.tsx` - Social links
- [ ] `components/DonationStats.tsx` - Stats display
- [ ] `components/ProjectSubmissionForm.tsx` - Submission form

## ✅ Supporting Components (12+ files)

- [ ] `components/Button.tsx` - Button component
- [ ] `components/SectionGrey.tsx` - Grey section wrapper
- [ ] `components/SectionWhite.tsx` - White section wrapper
- [ ] `components/SectionBlue.tsx` - Blue section wrapper
- [ ] `components/SectionStats.tsx` - Stats section
- [ ] `components/SectionMatchingDonations.tsx` - Matching donations
- [ ] `components/SectionContributors.tsx` - Contributors section
- [ ] `components/PostsList.tsx` - Posts list
- [ ] `components/FAQSection.tsx` - FAQ accordion
- [ ] `components/PaymentModal.tsx` - Payment modal
- [ ] `components/ThankYouModal.tsx` - Thank you modal
- [ ] `components/ApplySection.tsx` - Apply section wrapper
- [ ] `components/SubmittedSection.tsx` - Submitted section wrapper
- [ ] `components/VerticalSocialIcons.tsx` - Social icons
- [ ] `components/TypingScroll.tsx` - Typing animation

## ✅ Utilities (6 files)

- [ ] `utils/webflow.ts` - CMS integration (NEEDS ADAPTATION)
- [ ] `utils/types.ts` - TypeScript types
- [ ] `utils/api-helpers.ts` - API helpers
- [ ] `utils/statusHelpers.ts` - Status logic
- [ ] `utils/defaultValues.ts` - Default values
- [ ] `utils/customImageLoader.ts` - Image loader

## ✅ Contexts (1 file)

- [ ] `contexts/DonationContext.tsx` - Global donation state

## ✅ API Routes (5+ files)

- [ ] `pages/api/getInfoTGB.ts` - Donation stats (NEEDS ADAPTATION)
- [ ] `pages/api/matching-donors-by-project.ts` - Matching donors (NEEDS ADAPTATION)
- [ ] `pages/api/webflow/projects.ts` - Projects endpoint (NEEDS ADAPTATION)
- [ ] `pages/api/webflow/project.ts` - Single project (NEEDS ADAPTATION)
- [ ] `pages/api/webflow/project-posts.ts` - Project posts (NEEDS ADAPTATION)

## 📝 Documentation Files

- [x] `README.md` - Package overview
- [x] `MIGRATION_INSTRUCTIONS.md` - Step-by-step guide
- [x] `FILES_CHECKLIST.md` - This file
- [x] `migrate.sh` - Migration script

## ⚠️ Files That Need Adaptation

These files contain Webflow-specific code and must be adapted:

1. **utils/webflow.ts** - Replace Webflow API with your CMS
2. **pages/api/getInfoTGB.ts** - Update to your donation API
3. **pages/api/matching-donors-by-project.ts** - Update to your API
4. **pages/api/webflow/*.ts** - Replace with your CMS endpoints

## 🔍 Verification Steps

After copying files:

1. **Check imports:**
   ```bash
   # Search for import errors
   npm run build
   ```

2. **Verify types:**
   ```bash
   # Check TypeScript compilation
   npx tsc --noEmit
   ```

3. **Test pages:**
   - Navigate to `/projects`
   - Navigate to `/projects/[any-slug]`
   - Check browser console for errors

4. **Verify components:**
   - Check all components render
   - Verify no missing dependencies

## 📦 Dependencies to Install

```bash
npm install axios @fortawesome/react-fontawesome @fortawesome/free-solid-svg-icons
```

## 🎯 Next Actions

1. Copy all files using `migrate.sh` or manually
2. Update import paths
3. Adapt data source (utils/webflow.ts)
4. Update API endpoints
5. Configure styling
6. Test functionality

