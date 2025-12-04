# Step-by-Step Migration Instructions

Follow these steps to migrate the `/projects` structure to litecoin-fund.

## Prerequisites

- Next.js project set up
- TypeScript configured
- Tailwind CSS installed
- Access to your CMS/backend

## Step 1: Copy Files

### 1.1 Copy Pages
```bash
# From litecoin-fund project root
cp -r migration-package/pages/projects pages/
```

### 1.2 Copy Components
```bash
cp migration-package/components/Project*.tsx components/
cp migration-package/components/MenuSections.tsx components/
cp migration-package/components/AsideSection.tsx components/
cp migration-package/components/DonationStats.tsx components/
cp migration-package/components/ProjectSubmissionForm.tsx components/
cp migration-package/components/ApplySection.tsx components/
cp migration-package/components/SubmittedSection.tsx components/

# Supporting components (if not already present)
cp migration-package/components/Button.tsx components/
cp migration-package/components/Section*.tsx components/
cp migration-package/components/PostsList.tsx components/
cp migration-package/components/FAQSection.tsx components/
cp migration-package/components/PaymentModal.tsx components/
cp migration-package/components/ThankYouModal.tsx components/
```

### 1.3 Copy Utilities
```bash
cp migration-package/utils/*.ts utils/
```

### 1.4 Copy Contexts
```bash
cp migration-package/contexts/*.tsx contexts/
```

### 1.5 Copy API Routes
```bash
cp migration-package/api/getInfoTGB.ts pages/api/
cp migration-package/api/matching-donors-by-project.ts pages/api/
mkdir -p pages/api/webflow
cp migration-package/api/webflow/*.ts pages/api/webflow/
```

## Step 2: Update Import Paths

### 2.1 Check Your Path Aliases
Verify your `tsconfig.json` or `jsconfig.json` has path aliases:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### 2.2 Update Imports in Pages
Search and replace import paths in `pages/projects/`:
- `../../utils/` → `@/utils/` or your utils path
- `../../contexts/` → `@/contexts/` or your contexts path
- `@/components/` → Verify this matches your alias

### 2.3 Update Imports in Components
Update relative imports in components to match your structure.

## Step 3: Adapt Data Source

### 3.1 Update utils/webflow.ts
Replace Webflow API calls with your CMS:

```typescript
// Example: Replace with your CMS client
import { yourCMSClient } from '@/lib/your-cms'

export async function getProjectBySlug(slug: string) {
  // Replace Webflow API call
  const project = await yourCMSClient.getProject(slug)
  return project
}
```

### 3.2 Update Data Structure
If your CMS has different field names, update:
- `utils/types.ts` - Type definitions
- `pages/projects/[slug].tsx` - Data mapping in `getStaticProps`
- `pages/projects/index.tsx` - Data transformation

## Step 4: Configure API Routes

### 4.1 Update /api/getInfoTGB
```typescript
// pages/api/getInfoTGB.ts
// Replace with your donation stats endpoint
export default async function handler(req, res) {
  const { slug } = req.query
  // Call your donation API
  const stats = await yourDonationAPI.getStats(slug)
  res.json(stats)
}
```

### 4.2 Update /api/matching-donors-by-project
```typescript
// pages/api/matching-donors-by-project.ts
// Replace with your matching donors endpoint
```

### 4.3 Update /api/webflow/projects
```typescript
// pages/api/webflow/projects.ts
// Replace with your projects endpoint
// Or rename to match your CMS
```

## Step 5: Configure Styling

### 5.1 Tailwind Configuration
Ensure `tailwind.config.js` includes:
```javascript
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        'space-grotesk': ['"Space Grotesk"', 'sans-serif'],
      },
      colors: {
        blue: {
          500: '#345D9D',
          // ... other blue shades
        },
      },
    },
  },
}
```

### 5.2 Load Fonts
Add Space Grotesk font to your project:
- Download from Google Fonts or use CDN
- Add to `styles/globals.css` or `_app.tsx`

### 5.3 Verify CSS
Ensure `css/tailwind.css` includes markdown styles:
```css
.markdown h1 {
  @apply mb-4 mt-8 font-space-grotesk text-[39px] font-semibold;
}
/* ... other markdown styles */
```

## Step 6: Set Up Context

### 6.1 Add DonationContext to App
In your `_app.tsx` or root layout:
```typescript
import { DonationProvider } from '@/contexts/DonationContext'

export default function App({ Component, pageProps }) {
  return (
    <DonationProvider>
      <Component {...pageProps} />
    </DonationProvider>
  )
}
```

## Step 7: Environment Variables

Create `.env.local` with:
```env
# CMS Configuration
CMS_API_KEY=your_api_key
CMS_BASE_URL=your_cms_url

# Donation API
DONATION_API_URL=your_donation_api
DONATION_API_KEY=your_api_key

# Image CDN
IMAGE_CDN_URL=your_cdn_url
```

## Step 8: Install Dependencies

```bash
npm install axios @fortawesome/react-fontawesome @fortawesome/free-solid-svg-icons
```

## Step 9: Test

### 9.1 Test Projects Index
```bash
npm run dev
# Navigate to http://localhost:3000/projects
```
- Verify projects load
- Test filtering
- Test navigation

### 9.2 Test Project Detail Page
- Navigate to a project
- Test tab navigation
- Test donation modal
- Verify stats display

### 9.3 Test Responsive Design
- Test on mobile
- Test on tablet
- Test on desktop

## Step 10: Customize

### 10.1 Update Branding
- Update colors in Tailwind config
- Update logo/images
- Update text content

### 10.2 Add Features
- Customize project cards
- Add new sections
- Modify layout

## Troubleshooting

### Error: Module not found
- Check import paths
- Verify files are copied correctly
- Check path aliases in tsconfig.json

### Error: Type errors
- Update types in `utils/types.ts`
- Verify data structure matches types
- Check TypeScript configuration

### Projects not loading
- Check API endpoints
- Verify CMS integration
- Check browser console for errors

### Styling looks wrong
- Verify Tailwind config
- Check fonts are loaded
- Ensure CSS is imported

## Next Steps

1. Review the full replication guide
2. Test all functionality
3. Customize for your needs
4. Deploy and monitor

## Support

Refer to:
- `docs/projects-structure-replication-guide.md` - Complete guide
- `docs/styling-guide.md` - Styling reference
- Project documentation

