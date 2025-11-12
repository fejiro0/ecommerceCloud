# 🔧 GoMart Troubleshooting Guide

## Common Issues and Solutions

### 1. ❌ Product Creation Failing

#### **Symptoms:**
- "Failed to create product" error
- Form submission hangs
- No error details shown

#### **Root Causes & Fixes:**

**A. Double Parsing Issue** ✅ FIXED
- **Problem:** Frontend was parsing numbers (`parseFloat`, `parseInt`) then sending to API, which parsed them again
- **Solution:** Now frontend sends raw string values, API handles all parsing
- **Fix Applied:** Updated `src/app/ui/products/new/page.tsx`

**B. Missing Vendor** 
- **Problem:** "No active vendor found"
- **Solution:** Create at least one vendor first
- **Steps:**
  1. Go to `/ui/vendors/new`
  2. Create a vendor with `isActive = true`
  3. Try creating product again

**C. Invalid Category**
- **Problem:** "Invalid category ID"
- **Solution:** Ensure category exists
- **Steps:**
  1. Go to `/ui/categories/list`
  2. Verify category exists
  3. Use correct category ID in product form

**D. Prisma Client Not Generated**
- **Problem:** Prisma models not found
- **Solution:** 
  ```bash
  npx prisma generate
  ```

**E. Database Schema Mismatch**
- **Problem:** Schema changes not applied to MongoDB
- **Solution:**
  ```bash
  npx prisma db push
  ```

---

### 2. ❌ Poor Image Quality / Box Sizing Issues

#### **Symptoms:**
- Images appear blurry
- Images stretched/distorted
- Inconsistent box sizes

#### **Solutions Applied:** ✅ FIXED

**A. Image Display Settings**
- Changed `object-cover` to `object-contain`
- Added `quality={95}` and `quality={100}`
- Added padding to prevent cropping
- Disabled optimization for Base64 images

**B. Next.js Image Configuration**
- Updated `next.config.js` with proper image settings
- Added remote patterns for all image sources

**C. Base64 Image Handling**
- Added `unoptimized={image.startsWith('data:')}`
- Prevents double compression of Base64 images

---

### 3. ❌ Messages Not Sending

#### **Symptoms:**
- "Failed to send message" error
- Messages not appearing in inbox

#### **Solutions Applied:** ✅ FIXED

**A. Better Error Logging**
- Added `console.error` to all API routes
- Added detailed error messages
- Development mode shows full error details

**B. Proper Validation**
- Check customer exists
- Check vendor exists
- Validate required fields

---

### 4. ❌ Reviews Not Submitting

#### **Symptoms:**
- "Failed to create review" error
- Review form not clearing

#### **Solutions Applied:** ✅ FIXED

**A. Duplicate Review Prevention**
- System checks if customer already reviewed product
- Clear error message shown

**B. Rating Validation**
- Rating must be 1-5
- Customer and product must exist

---

### 5. ❌ Prisma Client Errors

#### **Symptoms:**
- `PrismaClient is unable to run in the browser`
- `Cannot find module '@prisma/client'`
- Model not found errors

#### **Solutions:**

**A. Regenerate Prisma Client**
```bash
# Stop dev server first!
npx prisma generate
# Restart dev server
npm run dev
```

**B. Update Database Schema**
```bash
npx prisma db push
```

**C. Validate Schema**
```bash
npx prisma validate
```

---

### 6. ❌ Import Errors / Module Not Found

#### **Symptoms:**
- Cannot find module errors
- TypeScript errors

#### **Solutions:**

**A. Clear Next.js Cache**
```bash
rm -rf .next
npm run dev
```

**B. Reinstall Dependencies**
```bash
rm -rf node_modules package-lock.json
npm install
```

**C. Check Prisma Client**
```bash
npx prisma generate
```

---

### 7. ❌ MongoDB Connection Issues

#### **Symptoms:**
- Connection timeout
- Cannot connect to MongoDB
- Authentication failed

#### **Solutions:**

**A. Check .env File**
```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/gomart?retryWrites=true&w=majority"
```

**B. Verify MongoDB Atlas**
- Check IP whitelist (add `0.0.0.0/0` for development)
- Verify database user credentials
- Ensure cluster is running

**C. Test Connection**
```bash
npx prisma db pull
```

---

### 8. ❌ Development Server Issues

#### **Symptoms:**
- Hot reload not working
- Changes not reflecting
- Server crashes

#### **Solutions:**

**A. Restart Development Server**
```bash
# Press Ctrl+C to stop
npm run dev
```

**B. Clear Everything**
```bash
rm -rf .next node_modules
npm install
npx prisma generate
npm run dev
```

---

## 🔍 Debugging Steps

### Step 1: Check Console Logs
- Open browser DevTools (F12)
- Check Console tab for errors
- Look for red error messages

### Step 2: Check Terminal Logs
- Look at your terminal running `npm run dev`
- Check for Prisma errors
- Look for API route errors

### Step 3: Check Network Tab
- Open DevTools → Network tab
- Try the failing action
- Check API response status (200, 400, 500)
- Click on failed request to see error details

### Step 4: Verify Database
- Check MongoDB Atlas dashboard
- Verify collections exist
- Check if documents are being created

---

## 📝 Error Logging Features Added

All API routes now include:
- ✅ Console error logging
- ✅ Detailed error messages
- ✅ Development mode error details
- ✅ Proper HTTP status codes

**Example:**
```javascript
} catch (error: any) {
  console.error('Product creation error:', error);
  return NextResponse.json({
    status: 'error',
    message: error.message || 'Failed to create product',
    details: process.env.NODE_ENV === 'development' ? error.toString() : undefined,
  }, { status: 500 });
}
```

---

## 🎯 Checklist Before Reporting Issues

- [ ] Ran `npx prisma generate`
- [ ] Ran `npx prisma db push`
- [ ] Cleared `.next` folder
- [ ] Restarted dev server
- [ ] Checked browser console
- [ ] Checked terminal logs
- [ ] Verified MongoDB connection
- [ ] Ensured vendor exists (for products)
- [ ] Ensured category exists (for products)

---

## 💡 Best Practices

### 1. Always Check Logs First
- Browser console shows frontend errors
- Terminal shows backend/API errors

### 2. Use Development Mode
- Error details only show in development
- Set `NODE_ENV=development` in `.env`

### 3. Regenerate Prisma After Schema Changes
```bash
npx prisma generate
npx prisma db push
```

### 4. Clear Cache When In Doubt
```bash
rm -rf .next
npm run dev
```

### 5. Keep Dependencies Updated
```bash
npm update
npx prisma migrate deploy
```

---

## 🆘 Still Having Issues?

1. **Check the logs** - 90% of issues are shown in console/terminal
2. **Verify data exists** - Ensure vendors, categories exist before creating products
3. **Regenerate Prisma** - Most Prisma issues fixed by regenerating client
4. **Clear caches** - Next.js cache can cause stale data issues
5. **Check MongoDB** - Verify connection and data in Atlas dashboard

---

## 📞 Getting Help

When reporting issues, include:
1. **Error message** (exact text)
2. **Console logs** (browser + terminal)
3. **Steps to reproduce**
4. **What you were trying to do**
5. **Screenshots** (if applicable)

---

## ✅ Issues Fixed in Latest Update

- ✅ Double parsing of numbers in product creation
- ✅ Poor error logging across all API routes
- ✅ Image quality and sizing issues
- ✅ Message sending failures
- ✅ Review submission errors
- ✅ Missing error details in development mode

**All major issues have been addressed and tested!** 🎉

