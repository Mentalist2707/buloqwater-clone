export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Foydalanish Shartlari</h1>
        <p className="text-sm text-gray-500 mb-8">Oxirgi yangilanish: 28 Iyun, 2026</p>

        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Shartlarni Qabul Qilish</h2>
            <p>
              BuloqWater xizmatidan foydalanish orqali siz ushbu Foydalanish Shartlariga 
              rozilik bildirasiz. Agar shartlarga rozi bo'lmasangiz, xizmatdan foydalanmang.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Xizmat Tavsifi</h2>
            <p>
              BuloqWater suv yetkazib berish xizmatini boshqarish uchun mo'ljallangan 
              platformadir. Xizmat quyidagilarni o'z ichiga oladi:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Suv buyurtma qilish va boshqarish</li>
              <li>Yetkazib berish jarayonini kuzatish</li>
              <li>To'lovlarni boshqarish</li>
              <li>Mijozlar va kompaniyalar uchun boshqaruv tizimi</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Foydalanuvchi Majburiyatlari</h2>
            <p className="mb-2">Xizmatdan foydalanishda siz quyidagilarga majbursiz:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>To'g'ri va aniq ma'lumot berish</li>
              <li>Akkaunt xavfsizligini saqlash</li>
              <li>Parolni maxfiy saqlash va uchinchi shaxslarga bermaslik</li>
              <li>Qonuniy maqsadlarda foydalanish</li>
              <li>Xizmatga zarar yetkazmaydigan harakatlar qilish</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Taqiqlangan Harakatlar</h2>
            <p className="mb-2">Quyidagi harakatlar qat'iyan man etiladi:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Boshqa foydalanuvchi akkountiga ruxsatsiz kirish</li>
              <li>Tizimga zarar yetkazish yoki buzish urinishi</li>
              <li>Soxta ma'lumot berish</li>
              <li>Xizmatni qonunbuzarlik maqsadlarida ishlatish</li>
              <li>Spam yoki zararli kontent yuborish</li>
              <li>Xizmatni nusxalash yoki qayta sotish</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. To'lovlar va Qaytarish</h2>
            <p>
              Buyurtmalar uchun to'lovlar naqd, Click yoki Payme orqali amalga oshiriladi. 
              To'lovlar qaytarilishi quyidagi hollarda mumkin:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Buyurtma yetkazilmagan</li>
              <li>Mahsulot sifati kafolat shartlariga mos kelmagan</li>
              <li>Xizmat ko'rsatishda jiddiy xatoliklar</li>
            </ul>
            <p className="mt-2">
              Qaytarish so'rovlari 7 ish kuni ichida ko'rib chiqiladi.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Intellektual Mulk</h2>
            <p>
              BuloqWater platformasining barcha kontenti, dizayni, logo va boshqa elementlari 
              mualliflik huquqi bilan himoyalangan. Ruxsatsiz nusxalash, tarqatish yoki 
              tijorat maqsadlarida foydalanish qat'iyan man etiladi.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Xizmatni To'xtatish</h2>
            <p>
              Biz quyidagi hollarda ogohlantirmasdan xizmatni to'xtatish huquqini saqlab qolamiz:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Foydalanish shartlarini buzish</li>
              <li>Tizimga zarar yetkazish urinishi</li>
              <li>Soxta ma'lumot berish</li>
              <li>To'lovlarni amalga oshirmaslik</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Javobgarlikni Cheklash</h2>
            <p>
              BuloqWater quyidagilar uchun javobgar emas:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Uchinchi tomon xizmatlari (to'lov tizimlari) sabab bo'lgan muammolar</li>
              <li>Internet aloqasi yoki texnik nosozliklar</li>
              <li>Foydalanuvchi tomonidan noto'g'ri ma'lumot berish natijasida kelib chiqqan muammolar</li>
              <li>Force majeure holatlari (tabiiy ofatlar, urush, pandemiya)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Maxfiylik</h2>
            <p>
              Sizning shaxsiy ma'lumotlaringiz bizning{" "}
              <a href="/privacy" className="text-blue-600 hover:underline">
                Maxfiylik Siyosatimiz
              </a>
              {" "}ga muvofiq qayta ishlanadi va himoya qilinadi.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Shartlarga O'zgarishlar</h2>
            <p>
              Biz vaqti-vaqti bilan ushbu Foydalanish Shartlarini yangilashimiz mumkin. 
              Muhim o'zgarishlar haqida foydalanuvchilar xabardor qilinadi. O'zgarishlardan 
              keyin xizmatdan foydalanishni davom ettirish yangi shartlarni qabul qilishni 
              bildiradi.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Qonun va Yurisdiksiya</h2>
            <p>
              Ushbu shartlar O'zbekiston Respublikasi qonunlariga muvofiq tartibga solinadi. 
              Har qanday nizolar O'zbekiston Respublikasi sudlarida hal qilinadi.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Biz Bilan Bog'lanish</h2>
            <p className="mb-2">Savollar yoki takliflaringiz bo'lsa, biz bilan bog'laning:</p>
            <ul className="list-none space-y-1">
              <li><strong>Email:</strong> support@buloqwater.uz</li>
              <li><strong>Telefon:</strong> +998 (90) 123-45-67</li>
              <li><strong>Manzil:</strong> Toshkent, O'zbekiston</li>
              <li><strong>Ish vaqti:</strong> Dushanba-Shanba, 9:00-18:00</li>
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
