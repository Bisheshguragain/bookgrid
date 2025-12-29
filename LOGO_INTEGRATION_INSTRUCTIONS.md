# Logo Integration Instructions

## Step 1: Save the Logo Image

**IMPORTANT**: Save the BookGrid logo image as:
- File path: `/public/bookgrid-logo.png`
- Format: PNG with transparent background
- Recommended size: 400x150px or similar

The logo should be placed in the `public` folder so it can be accessed directly via `/bookgrid-logo.png` URL.

## Step 2: Logo Placement Complete

The code has been updated to use the logo in the following locations:

### 1. Landing Page Header
- Full logo with text
- Clickable to return to landing page
- Positioned in top-left navigation

### 2. Login Page
- Logo at top of login form
- Clickable to return to landing page
- Centered above the form

### 3. Signup Page  
- Logo at top of signup form
- Clickable to return to landing page
- Centered above the form

### 4. Dashboard Header (authenticated pages)
- Logo in top-left corner
- Clickable to return to dashboard
- Consistent branding throughout app

## Logo Usage Pattern

```tsx
// Standard logo usage
<Link to="/" className="flex items-center">
  <img 
    src="/bookgrid-logo.png" 
    alt="BookGrid" 
    className="h-10"
  />
</Link>
```

## Files Modified
1. `/src/pages/Landing.tsx` - Landing page header
2. `/src/components/auth/LoginForm.tsx` - Login page
3. `/src/components/auth/SignupForm.tsx` - Signup page (if exists)
4. `/src/components/layout/Header.tsx` - Dashboard header

## Next Steps
1. Download the logo image from the attachment
2. Save it as `/public/bookgrid-logo.png`
3. Restart the development server if needed
4. Logo will appear automatically in all updated locations

## Fallback
If the logo file is not found, the old icon/text combination will still work until you add the logo file.
