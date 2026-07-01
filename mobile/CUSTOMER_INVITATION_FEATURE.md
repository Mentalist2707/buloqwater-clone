# 📨 Mijozga Taklif Yuborish Tizimi (Customer Invitation System)

**Created**: June 30, 2026
**Status**: Frontend Ready - Backend Implementation Required

---

## 📋 Umumiy Ko'rinish

Agar operator yangi mijoz qo'shmoqchi bo'lsa va kiritgan telefon raqam allaqachon tizimda (boshqa kompaniyada) mavjud bo'lsa, operator o'sha foydalanuvchiga taklif yuborishi mumkin. Foydalanuvchi qabul qilsa, uning barcha ma'lumotlari (ism, manzil, telefon) avtomatik operator kompaniyasiga ko'chiriladi.

---

## 🎯 Funksiya Maqsadi

1. **Dublikat telefon muammosini hal qilish**
2. **User ma'lumotlarini qayta kiritmaslik**
3. **Professional onboarding tajribasi**
4. **User roziligini olish (GDPR/Privacy)**

---

## 📱 Frontend Implementation

### ✅ Qo'shilgan Funksiyalar

#### 1. **Error Handling in `handleCreateCustomer`**
```typescript
// Agar API errorData.userId qaytarsa
if (errorData?.userId) {
  // "Taklif yuborish" tugmasi bilan alert
  Alert.alert(
    "👤 Foydalanuvchi topildi",
    "Unga taklif yuborishingiz mumkin",
    [
      { text: "Bekor qilish" },
      { text: "📨 Taklif yuborish", onPress: () => handleSendInvitation() }
    ]
  );
}
```

#### 2. **Invitation Function**
```typescript
const handleSendInvitation = async (phone: string, userId: string) => {
  const result = await customersService.sendCustomerInvitation({
    phone,
    userId,
  });
  
  if (result.success) {
    Alert.alert("✅ Taklif yuborildi!");
  }
};
```

#### 3. **Service Method**
```typescript
// services/customers.ts
async sendCustomerInvitation(data: {
  phone: string;
  userId: string;
}) {
  return api.post("/customers/invite", data);
}
```

---

## 🔧 Backend Implementation (Required)

### 1. **POST /api/v1/customers - Xato qaytarish**

Agar telefon allaqachon mavjud bo'lsa:

**Response (409 Conflict):**
```json
{
  "success": false,
  "error": "Bu telefon raqam allaqachon mavjud",
  "data": {
    "userId": "user-uuid-123",
    "userName": "John Doe",
    "isFromAnotherCompany": true
  }
}
```

**Important**: 
- `userId` qaytarish SHART - frontend buni tekshiradi
- `isFromAnotherCompany: true` - boshqa kompaniyaga tegishli ekanligini ko'rsatadi

---

### 2. **POST /api/v1/customers/invite - Taklif yuborish**

**Request Body:**
```json
{
  "phone": "+998931535305",
  "userId": "user-uuid-123"
}
```

**Backend Logic:**
1. User va kompaniyani tekshirish
2. Invitation record yaratish (pending status)
3. Notification yuborish:
   - In-app notification
   - SMS (ixtiyoriy)
   - Push notification (ixtiyoriy)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "invitationId": "inv-uuid-456",
    "status": "pending",
    "expiresAt": "2026-07-07T00:00:00Z"
  }
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Bu foydalanuvchiga allaqachon taklif yuborilgan"
}
```

---

### 3. **Database Schema**

#### `customer_invitations` table:
```sql
CREATE TABLE customer_invitations (
  id UUID PRIMARY KEY,
  from_company_id UUID NOT NULL REFERENCES companies(id),
  to_user_id UUID NOT NULL REFERENCES users(id),
  phone VARCHAR(20) NOT NULL,
  status ENUM('pending', 'accepted', 'rejected', 'expired') DEFAULT 'pending',
  invited_by UUID NOT NULL REFERENCES users(id),
  invited_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP,
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '7 days',
  
  UNIQUE(from_company_id, to_user_id, status),
  INDEX idx_to_user_status (to_user_id, status),
  INDEX idx_from_company (from_company_id)
);
```

---

### 4. **GET /api/v1/profile/invitations - User taklif ro'yxati**

User o'z takliflarini ko'rishi uchun (Customer mobile app'da)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "inv-uuid-456",
      "company": {
        "id": "comp-uuid-789",
        "name": "BuloqWater Toshkent",
        "subdomain": "toshkent"
      },
      "invitedBy": {
        "name": "Operator Aziz",
        "role": "OPERATOR"
      },
      "status": "pending",
      "invitedAt": "2026-06-30T10:30:00Z",
      "expiresAt": "2026-07-07T10:30:00Z"
    }
  ]
}
```

---

### 5. **POST /api/v1/profile/invitations/:id/accept - Taklifni qabul qilish**

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Siz muvaffaqiyatli qo'shildingiz",
    "customer": {
      "id": "cust-uuid-999",
      "companyId": "comp-uuid-789",
      "userId": "user-uuid-123",
      "name": "John Doe",
      "phone1": "+998931535305",
      "address": "Toshkent, Chilonzor",
      "bottleBalance": 0,
      "debtBalance": 0
    }
  }
}
```

**Backend Logic:**
1. Invitation statusni "accepted"ga o'zgartirish
2. User ma'lumotlaridan Customer record yaratish:
   ```typescript
   const customer = await Customer.create({
     companyId: invitation.fromCompanyId,
     userId: invitation.toUserId,
     name: user.name,
     phone1: user.phone,
     address: user.address || "",
     // Barcha user ma'lumotlarini ko'chirish
   });
   ```
3. User'ga in-app notification yuborish
4. Operator'ga notification yuborish (qabul qilindi)

---

### 6. **POST /api/v1/profile/invitations/:id/reject - Taklifni rad etish**

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Taklif rad etildi"
}
```

---

## 🔔 Notification System

### Operator uchun notificationlar:
1. **Taklif yuborilganda**: "Taklif yuborildi: +998931535305"
2. **Qabul qilinganda**: "✅ John Doe sizning mijozlaringizga qo'shildi"
3. **Rad etilganda**: "❌ +998931535305 taklifni rad etdi"
4. **Muddati o'tganda**: "⏰ +998931535305 taklifning muddati o'tdi"

### Customer uchun notificationlar:
1. **Taklif kelganda**: "📨 BuloqWater Toshkent sizni mijoz qilmoqchi"
2. **Qabul qilingandan keyin**: "✅ Siz BuloqWater Toshkent mijozisiz"

---

## 🎨 Frontend UI Flow

### Stsenariy 1: User topildi (boshqa kompaniyada)

```
1. Operator +998931535305 kiritadi
2. "Saqlash" bosadi
3. API error qaytaradi: { userId: "abc123" }
4. Alert paydo bo'ladi:

   ┌─────────────────────────────────┐
   │  👤 Foydalanuvchi topildi       │
   ├─────────────────────────────────┤
   │  Bu telefon raqam allaqachon    │
   │  tizimda mavjud.                │
   │                                  │
   │  Unga taklif yuborishingiz      │
   │  mumkin.                         │
   ├─────────────────────────────────┤
   │  [Bekor qilish] [📨 Taklif]    │
   └─────────────────────────────────┘

5. "📨 Taklif yuborish" bosadi
6. API chaqiriladi: POST /customers/invite
7. Muvaffaqiyatli alert:

   ┌─────────────────────────────────┐
   │  ✅ Taklif yuborildi!           │
   ├─────────────────────────────────┤
   │  Foydalanuvchiga taklif         │
   │  yuborildi. U qabul qilgandan   │
   │  keyin avtomatik ravishda       │
   │  ro'yxatda paydo bo'ladi.       │
   ├─────────────────────────────────┤
   │  [Yaxshi]                        │
   └─────────────────────────────────┘
```

### Stsenariy 2: Telefon xuddi shu kompaniyada mavjud

```
   ┌─────────────────────────────────┐
   │  ⚠️ Telefon band                │
   ├─────────────────────────────────┤
   │  Bu telefon sizning             │
   │  kompaniyangizda allaqachon     │
   │  mavjud.                         │
   ├─────────────────────────────────┤
   │  [OK] [Raqamni o'zgartirish]   │
   └─────────────────────────────────┘
```

---

## 🧪 Test Cases

### Frontend Tests:
1. ✅ Telefon mavjud, userId bor → "Taklif yuborish" ko'rinadi
2. ✅ Telefon mavjud, userId yo'q → Oddiy xato
3. ✅ Taklif yuborildi → Success alert
4. ✅ Taklif xato → Error alert

### Backend Tests:
1. User boshqa kompaniyada → userId qaytarish
2. User xuddi shu kompaniyada → userId qaytarmaslik
3. Taklif yaratish → DB'ga yozilishi
4. Taklifni qabul qilish → Customer yaratilishi
5. Dublikat taklif → Xato qaytarish
6. Muddati o'tgan taklif → Expired status

---

## 📊 Database Indexes

```sql
-- Tez qidirish uchun
CREATE INDEX idx_customer_phone ON customers(phone1, company_id);
CREATE INDEX idx_invitation_status ON customer_invitations(to_user_id, status);
CREATE INDEX idx_invitation_expires ON customer_invitations(expires_at) WHERE status = 'pending';
```

---

## 🔐 Security & Privacy

1. **Authorization**: Faqat operator/admin taklif yuborishi mumkin
2. **Rate Limiting**: Bir foydalanuvchiga kuniga maksimal 3 ta taklif
3. **Expiration**: Taklif 7 kun ichida amal qiladi
4. **User Consent**: User qabul qilmaguncha ma'lumotlar ko'chirilmaydi
5. **Audit Log**: Barcha taklif harakatlari log'lanadi

---

## 📝 API Summary

| Endpoint | Method | Maqsad |
|----------|--------|--------|
| `/customers` | POST | Mijoz yaratish (userId qaytarish) |
| `/customers/invite` | POST | Taklif yuborish |
| `/profile/invitations` | GET | User takliflari ro'yxati |
| `/profile/invitations/:id/accept` | POST | Taklifni qabul qilish |
| `/profile/invitations/:id/reject` | POST | Taklifni rad etish |

---

## ✅ Frontend Status

- ✅ UI implemented
- ✅ Error handling
- ✅ Service method
- ✅ User flow
- ⏳ Waiting for backend

## 🚀 Next Steps

1. Backend'da API'larni yaratish
2. Database schema'ni setup qilish
3. Notification sistemasini integratsiya qilish
4. Customer mobile app'da taklif qabul qilish UI'sini yaratish
5. Testing

---

**Frontend Developer**: Kiro AI
**Date**: June 30, 2026
