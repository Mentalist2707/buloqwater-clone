# 🚀 Quick Fix: Customer Search Not Working

## The Problem
Searching for phone "931535305" returns 0 results, but customer exists in database.

## The Solution (90% Likely)

### ⚠️ STEP 1: RESTART BACKEND SERVER
```bash
# Press Ctrl+C in the terminal running the backend
# Then:
npm run dev
```

### ✅ STEP 2: Test Again
Search for "931535305" in the mobile app.

### 👀 STEP 3: Check Backend Console
Look for this in the **backend terminal** (NOT mobile):
```
⚖️ Match: true    ← GOOD! Customer found!
⚖️ Match: false   ← PROBLEM! Company mismatch!
```

## If Match is FALSE (Company Mismatch)

**Problem**: Customer belongs to Company A, but operator logged into Company B.

**Fix**:
1. Log out of mobile app
2. Log back in
3. At company selection screen, choose the CORRECT company
4. Try search again

## How to Find the Correct Company?

Check the backend logs:
```
🔬 Test: 931535305 raqamli mijozni qidirish...
✅ Test mijoz topildi: {...}
🏢 Mijoz companyId: abc-123-xyz      ← Customer's company
🏢 Auth companyId: def-456-uvw       ← Operator's company
⚖️ Match: false                       ← They don't match!
```

The operator needs to log in with company ID: `abc-123-xyz`

## SQL Query to Check

```sql
-- See which company the customer belongs to
SELECT 
  c.name as customer_name,
  c.phone1,
  co.name as company_name,
  c."companyId"
FROM customers c
JOIN companies co ON c."companyId" = co.id
WHERE c.phone1 LIKE '%931535305%';
```

## What Was Fixed in Code?

✅ Backend now searches case-insensitively
✅ Backend now searches phone2 and landmark too
✅ Backend logs detailed debug info
✅ Frontend tries multiple phone formats

## Still Not Working?

Share these logs from **backend console**:
```
🔍 Backend qidiruv: ...
🏢 CompanyId: ...
📊 Kompaniyadagi barcha mijozlar: ...
🔬 Test: 931535305 ...
⚖️ Match: ...
```

---
**TL;DR**: Restart backend, test, check logs for "Match: true/false"
