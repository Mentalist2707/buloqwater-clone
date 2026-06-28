export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Maxfiylik Siyosati</h1>
        <p className="text-sm text-gray-500 mb-8">Oxirgi yangilanish: 28 Iyun, 2026</p>

        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Kirish</h2>
            <p>
              BuloqWater ("biz", "bizning") sizning maxfiyligingizni himoya qilishga sodiqmiz. 
              Ushbu Maxfiylik Siyosati biz qanday ma'lumotlarni to'playmiz, foydalanishimiz va 
              himoya qilishimizni tushuntiradi.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. To'planadigan Ma'lumotlar</h2>
            <p className="mb-2">Biz quyidagi ma'lumotlarni to'playmiz:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Shaxsiy ma'lumotlar: ism, telefon raqami, manzil</li>
              <li>Kompaniya ma'lumotlari: kompaniya nomi, manzil</li>
              <li>Buyurtma ma'lumotlari: mahsulot, narx, yetkazish holati</li>
              <li>Foydalanish ma'lumotlari: tizimdan foydalanish statistikasi</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Ma'lumotlardan Foydalanish</h2>
            <p className="mb-2">Biz sizning ma'lumotlaringizni quyidagilar uchun ishlatamiz:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Xizmat ko'rsatish va buyurtmalarni boshqarish</li>
              <li>Mijozlar bilan aloqa o'rnatish</li>
              <li>Xizmat sifatini yaxshilash</li>
              <li>Texnik yordam ko'rsatish</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Ma'lumotlarni Himoya Qilish</h2>
            <p>
              Biz sizning shaxsiy ma'lumotlaringizni himoya qilish uchun zamonaviy xavfsizlik 
              choralarini qo'llaymiz:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Shifrlangan ma'lumotlar uzatish (HTTPS/SSL)</li>
              <li>Parollarni xavfsiz saqlash (bcrypt hash)</li>
              <li>Xavfsiz database (PostgreSQL)</li>
              <li>Muntazam xavfsizlik audit</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Ma'lumotlarni Ulashish</h2>
            <p>
              Biz sizning shaxsiy ma'lumotlaringizni uchinchi shaxslarga sotmaymiz yoki ijaraga 
              bermaymiz. Ma'lumotlar faqat xizmat ko'rsatish uchun zarur bo'lganda ulashiladi:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Yetkazib berish xizmatlari (haydovchilar)</li>
              <li>To'lov tizimlari (Click, Payme)</li>
              <li>Hosting provayderlari (Vercel, Neon)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Foydalanuvchi Huquqlari</h2>
            <p className="mb-2">Sizning huquqlaringiz:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Shaxsiy ma'lumotlaringizni ko'rish va yangilash</li>
              <li>Ma'lumotlarni o'chirish so'rovi yuborish</li>
              <li>Ma'lumotlar qayta ishlashga rozilikni bekor qilish</li>
              <li>Shikoyat bildirish</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Cookie va Kuzatuv Texnologiyalari</h2>
            <p>
              Biz tizimda cookie'lardan foydalanish sessiyalarini boshqarish va foydalanuvchi 
              tajribasini yaxshilash uchun foydalanamiz. Cookie'larni brauzer sozlamalaridan 
              o'chirib qo'yishingiz mumkin.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Bolalar Maxfiyligi</h2>
            <p>
              Bizning xizmatimiz 18 yoshdan kichik bolalar uchun mo'ljallanmagan. Biz ongli 
              ravishda 18 yoshdan kichik foydalanuvchilardan shaxsiy ma'lumot to'plamaymiz.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Maxfiylik Siyosatiga O'zgarishlar</h2>
            <p>
              Biz vaqti-vaqti bilan ushbu Maxfiylik Siyosatini yangilashimiz mumkin. 
              O'zgarishlar ushbu sahifada e'lon qilinadi va oxirgi yangilanish sanasi 
              ko'rsatiladi.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Biz Bilan Bog'lanish</h2>
            <p className="mb-2">Maxfiylik haqida savollaringiz bo'lsa, biz bilan bog'laning:</p>
            <ul className="list-none space-y-1">
              <li><strong>Email:</strong> support@buloqwater.uz</li>
              <li><strong>Telefon:</strong> +998 (90) 123-45-67</li>
              <li><strong>Manzil:</strong> Toshkent, O'zbekiston</li>
            </ul>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            © 2026 BuloqWater. Barcha huquqlar himoyalangan.
          </p>
        </div>
      </div>
    </div>
  );
}
