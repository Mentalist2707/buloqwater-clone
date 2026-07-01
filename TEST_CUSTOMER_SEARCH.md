# Customer Search Debug Report

## Problem
Customer search returns 0 results even though database contains the customer.

## Database Evidence
```
Customer ID: c7dd6ec-91f0-42e6-941a-5e4e36255890
Name: Fayzullayev Asilbek
Phone: +998931535305
```

## Changes Applied

### Backend: `/src/app/api/v1/customers/route.ts`
✅ Added `mode: "insensitive"` to all search fields (phone1, phone2, name, address, landmark)
✅ Added comprehensive console logging
✅ Added debug queries to check:
  - Company context
  - All customers in company
  - Specific phone number test
  - Company ID matching

### What The Logs Will Show

When you search for "931535305", the backend will now log:

```
🔍 Backend qidiruv: 931535305
🏢 CompanyId: <operator's company id>
👤 User role: OPERATOR
📋 Where condition: {...}
🎯 Final Prisma where: {...}
📊 Kompaniyadagi barcha mijozlar: X ta
👥 Mijozlar ro'yxati:
  - Name1: +998... (companyId1)
  - Name2: +998... (companyId2)
🔬 Test: 931535305 raqamli mijozni qidirish...
✅ Test mijoz topildi: {...}
🏢 Mijoz companyId: <customer's company id>
🏢 Auth companyId: <operator's company id>
⚖️ Match: true/false
```

## Next Steps

### 1. RESTART BACKEND SERVER ⚠️
**CRITICAL**: The code changes won't take effect until you restart the Next.js server!

```bash
# Stop the server (Ctrl+C in terminal)
# Then restart:
npm run dev
```

### 2. Test Search Again
In the mobile app, search for "931535305" and check the BACKEND console logs (not mobile).

### 3. Analyze The Logs

**If you see "Match: false":**
- The customer belongs to a different company
- Solution: The operator needs to log in with the correct company

**If you see "📊 Kompaniyadagi barcha mijozlar: 0 ta":**
- The operator's company has no customers
- Solution: Verify which company the operator is logged into

**If you see "❌ Test mijoz topilmadi":**
- Customer might have `isActive: false`
- Customer might not exist in database
- Solution: Check database directly

**If you see "✅ Test mijoz topildi" AND "Match: true":**
- Customer exists and company matches
- Problem is in the search query format
- Solution: Check the Prisma where condition

### 4. Database Verification

Run this SQL query directly in your database:

```sql
-- Check if customer exists
SELECT id, name, phone1, "companyId", "isActive"
FROM customers
WHERE phone1 LIKE '%931535305%';

-- Check operator's company
SELECT u.id, u.phone, u."companyId", c.name as "companyName"
FROM users u
LEFT JOIN companies c ON u."companyId" = c.id
WHERE u.role = 'OPERATOR';
```

## Possible Root Causes

### ✅ Most Likely: Company Mismatch
The customer belongs to Company A, but the operator is logged into Company B.

**Solution**: 
- Check which company the operator is logged into
- Check which company the customer belongs to
- They must match!

### ✅ Server Not Restarted
The backend code changes haven't taken effect yet.

**Solution**: Restart the Next.js dev server

### ❌ Less Likely: Phone Format Issue
Now handled by the backend with `mode: "insensitive"` and frontend tries multiple formats.

### ❌ Less Likely: isActive Filter
If customer has `isActive: false`, they won't appear in search results.

## Testing Checklist

- [ ] Backend server restarted
- [ ] Searched for "931535305" in mobile app
- [ ] Checked backend console logs (NOT mobile logs)
- [ ] Verified operator's companyId from logs
- [ ] Verified customer's companyId from logs
- [ ] Confirmed they match
- [ ] If mismatch: logged in with correct company
- [ ] Search works!

## Frontend Search Logic

The frontend now tries multiple formats automatically:
1. `+998931535305` (full format)
2. `931535305` (9 digits)
3. `998931535305` (12 digits)

Each format is tried sequentially until a match is found.

## Backend Search Logic

```typescript
where: {
  companyId: auth.companyId,  // ← CRITICAL: Must match!
  isActive: true,
  OR: [
    { phone1: { contains: search, mode: "insensitive" } },
    { phone2: { contains: search, mode: "insensitive" } },
    { name: { contains: search, mode: "insensitive" } },
    { address: { contains: search, mode: "insensitive" } },
    { landmark: { contains: search, mode: "insensitive" } },
  ]
}
```

The `mode: "insensitive"` makes the search case-insensitive and works with any substring.

## Success Criteria

✅ Backend logs show "✅ Test mijoz topildi"
✅ Backend logs show "⚖️ Match: true"
✅ Backend logs show "✅ Topildi: 1 ta mijoz" (or more)
✅ Mobile app shows the customer in the dropdown

---

**Last Updated**: Based on context transfer continuation
**Status**: Ready for testing (restart backend first!)
