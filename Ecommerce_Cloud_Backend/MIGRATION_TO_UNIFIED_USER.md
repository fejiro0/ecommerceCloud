# Migration to Unified User System

## Overview
We've simplified the system by merging `Customer` and `Vendor` into a single `User` model. This makes messaging much simpler - **any user can message any other user** about products.

## What Changed

### Database Schema

**Before:**
- Separate `Customer` and `Vendor` models
- Complex conversation system (customerId + vendorId)
- Messages tracked by senderType ("customer" or "vendor")
- Products owned by vendors only

**After:**
- Single `User` model with optional seller fields
- Simple conversation system (senderId + receiverId)
- Messages tracked by senderId only
- Products owned by any user

### Key Changes

1. **User Model**
   - Combines all customer and vendor fields
   - `isSeller` flag indicates if user sells products
   - Optional business fields (businessName, storeLogo, etc.)

2. **Product Model**
   - `vendorId` → `ownerId` (any user can own products)
   
3. **Conversation Model**
   - `customerId + vendorId` → `senderId + receiverId`
   - `customerUnread + vendorUnread` → `senderUnread + receiverUnread`
   
4. **Message Model**
   - No more `senderType` field
   - Just `senderId` pointing to User

## Migration Steps

### 1. Stop All Services
```bash
# Stop dev server
Ctrl+C

# Clear Next.js cache
Remove-Item -Recurse -Force .next
```

### 2. Backup Database
```bash
# Export current data from MongoDB Atlas
# Or use MongoDB Compass to export collections
```

### 3. Generate New Prisma Client
```bash
npx prisma generate
```

###4. Reset Database (Development Only!)
```bash
# WARNING: This will delete all data!
npx prisma db push --force-reset
```

### 5. Seed Database (Optional)
Create new test users with the unified schema.

## API Changes

### Authentication
- `/api/auth/login` - Now returns unified user object
- `/api/auth/vendor-login` - **REMOVED** (use regular login)
- User object now has `isSeller` flag

### Products
- Product API now uses `ownerId` instead of `vendorId`
- Any user can create products (automatically sets `isSeller` to true)

### Conversations
- `/api/conversations?userId=X` - Gets conversations for any user
- No more `userType` parameter needed
- Simpler conversation creation

### Messages
- Messages no longer need `senderType`
- Just send `senderId` and `content`

## Frontend Changes

### localStorage
**Before:**
```javascript
{
  id: "...",
  firstName: "...",
  userType: "customer" // or "vendor"
}
```

**After:**
```javascript
{
  id: "...",
  firstName: "...",
  isSeller: true, // or false
  businessName: "..." // optional
}
```

### Navigation
- No more userType detection needed
- All users see same navigation
- Sellers see additional "My Products" link

### Messaging
- Much simpler! Just sender and receiver
- No customer/vendor distinction
- Anyone can message anyone

## Benefits

✅ **Simpler code** - No more customer/vendor branching logic
✅ **More flexible** - Anyone can buy AND sell
✅ **Better UX** - Unified experience for all users
✅ **Easier messaging** - No complex role-based routing
✅ **Scalable** - Easy to add new user features

## Breaking Changes

⚠️ **All existing data will need migration**
⚠️ **Frontend localStorage needs updating**
⚠️ **API responses have changed structure**
⚠️ **Vendor-specific pages need updating**

## Testing Checklist

- [ ] User registration works
- [ ] User login works
- [ ] Product creation works (sets isSeller automatically)
- [ ] Anyone can message product owners
- [ ] Conversations show correct participants
- [ ] Messages send/receive properly
- [ ] Unread counts work
- [ ] Cart functionality intact
- [ ] Reviews work

## Rollback Plan

If needed, restore from backup:
1. Restore `schema-old-backup.prisma` to `schema.prisma`
2. Run `npx prisma generate`
3. Restore database from backup
4. Restart services

