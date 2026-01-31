const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Create Admin User
  console.log("Creating admin user...");
  const hashedPassword = await bcrypt.hash("Admin@123", 10);
  await prisma.user.create({
    data: {
      loginId: "admin",
      email: "admin@shivfurniture.com",
      name: "Admin User",
      password: hashedPassword,
      role: "admin",
    },
  });

  // Create a demo portal user
  const portalPassword = await bcrypt.hash("Portal@123", 10);
  await prisma.user.create({
    data: {
      loginId: "johndoe",
      email: "john@example.com",
      name: "John Doe",
      password: portalPassword,
      role: "portal",
    },
  });

  // Create Analytical Accounts (Cost Centers)
  console.log("Creating analytical accounts...");
  const production = await prisma.analyticalAccount.create({
    data: {
      code: "PROD",
      name: "Production",
      description: "Manufacturing costs",
    },
  });
  const marketing = await prisma.analyticalAccount.create({
    data: {
      code: "MKT",
      name: "Marketing",
      description: "Marketing & advertising",
    },
  });
  const operations = await prisma.analyticalAccount.create({
    data: {
      code: "OPS",
      name: "Operations",
      description: "Operational expenses",
    },
  });
  const sales = await prisma.analyticalAccount.create({
    data: {
      code: "SALES",
      name: "Sales",
      description: "Sales revenue tracking",
    },
  });

  // Sub-accounts under Production
  const woodwork = await prisma.analyticalAccount.create({
    data: { code: "PROD-WOOD", name: "Woodwork", parentId: production.id },
  });
  const upholstery = await prisma.analyticalAccount.create({
    data: { code: "PROD-UPH", name: "Upholstery", parentId: production.id },
  });
  const finishing = await prisma.analyticalAccount.create({
    data: { code: "PROD-FIN", name: "Finishing", parentId: production.id },
  });

  // Create Vendors
  console.log("Creating vendors...");
  const vendor1 = await prisma.contact.create({
    data: {
      name: "Sharma Timber Works",
      email: "sharma.timber@email.com",
      phone: "9876543210",
      address: "123 Industrial Area, Delhi",
      gstin: "07AAACS1234A1ZZ",
      type: "VENDOR",
    },
  });
  const vendor2 = await prisma.contact.create({
    data: {
      name: "Gupta Hardware Supplies",
      email: "gupta.hw@email.com",
      phone: "9876543211",
      address: "456 Market Road, Gurgaon",
      gstin: "06AABCG5678B1ZZ",
      type: "VENDOR",
    },
  });
  const vendor3 = await prisma.contact.create({
    data: {
      name: "Royal Fabrics",
      email: "royal.fabrics@email.com",
      phone: "9876543212",
      address: "789 Textile Market, Panipat",
      type: "VENDOR",
    },
  });

  // Create Customers
  console.log("Creating customers...");
  const customer1 = await prisma.contact.create({
    data: {
      name: "Raj Interior Solutions",
      email: "raj.interiors@email.com",
      phone: "9988776655",
      address: "100 DLF Phase 2, Gurgaon",
      gstin: "06AABCR1234A1ZZ",
      type: "CUSTOMER",
      isPortalUser: true,
      portalPassword: "customer123",
    },
  });
  const customer2 = await prisma.contact.create({
    data: {
      name: "Home Decor Mart",
      email: "homedecor@email.com",
      phone: "9988776656",
      address: "200 Sector 18, Noida",
      type: "CUSTOMER",
      isPortalUser: true,
      portalPassword: "customer123",
    },
  });
  const customer3 = await prisma.contact.create({
    data: {
      name: "Luxury Living",
      email: "luxury.living@email.com",
      phone: "9988776657",
      address: "300 MG Road, Delhi",
      type: "CUSTOMER",
    },
  });

  // Create Products
  console.log("Creating products...");
  const product1 = await prisma.product.create({
    data: {
      name: "Wooden Dining Table 6-Seater",
      sku: "TBL-DIN-6S",
      unitPrice: 45000,
      unit: "piece",
      hsnCode: "9403",
      gstRate: 18,
    },
  });
  const product2 = await prisma.product.create({
    data: {
      name: "Sofa Set 3+1+1",
      sku: "SOF-311",
      unitPrice: 65000,
      unit: "set",
      hsnCode: "9401",
      gstRate: 18,
    },
  });
  const product3 = await prisma.product.create({
    data: {
      name: "King Size Bed with Storage",
      sku: "BED-KS-STG",
      unitPrice: 55000,
      unit: "piece",
      hsnCode: "9403",
      gstRate: 18,
    },
  });
  const product4 = await prisma.product.create({
    data: {
      name: "Wardrobe 3-Door",
      sku: "WRD-3D",
      unitPrice: 35000,
      unit: "piece",
      hsnCode: "9403",
      gstRate: 18,
    },
  });
  // Raw Materials
  const rawWood = await prisma.product.create({
    data: {
      name: "Sheesham Wood",
      sku: "RAW-SH-CUFT",
      unitPrice: 2500,
      unit: "cuft",
      hsnCode: "4407",
      gstRate: 12,
    },
  });
  const rawFabric = await prisma.product.create({
    data: {
      name: "Upholstery Fabric",
      sku: "RAW-FAB-MTR",
      unitPrice: 800,
      unit: "meter",
      hsnCode: "5407",
      gstRate: 12,
    },
  });
  const hardware = await prisma.product.create({
    data: {
      name: "Hardware Kit",
      sku: "RAW-HW-KIT",
      unitPrice: 1500,
      unit: "kit",
      hsnCode: "8302",
      gstRate: 18,
    },
  });

  // Create Budgets for current month
  console.log("Creating budgets...");
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;

  await prisma.budget.createMany({
    data: [
      {
        analyticalAccountId: production.id,
        year,
        month,
        allocatedAmount: 500000,
      },
      {
        analyticalAccountId: marketing.id,
        year,
        month,
        allocatedAmount: 100000,
      },
      {
        analyticalAccountId: operations.id,
        year,
        month,
        allocatedAmount: 150000,
      },
      { analyticalAccountId: sales.id, year, month, allocatedAmount: 800000 },
      {
        analyticalAccountId: woodwork.id,
        year,
        month,
        allocatedAmount: 200000,
      },
      {
        analyticalAccountId: upholstery.id,
        year,
        month,
        allocatedAmount: 150000,
      },
      {
        analyticalAccountId: finishing.id,
        year,
        month,
        allocatedAmount: 100000,
      },
    ],
  });

  // Create Auto Analytical Models
  console.log("Creating auto analytical models...");
  await prisma.autoAnalyticalModel.createMany({
    data: [
      {
        name: "Wood → Woodwork",
        productId: rawWood.id,
        analyticalAccountId: woodwork.id,
        priority: 10,
      },
      {
        name: "Fabric → Upholstery",
        productId: rawFabric.id,
        analyticalAccountId: upholstery.id,
        priority: 10,
      },
      {
        name: "Hardware → Finishing",
        productId: hardware.id,
        analyticalAccountId: finishing.id,
        priority: 5,
      },
    ],
  });

  console.log("✅ Seed completed successfully!");
  console.log("");
  console.log("📊 Created:");
  console.log("   - 1 Admin User (admin@shivfurniture.com / admin123)");
  console.log("   - 7 Analytical Accounts");
  console.log("   - 3 Vendors + 3 Customers");
  console.log("   - 7 Products");
  console.log("   - 7 Budgets for current month");
  console.log("   - 3 Auto Analytical Models");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
