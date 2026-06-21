# BuloqWater Mobile

React Native (Expo) mobile ilova — suv yetkazib berish tizimi uchun.

## Xususiyatlar

### Haydovchi (Driver)
- Tayinlangan buyurtmalar ro'yxati
- Kunlik statistika (yetkazilgan, summa, idish)
- Mijozga qo'ng'iroq qilish / xaritada ko'rish
- "Yo'lda" deb belgilash
- Buyurtmani yetkazish (to'lov turi, idish qaytarish)

### Operator / Direktor
- Buyurtmalar ro'yxati (filtrlash bilan)
- Yangi buyurtma yaratish (mijoz tanlash + mahsulot savati)
- Haydovchi biriktirish
- Mijozlar boshqaruvi (qidiruv, yaratish)
- Profil va tizimdan chiqish

### Autentifikatsiya
- Telefon + parol bilan kirish
- Avtomatik kompaniya aniqlash (Variant 4)
- Bir nechta kompaniyada bo'lsa — tanlash ekrani
- JWT token (SecureStore'da xavfsiz saqlash)

## O'rnatish

```bash
cd mobile
npm install
npx expo start
```

## Konfiguratsiya

`constants/index.ts` faylida API_BASE_URL ni o'zgartiring:

```typescript
export const API_BASE_URL = __DEV__
  ? "http://192.168.1.100:3000/api/v1"  // Sizning local IP
  : "https://buloqwater.uz/api/v1";
```

## Texnologiyalar

- **Expo SDK 52** + Expo Router
- **React Native** 0.76
- **Zustand** — state management
- **expo-secure-store** — token saqlash
- **TypeScript** — strict mode

## Loyiha strukturasi

```
mobile/
├── app/                    # Expo Router sahifalar
│   ├── (auth)/            # Login, kompaniya tanlash
│   ├── (driver)/          # Haydovchi ekranlari
│   ├── (operator)/        # Operator/Direktor ekranlari
│   ├── _layout.tsx        # Root layout (auth guard)
│   └── index.tsx          # Entry redirect
├── components/ui/         # Qayta ishlatiladigan komponentlar
├── constants/             # Ranglar, labellar, config
├── services/              # API service layer
├── store/                 # Zustand store (auth)
└── types/                 # TypeScript tiplar
```

## API Endpointlar (Backend)

| Endpoint | Method | Tavsif |
|----------|--------|--------|
| `/api/v1/auth/login` | POST | Kirish |
| `/api/v1/auth/select-company` | POST | Kompaniya tanlash |
| `/api/v1/auth/me` | GET | Joriy user |
| `/api/v1/orders` | GET/POST | Buyurtmalar |
| `/api/v1/orders/assign` | POST | Haydovchi biriktirish |
| `/api/v1/orders/deliver` | POST | Yetkazish |
| `/api/v1/customers` | GET/POST | Mijozlar |
| `/api/v1/products` | GET | Mahsulotlar |
| `/api/v1/drivers` | GET | Haydovchilar ro'yxati |
| `/api/v1/driver/tasks` | GET | Haydovchi buyurtmalari |
| `/api/v1/driver/start-delivery` | POST | Yo'lga chiqish |
