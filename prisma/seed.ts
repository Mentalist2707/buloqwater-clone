import { PrismaClient, Role, CompanyStatus, ProductUnit } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── 1. Super Admin ──────────────────────────────────────────
  const superAdminPassword = await bcrypt.hash("superadmin123", 10);
  
  // Avval mavjud Super Admin-ni tekshiramiz
  let superAdmin = await prisma.user.findFirst({
    where: { phone: "+998901234567", role: Role.SUPER_ADMIN, companyId: null },
  });
  
  if (!superAdmin) {
    superAdmin = await prisma.user.create({
      data: {
        name: "Super Admin",
        phone: "+998901234567",
        password: superAdminPassword,
        role: Role.SUPER_ADMIN,
        companyId: null,
      },
    });
  }
  console.log("✅ Super Admin yaratildi:", superAdmin.phone);

  // ── 2. Demo Kompaniya ────────────────────────────────────────
  const company = await prisma.company.upsert({
    where: { subdomain: "shifo" },
    update: {},
    create: {
      name: "Shifo Suv MChJ",
      subdomain: "shifo",
      status: CompanyStatus.ACTIVE,
      phone: "+998712345678",
      address: "Toshkent sh., Yunusobod tumani",
    },
  });
  console.log("✅ Demo kompaniya yaratildi:", company.subdomain);

  // ── 3. Direktor ──────────────────────────────────────────────
  const directorPassword = await bcrypt.hash("director123", 10);
  let director = await prisma.user.findFirst({
    where: { phone: "+998901111111", companyId: company.id },
  });
  if (!director) {
    director = await prisma.user.create({
      data: {
        name: "Bobur Toshmatov",
        phone: "+998901111111",
        password: directorPassword,
        role: Role.DIRECTOR,
        companyId: company.id,
      },
    });
  }
  console.log("✅ Direktor yaratildi:", director.name);

  // ── 4. Operator ──────────────────────────────────────────────
  const operatorPassword = await bcrypt.hash("operator123", 10);
  let operator = await prisma.user.findFirst({
    where: { phone: "+998902222222", companyId: company.id },
  });
  if (!operator) {
    operator = await prisma.user.create({
      data: {
        name: "Dilnoza Karimova",
        phone: "+998902222222",
        password: operatorPassword,
        role: Role.OPERATOR,
        companyId: company.id,
      },
    });
  }
  console.log("✅ Operator yaratildi:", operator.name);

  // ── 5. Haydovchi ─────────────────────────────────────────────
  const driverPassword = await bcrypt.hash("driver123", 10);
  let driver = await prisma.user.findFirst({
    where: { phone: "+998903333333", companyId: company.id },
  });
  if (!driver) {
    driver = await prisma.user.create({
      data: {
        name: "Jasur Eshmatov",
        phone: "+998903333333",
        password: driverPassword,
        role: Role.DRIVER,
        companyId: company.id,
      },
    });
  }
  console.log("✅ Haydovchi yaratildi:", driver.name);

  // ── 6. Mahsulotlar ───────────────────────────────────────────
  const products = await Promise.all([
    prisma.product.upsert({
      where: { id: "prod-19l-kumush" },
      update: {},
      create: {
        id: "prod-19l-kumush",
        name: "19L Kumush Suv",
        description: "Toza tog' suvidan filtrlangan",
        price: 15000,
        unit: ProductUnit.PIECE,
        isBottle: true,
        companyId: company.id,
      },
    }),
    prisma.product.upsert({
      where: { id: "prod-19l-oltin" },
      update: {},
      create: {
        id: "prod-19l-oltin",
        name: "19L Oltin Suv",
        description: "Premium sifatli mineral suv",
        price: 20000,
        unit: ProductUnit.PIECE,
        isBottle: true,
        companyId: company.id,
      },
    }),
    prisma.product.upsert({
      where: { id: "prod-5l" },
      update: {},
      create: {
        id: "prod-5l",
        name: "5L Suv",
        description: "Kichik idishdagi suv",
        price: 5000,
        unit: ProductUnit.PIECE,
        isBottle: false,
        companyId: company.id,
      },
    }),
  ]);
  console.log("✅ Mahsulotlar yaratildi:", products.length, "ta");

  // ── 7. Demo Mijozlar ─────────────────────────────────────────
  const customer1 = await prisma.customer.upsert({
    where: { phone1_companyId: { phone1: "+998901000001", companyId: company.id } },
    update: {},
    create: {
      name: "Aziza Nazarova",
      phone1: "+998901000001",
      phone2: "+998711000001",
      address: "Yunusobod 7-kvartal, 15-uy",
      landmark: "Sariq darvoza yonida",
      locationLink: "https://yandex.uz/maps/?ll=69.28,41.33",
      bottleBalance: 3,
      companyId: company.id,
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { phone1_companyId: { phone1: "+998901000002", companyId: company.id } },
    update: {},
    create: {
      name: "Sardor Umarov",
      phone1: "+998901000002",
      address: "Mirzo Ulugbek, Tarobiy ko'chasi 22",
      landmark: "Do'kon yonidagi 3-qavat",
      bottleBalance: 1,
      debtBalance: 30000,
      companyId: company.id,
    },
  });
  console.log("✅ Demo mijozlar yaratildi");

  // ── 8. Demo Buyurtma ─────────────────────────────────────────
  const order = await prisma.order.create({
    data: {
      orderNumber: 1,
      companyId: company.id,
      customerId: customer1.id,
      operatorId: operator.id,
      driverId: driver.id,
      status: "ASSIGNED",
      bottlesDelivered: 2,
      totalAmount: 30000,
      items: {
        create: [
          {
            quantity: 2,
            unitPrice: 15000,
            totalPrice: 30000,
            productId: products[0].id,
          },
        ],
      },
    },
  });
  console.log("✅ Demo buyurtma yaratildi:", order.orderNumber);

  console.log("\n🎉 Seed muvaffaqiyatli tugadi!");
  console.log("\n📋 Login ma'lumotlari:");
  console.log("  Super Admin: +998901234567 / superadmin123");
  console.log("  Direktor:    +998901111111 / director123");
  console.log("  Operator:    +998902222222 / operator123");
  console.log("  Haydovchi:   +998903333333 / driver123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
