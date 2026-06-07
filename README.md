# 💧 BuloqWater - Multi-Tenant Suv Yetkazish Platformasi

Next.js 14 + Prisma + NextAuth.js asosida qurilgan multi-tenant SaaS platforma.

## 🏗 Texnologiyalar

- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS, shadcn/ui
- **Backend:** Next.js Server Actions, NextAuth.js (JWT)
- **Database:** PostgreSQL + Prisma ORM
- **Multi-tenant:** Subdomain-based routing

## 📋 Tizim Rollari

| Rol | Panel | URL |
|-----|-------|-----|
| Super Admin | Kompaniyalar boshqaruvi | `app.buloqwater.uz/superadmin` |
| Direktor | Analitika, xodimlar, mahsulotlar | `[subdomain].buloqwater.uz/admin` |
| Operator | Buyurtmalar, mijozlar | `[subdomain].buloqwater.uz/operator` |
| Haydovchi | Mobil vazifalar (PWA) | `[subdomain].buloqwater.uz/driver` |

## 🚀 Ishga Tushirish

```bash
# 1. Dependencies o'rnatish
npm install

# 2. .env faylini sozlash
cp .env.example .env
# DATABASE_URL va NEXTAUTH_SECRET ni o'zgartiring

# 3. Database yaratish
npx prisma migrate dev --name init

# 4. Demo ma'lumotlar kiritish
npm run db:seed

# 5. Development server
npm run dev
```

## 🔑 Demo Login

| Rol | Telefon | Parol |
|-----|---------|-------|
| Super Admin | +998901234567 | superadmin123 |
| Direktor | +998901111111 | director123 |
| Operator | +998902222222 | operator123 |
| Haydovchi | +998903333333 | driver123 |

## 📂 Loyiha Strukturasi

```
src/
├── actions/          # Server Actions (CRUD)
├── app/
│   ├── (auth)/       # Login sahifasi
│   ├── (superadmin)/ # Super Admin panel
│   ├── (admin)/      # Direktor panel
│   ├── (operator)/   # Operator panel
│   └── (driver)/     # Haydovchi panel (Mobile)
├── components/       # UI komponentlar
├── lib/              # Auth, Prisma, Utils
├── middleware.ts     # Role-based access control
└── types/            # TypeScript types
```

## 📦 Asosiy Funksiyalar

- ✅ Multi-tenant subdomain routing
- ✅ JWT autentifikatsiya (cookie-based)
- ✅ Role-based middleware himoyasi
- ✅ Kompaniya yaratish va boshqarish (Super Admin)
- ✅ Xodimlar va mahsulotlar CRUD (Direktor)
- ✅ Buyurtma qabul qilish va haydovchiga biriktirish (Operator)
- ✅ Mijoz bazasi (autocomplete qidiruv)
- ✅ Mobil-friendly haydovchi paneli (PWA)
- ✅ Buyurtma yetkazish + idish/to'lov hisobi
- ✅ Kunlik/haftalik analitika

## 🛡 Xavfsizlik

- Parollar bcrypt bilan hash qilinadi
- JWT tokenlar cookie-da xavfsiz saqlanadi
- Middleware har bir so'rovni role bo'yicha tekshiradi
- Subdomain va companyId mos kelishi validatsiya qilinadi
