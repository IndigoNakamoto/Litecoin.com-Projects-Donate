# Quick Start Guide

Get the `/projects` structure up and running in 5 minutes!

## 🚀 Fast Track (Automated)

```bash
# 1. Navigate to your litecoin-fund project
cd /path/to/litecoin-fund

# 2. Run the migration script
./migration-package/migrate.sh

# 3. Install dependencies
npm install axios @fortawesome/react-fontawesome @fortawesome/free-solid-svg-icons

# 4. Update import paths (see below)
# 5. Adapt data source (see below)
# 6. Test!
npm run dev
```

## 📋 Manual Steps

### Step 1: Copy Files
```bash
cp -r migration-package/pages/projects pages/
cp migration-package/components/*.tsx components/
cp migration-package/utils/*.ts utils/
cp migration-package/contexts/*.tsx contexts/
cp migration-package/api/*.ts pages/api/
```

### Step 2: Update Imports
Search and replace in all files:
- `../../utils/` → `@/utils/` (or your utils path)
- `../../contexts/` → `@/contexts/` (or your contexts path)

### Step 3: Adapt Data Source
Edit `utils/webflow.ts`:
- Replace Webflow API calls with your CMS
- Update data structure mapping

### Step 4: Update API Endpoints
Edit these files:
- `pages/api/getInfoTGB.ts` - Your donation stats API
- `pages/api/matching-donors-by-project.ts` - Your matching donors API
- `pages/api/webflow/projects.ts` - Your projects API

### Step 5: Configure Styling
- Ensure Tailwind is configured
- Load Space Grotesk font
- Verify colors match

### Step 6: Set Up Context
Add to `_app.tsx`:
```tsx
import { DonationProvider } from '@/contexts/DonationContext'

export default function App({ Component, pageProps }) {
  return (
    <DonationProvider>
      <Component {...pageProps} />
    </DonationProvider>
  )
}
```

## ✅ Verification

1. **Build check:**
   ```bash
   npm run build
   ```

2. **Type check:**
   ```bash
   npx tsc --noEmit
   ```

3. **Test pages:**
   - Visit `/projects` - should show project listing
   - Visit `/projects/[any-slug]` - should show project detail
   - Check browser console for errors

## 🎯 What You Get

- ✅ Projects listing page with filtering
- ✅ Individual project pages with tabs
- ✅ Donation integration
- ✅ Real-time stats
- ✅ Responsive design
- ✅ Submission forms

## 📚 Need More Help?

- See `MIGRATION_INSTRUCTIONS.md` for detailed steps
- See `README.md` for package overview
- See `FILES_CHECKLIST.md` to verify files

## ⚠️ Critical Adaptations

1. **utils/webflow.ts** - MUST adapt to your CMS
2. **API endpoints** - MUST update to your backend
3. **Import paths** - MUST match your project structure

That's it! You're ready to go! 🎉

