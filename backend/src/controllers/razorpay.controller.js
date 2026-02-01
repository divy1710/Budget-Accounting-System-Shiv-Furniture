const razorpayService = require("../services/razorpay.service");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * Get Razorpay Key ID (public key for frontend)
 */
const getKeyId = async (req, res) => {
  try {
    res.json({
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Error getting key ID:", error);
    res.status(500).json({ error: "Failed to get Razorpay key" });
  }
};

/**
 * Create a new Razorpay order for invoice payment
 */
const createOrder = async (req, res) => {
  try {
    const { invoiceId, amount } = req.body;

    if (!invoiceId || !amount) {
      return res
        .status(400)
        .json({ error: "Invoice ID and amount are required" });
    }

    // Fetch the invoice to validate
    const invoice = await prisma.transaction.findUnique({
      where: { id: invoiceId },
      include: { customer: true },
    });

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    if (invoice.status !== "CONFIRMED") {
      return res
        .status(400)
        .json({ error: "Invoice must be confirmed before payment" });
    }

    // Create Razorpay order
    const receipt = `inv_${invoice.transactionNumber}_${Date.now()}`;
    const notes = {
      invoiceId: invoice.id,
      invoiceNumber: invoice.transactionNumber,
      customerId: invoice.customerId?.toString() || "",
      customerName: invoice.customer?.name || "",
    };

    const order = await razorpayService.createOrder(
      amount,
      "INR",
      receipt,
      notes,
    );

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create payment order" });
  }
};

/**
 * Verify payment and create payment record
 */
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      invoiceId,
      amount,
      customerId,
    } = req.body;

    console.log("Verifying payment:", {
      razorpay_order_id,
      razorpay_payment_id,
      invoiceId,
      amount,
      customerId,
    });

    // Verify signature
    const isValid = razorpayService.verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    );

    if (!isValid) {
      console.log("Invalid signature");
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    // Fetch payment details from Razorpay
    const paymentDetails =
      await razorpayService.fetchPayment(razorpay_payment_id);
    console.log("Payment details:", paymentDetails.status);

    if (
      paymentDetails.status !== "captured" &&
      paymentDetails.status !== "authorized"
    ) {
      return res.status(400).json({ error: "Payment not captured" });
    }

    // Fetch the invoice
    const invoice = await prisma.transaction.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

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

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        paymentNumber,
        paymentType: "RECEIVE",
        contactId: parseInt(customerId),
        amount: parseFloat(amount),
        paymentDate: new Date(),
        paymentMethod: "ONLINE",
        reference: razorpay_payment_id,
        notes: `Online payment via Razorpay. Order ID: ${razorpay_order_id}`,
        status: "CONFIRMED",
        sourceTransactionId: invoiceId,
      },
    });

    // Update invoice paid amount
    const newPaidAmount = (parseFloat(invoice.paidAmount) || 0) + amount;
    const totalAmount = parseFloat(invoice.totalAmount) || 0;

    let paymentStatus = "NOT_PAID";
    if (newPaidAmount >= totalAmount) {
      paymentStatus = "PAID";
    } else if (newPaidAmount > 0) {
      paymentStatus = "PARTIALLY_PAID";
    }

    await prisma.transaction.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        paymentStatus,
      },
    });

    res.json({
      success: true,
      message: "Payment verified and recorded successfully",
      payment: {
        id: payment.id,
        paymentNumber: payment.paymentNumber,
        amount: payment.amount,
        reference: payment.reference,
      },
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ error: "Failed to verify payment" });
  }
};

/**
 * Get payment status
 */
const getPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await razorpayService.fetchPayment(paymentId);

    res.json({
      id: payment.id,
      status: payment.status,
      amount: payment.amount / 100, // Convert from paise to INR
      currency: payment.currency,
      method: payment.method,
      email: payment.email,
      contact: payment.contact,
      createdAt: new Date(payment.created_at * 1000),
    });
  } catch (error) {
    console.error("Error fetching payment status:", error);
    res.status(500).json({ error: "Failed to fetch payment status" });
  }
};

/**
 * Initiate refund
 */
const initiateRefund = async (req, res) => {
  try {
    const { paymentId, amount } = req.body;

    if (!paymentId) {
      return res.status(400).json({ error: "Payment ID is required" });
    }

    const refund = await razorpayService.initiateRefund(paymentId, amount);

    res.json({
      id: refund.id,
      paymentId: refund.payment_id,
      amount: refund.amount / 100, // Convert from paise to INR
      status: refund.status,
      createdAt: new Date(refund.created_at * 1000),
    });
  } catch (error) {
    console.error("Error initiating refund:", error);
    res.status(500).json({ error: "Failed to initiate refund" });
  }
};

module.exports = {
  getKeyId,
  createOrder,
  verifyPayment,
  getPaymentStatus,
  initiateRefund,
};
