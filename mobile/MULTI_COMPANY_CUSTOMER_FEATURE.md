# 🏢 Multi-Company Customer System (Bir Mijoz - Ko'p Kompaniya)

**Created**: June 30, 2026
**Status**: Design Complete - Implementation Pending

---

## 📋 Umumiy Ko'rinish

Bir mijoz (user) bir nechta suv kompaniyasiga buyurtma berishi mumkin. Masalan, uyiga va ishiga turli kompaniyalardan suv olishi mumkin.

---

## 🎯 Tizim Arxitekturasi

### Database Schema

```sql
-- Users table (system-wide, shared across companies)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Customers table (company-specific)
CREATE TABLE customers (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id),
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Company-specific info
  address TEXT NOT NULL,
  landmark TEXT,
  location_link TEXT,
  bottle_balance INTEGER DEFAULT 0,
  debt_balance DECIMAL(10,2) DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- One user can be customer in multiple companies
  UNIQUE(company_id, user_id),
  INDEX idx_user (user_id),
  INDEX idx_company_user (company_id, user_id)
);
```

### Muhim Qoidalar

1. **User** - tizim bo'ylab yagona (phone number unique)
2. **Customer** - kompaniya-specific (har bir kompaniyada alohida)
3. Bir **user** ko'p **customer** record'lariga ega bo'lishi mumkin
4. Har bir **customer** faqat bitta kompaniyaga tegishli

---

## 🔍 Qidiruv API Logikasi

### GET /api/v1/customers?search={query}

**Backend Logic:**
```typescript
async function searchCustomers(companyId: string, search: string) {
  // 1. Avval o'z kompaniya mijozlarini qidirish
  const ownCustomers = await Customer.findAll({
    where: {
      companyId,
      [Op.or]: [
        { '$user.name$': { [Op.iLike]: `%${search}%` } },
        { '$user.phone$': { [Op.like]: `%${search}%` } },
        { address: { [Op.iLike]: `%${search}%` } }
      ]
    },
    include: [{ model: User }]
  });
  
  // 2. Agar phone raqam to'liq kiritilgan bo'lsa (10+ belgi)
  if (search.length >= 10 && search.match(/^\+?998\d{9}$/)) {
    const user = await User.findOne({ where: { phone: search } });
    
    if (user) {
      // User mavjud - boshqa kompaniyada mijozmi?
      const otherCompanyCustomer = await Customer.findOne({
        where: {
          userId: user.id,
          companyId: { [Op.ne]: companyId }
        },
        include: [{ model: Company, attributes: ['name'] }]
      });
      
      return {
        ownCustomers,
        userExists: true,
        userId: user.id,
        userName: user.name,
        userPhone: user.phone,
        isCustomerInOtherCompany: !!otherCompanyCustomer,
        otherCompanyName: otherCompanyCustomer?.company?.name
      };
    }
  }
  
  return {
    ownCustomers,
    userExists: false
  };
}
```

**Response Format:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "cust-123",
        "user": {
          "id": "user-456",
          "name": "John Doe",
          "phone": "+998901234567"
        },
        "address": "Toshkent, Chilonzor",
        "bottleBalance": 2,
        "debtBalance": 50000
      }
    ],
    "userStatus": {
      "exists": true,
      "userId": "user-456",
      "userName": "John Doe",
      "phone": "+998901234567",
      "isYourCustomer": true,
      "otherCompanies": ["BuloqWater Samarqand"]
    }
  }
}
```

---

## 📱 Frontend UI States

### 1. **Mijoz topildi (O'z kompaniyada)**

```
┌────────────────────────────────────┐
│  👤 John Doe          ✓ Mijoz     │
│  +998901234567 · Toshkent...      │
└────────────────────────────────────┘
  ↑ Yashil badge - o'z mijozimiz
```

### 2. **User topildi (Boshqa kompaniyada)**

```
┌────────────────────────────────────┐
│  ℹ️ +998901234567                  │
│  Bu raqam tizimda mavjud lekin     │
│  sizning mijozingiz emas.          │
│                                     │
│  🏢 Boshqa kompaniya: BuloqWater   │
│      Samarqand                      │
│                                     │
│  📨 Taklif yuborishingiz mumkin    │
└────────────────────────────────────┘
│  [📨 Taklif yuborish] [+ Qo'shish]│
└────────────────────────────────────┘
```

### 3. **User topilmadi (Yangi)**

```
┌────────────────────────────────────┐
│  🔍 Mijoz topilmadi                │
│                                     │
│  Bu raqam tizimda mavjud emas.     │
└────────────────────────────────────┘
│  [+ Yangi mijoz qo'shish]          │
└────────────────────────────────────┘
```

### 4. **User bosh (Ikkalasida ham emas)**

```
┌────────────────────────────────────┐
│  ℹ️ +998901234567                  │
│  Bu user tizimda mavjud lekin      │
│  hech qaysi kompaniyada mijoz emas.│
│                                     │
│  Uni o'zingizga qo'shishingiz      │
│  mumkin.                            │
└────────────────────────────────────┘
│  [+ Mijoz qilish] [📨 Taklif]     │
└────────────────────────────────────┘
```

---

## 🎨 Frontend Component Update

### Customer Dropdown Item (with status)

```tsx
<TouchableOpacity style={styles.customerOption}>
  <View style={styles.customerAvatar}>
    <Text>{customer.name[0]}</Text>
  </View>
  
  <View style={{ flex: 1 }}>
    <View style={styles.nameRow}>
      <Text style={styles.name}>{customer.name}</Text>
      
      {/* Status Badge */}
      <View style={[styles.badge, { backgroundColor: '#d1fae5' }]}>
        <Text style={styles.badgeText}>✓ Mijoz</Text>
      </View>
    </View>
    
    <Text style={styles.info}>
      {customer.phone} · {customer.address}
    </Text>
  </View>
</TouchableOpacity>
```

### User Status Info Box

```tsx
{userStatus?.exists && !userStatus.isYourCustomer && (
  <View style={styles.userStatusBox}>
    <Ionicons name="information-circle" size={24} color="#6366f1" />
    
    <View style={{ flex: 1 }}>
      <Text style={styles.statusTitle}>
        📱 {userStatus.phone}
      </Text>
      
      <Text style={styles.statusText}>
        Bu user tizimda mavjud
        {userStatus.otherCompanies?.length > 0 && (
          <Text> ({userStatus.otherCompanies.join(", ")} da mijoz)</Text>
        )}
      </Text>
      
      <Text style={styles.statusHint}>
        Taklif yuborishingiz yoki qo'shishingiz mumkin
      </Text>
    </View>
  </View>
)}
```

---

## 🔄 User → Customer Flow

### Scenario 1: User boshqa kompaniyada mijoz

**1. Operator phone kiritadi: +998901234567**
```typescript
searchCustomers("+998901234567")
```

**2. Backend response:**
```json
{
  "items": [],
  "userStatus": {
    "exists": true,
    "userId": "user-123",
    "userName": "John Doe",
    "phone": "+998901234567",
    "isYourCustomer": false,
    "isCustomerInOtherCompany": true,
    "otherCompanies": ["BuloqWater Samarqand"]
  }
}
```

**3. Frontend ko'rsatadi:**
- Info box: "Bu user BuloqWater Samarqand'da mijoz"
- 2 ta tugma:
  - "📨 Taklif yuborish" - invitation yuboradi
  - "+ Qo'shish" - to'g'ridan-to'g'ri qo'shadi

**4. Agar "Qo'shish" bosilsa:**
```typescript
POST /customers/add-existing
{
  "userId": "user-123",
  "address": "Toshkent, Chilonzor",  // yangi manzil
  "landmark": "...",
  "locationLink": "..."
}
```

**5. Backend:**
```typescript
async function addExistingUser(companyId, userId, data) {
  // Check if already customer
  const existing = await Customer.findOne({
    where: { companyId, userId }
  });
  
  if (existing) {
    throw new Error("Bu user allaqachon mijozingiz");
  }
  
  // Create new customer record
  return await Customer.create({
    companyId,
    userId,
    address: data.address,
    landmark: data.landmark,
    locationLink: data.locationLink,
    bottleBalance: 0,
    debtBalance: 0
  });
}
```

---

### Scenario 2: User tizimda yo'q (Yangi)

**1. Operator phone kiritadi: +998909999999**

**2. Backend response:**
```json
{
  "items": [],
  "userStatus": {
    "exists": false
  }
}
```

**3. Frontend:** 
- "Mijoz topilmadi"
- "+ Yangi mijoz qo'shish" tugmasi

**4. Forma to'ldiriladi:**
```json
{
  "name": "New User",
  "phone1": "+998909999999",
  "address": "Toshkent, Yunusobod"
}
```

**5. Backend:**
```typescript
async function createCustomer(companyId, data) {
  // 1. Create or find user
  let user = await User.findOne({ where: { phone: data.phone1 } });
  
  if (!user) {
    user = await User.create({
      phone: data.phone1,
      name: data.name
    });
  }
  
  // 2. Create customer record
  return await Customer.create({
    companyId,
    userId: user.id,
    address: data.address,
    landmark: data.landmark,
    locationLink: data.locationLink
  });
}
```

---

## 📊 API Endpoints Summary

| Endpoint | Method | Maqsad |
|----------|--------|--------|
| `/customers?search=phone` | GET | Qidirish + user status |
| `/customers` | POST | Yangi user + customer yaratish |
| `/customers/add-existing` | POST | Mavjud user'ni customer qilish |
| `/customers/invite` | POST | Taklif yuborish |
| `/users/check-phone/:phone` | GET | User mavjudligini tekshirish |

---

## ✅ Frontend Implementation Checklist

- ✅ Status badge qo'shildi ("✓ Mijoz")
- ✅ User status info box dizayni
- ⏳ Backend integration (API response structure)
- ⏳ "Qo'shish" tugmasi va modal
- ⏳ Real-time user check

---

## 🔧 Backend Implementation Tasks

1. **Database**:
   - ✅ `users` table (phone unique)
   - ✅ `customers` table (company_id + user_id unique)
   - ⏳ Migration va seed data

2. **API**:
   - ⏳ Search endpoint yangilash (user status qo'shish)
   - ⏳ Add existing user endpoint
   - ⏳ Check phone endpoint

3. **Business Logic**:
   - ⏳ Duplicate prevention
   - ⏳ User-Customer relationship
   - ⏳ Multi-company support

---

**Status**: 🎨 Design Complete - 🔧 Backend Implementation Needed
**Priority**: High
**Estimated Backend Time**: 2-3 days

