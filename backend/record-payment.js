const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function recordPayment() {
  try {
    // Find the invoice
    const invoice = await prisma.transaction.findFirst({
      where: { transactionNumber: "INV-2602-0001" },
      include: { customer: true },
    });

    if (!invoice) {
      console.log("Invoice not found!");
      return;
    }

    console.log("Found invoice:", invoice.id, invoice.transactionNumber);
    console.log("Customer:", invoice.customer?.name, "ID:", invoice.customerId);
    console.log("Total Amount:", invoice.totalAmount);
    console.log("Paid Amount:", invoice.paidAmount);

    const amountDue =
      parseFloat(invoice.totalAmount) - parseFloat(invoice.paidAmount || 0);
    console.log("Amount Due:", amountDue);

    // Generate payment number
    const lastPayment = await prisma.payment.findFirst({
      where: { paymentType: "RECEIVE" },
      orderBy: { createdAt: "desc" },
    });

    let paymentNumber = "RCP-0001";
    if (lastPayment?.paymentNumber) {
      const lastNumber = parseInt(lastPayment.paymentNumber.split("-")[1]) || 0;
      paymentNumber = `RCP-${String(lastNumber + 1).padStart(4, "0")}`;
    }

    console.log("Creating payment with number:", paymentNumber);

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        paymentNumber,
        paymentType: "RECEIVE",
        contactId: invoice.customerId,
        amount: amountDue,
        paymentDate: new Date(),
        paymentMethod: "ONLINE",
        reference: "pay_SAiWKFyiW4nXpd",
        notes: "Online payment via Razorpay (manually recorded)",
        status: "CONFIRMED",
        sourceTransactionId: invoice.id,
      },
    });

    console.log("Payment created:", payment.id, payment.paymentNumber);

    // Update invoice
    const newPaidAmount = (parseFloat(invoice.paidAmount) || 0) + amountDue;
    const totalAmount = parseFloat(invoice.totalAmount) || 0;

    let paymentStatus = "NOT_PAID";
    if (newPaidAmount >= totalAmount) {
      paymentStatus = "PAID";
    } else if (newPaidAmount > 0) {
      paymentStatus = "PARTIALLY_PAID";
    }

    await prisma.transaction.update({
      where: { id: invoice.id },
      data: {
        paidAmount: newPaidAmount,
        paymentStatus,
      },
    });

    console.log("Invoice updated! New status:", paymentStatus);
    console.log("Payment recorded successfully!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

recordPayment();
