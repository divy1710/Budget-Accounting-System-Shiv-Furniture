const prisma = require("./src/lib/prisma");

async function checkData() {
  try {
    const salesOrders = await prisma.transaction.findMany({
      where: { type: "SALES_ORDER" },
      take: 5,
      include: { customer: true, vendor: true },
      orderBy: { createdAt: "desc" },
    });

    console.log("=== SALES ORDERS ===");
    console.log("Count:", salesOrders.length);
    salesOrders.forEach((so) => {
      console.log({
        id: so.id,
        number: so.transactionNumber,
        customer: so.customer?.name,
        vendor: so.vendor?.name,
        amount: so.totalAmount,
        status: so.status,
        paymentStatus: so.paymentStatus,
      });
    });

    const purchaseOrders = await prisma.transaction.findMany({
      where: { type: "PURCHASE_ORDER" },
      take: 5,
      include: { customer: true, vendor: true },
      orderBy: { createdAt: "desc" },
    });

    console.log("\n=== PURCHASE ORDERS ===");
    console.log("Count:", purchaseOrders.length);
    purchaseOrders.forEach((po) => {
      console.log({
        id: po.id,
        number: po.transactionNumber,
        customer: po.customer?.name,
        vendor: po.vendor?.name,
        amount: po.totalAmount,
        status: po.status,
        paymentStatus: po.paymentStatus,
      });
    });

    // Check all transaction types
    const allTypes = await prisma.transaction.groupBy({
      by: ["type"],
      _count: true,
    });
    console.log("\n=== ALL TRANSACTION TYPES ===");
    console.log(allTypes);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
