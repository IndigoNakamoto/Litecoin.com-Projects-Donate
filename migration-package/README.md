# Projects Structure Migration Package

This package contains all files needed to replicate the `/projects` structure from Litecoin-OpenSource-Fund to litecoin-fund.

## 📦 Package Contents

```
migration-package/
├── pages/
│   └── projects/
│       ├── index.tsx          # Projects listing page
│       ├── [slug].tsx         # Individual project page
│       ├── submit.tsx          # Submission form
│       └── submitted.tsx       # Submission confirmation
├── components/
│   ├── ProjectHeader.tsx      # Project page header
│   ├── ProjectMenu.tsx         # Tab navigation
│   ├── MenuSections.tsx        # Content sections
│   ├── AsideSection.tsx        # Sidebar with stats
│   ├── ProjectCard.tsx         # Project card component
│   ├── ProjectContent.tsx      # Content renderer
│   ├── ProjectUpdate.tsx       # Update component
│   ├── DonationStats.tsx       # Stats display
│   ├── ProjectSubmissionForm.tsx # Submission form
│   └── [other supporting components]
├── utils/
│   ├── webflow.ts              # CMS integration (adapt to your CMS)
│   ├── types.ts                # TypeScript types
│   ├── api-helpers.ts          # API helpers
│   ├── statusHelpers.ts        # Status logic
│   ├── defaultValues.ts        # Default values
│   └── customImageLoader.ts   # Image loader
├── contexts/
│   └── DonationContext.tsx     # Global donation state
├── api/
│   ├── getInfoTGB.ts           # Donation stats API
│   ├── matching-donors-by-project.ts # Matching donors API
│   └── webflow/
│       └── projects.ts          # Projects API
└── MIGRATION_INSTRUCTIONS.md   # Step-by-step guide
```

## 🚀 Quick Start

1. **Copy files to your litecoin-fund project:**
   ```bash
   # From the litecoin-fund project root
   cp -r migration-package/pages/projects pages/
   cp -r migration-package/components/* components/
   cp -r migration-package/utils/* utils/
   cp -r migration-package/contexts/* contexts/
   cp -r migration-package/api/* pages/api/
   ```

2. **Update import paths:**
   - Update `@/components/...` to match your alias configuration
   - Update relative paths (`../../utils/...`) to match your structure

3. **Adapt data source:**
   - Replace Webflow CMS integration in `utils/webflow.ts` with your CMS
   - Update API endpoints in `pages/api/` to match your backend

4. **Configure styling:**
   - Ensure Tailwind is configured (see `tailwind.config.js`)
   - Load Space Grotesk font
   - Verify color palette matches

5. **Install dependencies:**
   ```bash
   npm install axios @fortawesome/react-fontawesome @fortawesome/free-solid-svg-icons
   ```

## 📋 Migration Checklist

- [ ] Copy all pages from `migration-package/pages/projects/`
- [ ] Copy all components from `migration-package/components/`
- [ ] Copy all utilities from `migration-package/utils/`
- [ ] Copy contexts from `migration-package/contexts/`
- [ ] Copy API routes from `migration-package/api/`
- [ ] Update all import paths
- [ ] Adapt `utils/webflow.ts` to your CMS
- [ ] Update API endpoints
- [ ] Configure Tailwind and fonts
- [ ] Test projects index page
- [ ] Test individual project pages
- [ ] Test tab navigation
- [ ] Test donation modals
- [ ] Test responsive design

## 🔧 Key Adaptations Needed

### 1. Data Source (utils/webflow.ts)
The current implementation uses Webflow CMS. You'll need to:
- Replace Webflow API calls with your CMS API
- Update data structure to match your CMS
- Adjust field mappings

### 2. API Endpoints
Update these API routes to match your backend:
- `/api/getInfoTGB` → Your donation stats endpoint
- `/api/matching-donors-by-project` → Your matching donors endpoint
- `/api/webflow/projects` → Your projects endpoint

### 3. Image Handling
- Update `utils/customImageLoader.ts` if using different CDN
- Adjust image optimization settings in Next.js config

### 4. Styling
- Verify Tailwind configuration matches
- Ensure Space Grotesk font is loaded
- Check color values match your brand

## 📚 Documentation

For detailed information, see:
- `docs/projects-structure-replication-guide.md` - Complete guide
- `docs/projects-replication-summary.md` - Quick reference
- `docs/styling-guide.md` - Styling reference

## ⚠️ Important Notes

1. **Webflow Integration**: The code currently uses Webflow CMS. You must adapt `utils/webflow.ts` to work with your data source.

2. **Type Safety**: All TypeScript types are defined in `utils/types.ts`. Update these if your data structure differs.

3. **State Management**: Uses React Context API (`DonationContext`). Ensure it's properly set up in your app.

4. **Static Generation**: Uses Next.js `getStaticProps` and `getStaticPaths`. Revalidation is set to 600 seconds.

5. **Environment Variables**: You'll need to set up environment variables for:
   - CMS API keys
   - Donation API endpoints
   - Image CDN URLs

## 🐛 Troubleshooting

### Projects not loading
- Check API endpoints are configured
- Verify data structure matches types
- Check CMS integration is working

### Images not displaying
- Verify `customImageLoader.ts` is configured
- Check image URLs are valid
- Ensure Next.js Image component is set up

### Styling issues
- Verify Tailwind config matches
- Check fonts are loaded
- Ensure color values are correct

## 📞 Support

Refer to the full replication guide for detailed troubleshooting and examples.

