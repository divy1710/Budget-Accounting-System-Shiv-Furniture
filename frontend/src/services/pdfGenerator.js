import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Company Details
const COMPANY = {
  name: "SHIV FURNITURE",
  address: "123 Industrial Area, Phase II",
  city: "Mumbai, MH 400001",
  gstin: "27AAAA0000A1Z5",
  phone: "+91 22 1234 5678",
  email: "billing@shivfurniture.com",
  website: "www.shivfurniture.com",
};

// Format currency for PDF (using Rs. instead of ₹ for font compatibility)
const formatCurrency = (amount) => {
  const safeAmount = Number(amount) || 0;
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmount);
  return `Rs. ${formatted}`;
};

// Format date
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/**
 * Generate Invoice PDF
 */
export const generateInvoicePDF = (invoice) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Colors
  const primaryColor = [79, 70, 229]; // Indigo
  const grayColor = [107, 114, 128];
  const darkColor = [17, 24, 39];

  // Header - Company Name
  doc.setFontSize(24);
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text(COMPANY.name, 20, 25);

  // Company Address
  doc.setFontSize(10);
  doc.setTextColor(...grayColor);
  doc.setFont("helvetica", "normal");
  doc.text(COMPANY.address, 20, 33);
  doc.text(COMPANY.city, 20, 38);
  doc.text(`GSTIN: ${COMPANY.gstin}`, 20, 43);

  // Invoice Title - Right Side
  doc.setFontSize(28);
  doc.setTextColor(...darkColor);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", pageWidth - 20, 25, { align: "right" });

  // Invoice Number & Status
  doc.setFontSize(11);
  doc.setTextColor(...grayColor);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.transactionNumber || "INV-0000", pageWidth - 20, 33, {
    align: "right",
  });

  // Status badge
  const status =
    invoice.paymentStatus === "PAID" ? "PAID" : invoice.status || "PENDING";
  const statusColor =
    status === "PAID"
      ? [16, 185, 129]
      : status === "CONFIRMED"
        ? [245, 158, 11]
        : [239, 68, 68];
  doc.setFillColor(...statusColor);
  doc.roundedRect(pageWidth - 45, 36, 25, 8, 2, 2, "F");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(status, pageWidth - 32.5, 41.5, { align: "center" });

  // Divider line
  doc.setDrawColor(229, 231, 235);
  doc.line(20, 55, pageWidth - 20, 55);

  // Bill To Section
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO", 20, 65);

  doc.setFontSize(12);
  doc.setTextColor(...darkColor);
  doc.text(invoice.customer?.name || "Customer", 20, 73);

  doc.setFontSize(10);
  doc.setTextColor(...grayColor);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.customer?.address || "Address not provided", 20, 80);
  if (invoice.customer?.phone) {
    doc.text(`Phone: ${invoice.customer.phone}`, 20, 86);
  }

  // Invoice Details - Right Side
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE DATE", pageWidth - 70, 65);
  doc.text("DUE DATE", pageWidth - 70, 80);
  if (invoice.reference) {
    doc.text("P.O. NUMBER", pageWidth - 70, 95);
  }

  doc.setTextColor(...darkColor);
  doc.setFont("helvetica", "normal");
  doc.text(formatDate(invoice.transactionDate), pageWidth - 20, 65, {
    align: "right",
  });
  doc.text(formatDate(invoice.dueDate), pageWidth - 20, 80, { align: "right" });
  if (invoice.reference) {
    doc.text(invoice.reference, pageWidth - 20, 95, { align: "right" });
  }

  // Line Items Table
  const tableStartY = invoice.reference ? 110 : 100;
  const tableData = (invoice.lines || []).map((line, index) => [
    index + 1,
    line.product?.name || "Product",
    line.quantity,
    formatCurrency(line.unitPrice),
    formatCurrency(line.lineTotal || line.quantity * line.unitPrice),
  ]);

  autoTable(doc, {
    startY: tableStartY,
    head: [["#", "Description", "Qty", "Price", "Amount"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 10,
      textColor: darkColor,
    },
    columnStyles: {
      0: { cellWidth: 15, halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 25, halign: "center" },
      3: { cellWidth: 35, halign: "right" },
      4: { cellWidth: 40, halign: "right" },
    },
    margin: { left: 20, right: 20 },
  });

  // Totals Section
  const finalY = doc.lastAutoTable.finalY + 10;
  const subtotal = (invoice.lines || []).reduce(
    (sum, line) =>
      sum + Number(line.lineTotal || line.quantity * line.unitPrice || 0),
    0,
  );
  const tax = subtotal * 0.18;
  const total = Number(invoice.totalAmount) || subtotal + tax;
  const paidAmount = Number(invoice.paidAmount) || 0;
  const amountDue = total - paidAmount;

  // Totals box
  const totalsX = pageWidth - 90;

  doc.setFontSize(10);
  doc.setTextColor(...grayColor);
  doc.text("Subtotal:", totalsX, finalY);
  doc.setTextColor(...darkColor);
  doc.text(formatCurrency(subtotal), pageWidth - 20, finalY, {
    align: "right",
  });

  doc.setTextColor(...grayColor);
  doc.text("Tax (GST 18%):", totalsX, finalY + 8);
  doc.setTextColor(...darkColor);
  doc.text(formatCurrency(tax), pageWidth - 20, finalY + 8, { align: "right" });

  if (paidAmount > 0) {
    doc.setTextColor(...grayColor);
    doc.text("Paid Amount:", totalsX, finalY + 16);
    doc.setTextColor(16, 185, 129);
    doc.text(`-${formatCurrency(paidAmount)}`, pageWidth - 20, finalY + 16, {
      align: "right",
    });
  }

  // Total line
  const totalLineY = paidAmount > 0 ? finalY + 26 : finalY + 18;
  doc.setDrawColor(229, 231, 235);
  doc.line(totalsX, totalLineY, pageWidth - 20, totalLineY);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryColor);
  doc.text("TOTAL:", totalsX, totalLineY + 10);
  doc.text(formatCurrency(total), pageWidth - 20, totalLineY + 10, {
    align: "right",
  });

  if (amountDue > 0 && amountDue !== total) {
    doc.setFontSize(12);
    doc.setTextColor(239, 68, 68);
    doc.text("Amount Due:", totalsX, totalLineY + 20);
    doc.text(formatCurrency(amountDue), pageWidth - 20, totalLineY + 20, {
      align: "right",
    });
  }

  // Terms & Conditions
  const termsY = totalLineY + 40;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...darkColor);
  doc.text("TERMS & CONDITIONS", 20, termsY);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...grayColor);
  const terms = [
    "1. Goods once sold will not be taken back or exchanged.",
    "2. 50% advance required for custom furniture orders.",
    "3. Warranty covers manufacturing defects only for 12 months.",
    "4. Please mention Invoice ID in all payment communications.",
  ];
  terms.forEach((term, i) => {
    doc.text(term, 20, termsY + 8 + i * 6);
  });

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setDrawColor(229, 231, 235);
  doc.line(20, footerY - 10, pageWidth - 20, footerY - 10);

  doc.setFontSize(9);
  doc.setTextColor(...grayColor);
  doc.text(COMPANY.website, 20, footerY);
  doc.text(COMPANY.email, pageWidth / 2, footerY, { align: "center" });

  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "italic");
  doc.text("Thank you for choosing Shiv Furniture!", pageWidth - 20, footerY, {
    align: "right",
  });

  // Save PDF
  doc.save(`${invoice.transactionNumber || "Invoice"}.pdf`);
};

/**
 * Generate Vendor Bill PDF
 */
export const generateBillPDF = (bill) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Colors
  const primaryColor = [79, 70, 229];
  const grayColor = [107, 114, 128];
  const darkColor = [17, 24, 39];

  // Header
  doc.setFontSize(24);
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text(COMPANY.name, 20, 25);

  doc.setFontSize(10);
  doc.setTextColor(...grayColor);
  doc.setFont("helvetica", "normal");
  doc.text(COMPANY.address, 20, 33);
  doc.text(COMPANY.city, 20, 38);

  // Bill Title
  doc.setFontSize(28);
  doc.setTextColor(...darkColor);
  doc.setFont("helvetica", "bold");
  doc.text("VENDOR BILL", pageWidth - 20, 25, { align: "right" });

  doc.setFontSize(11);
  doc.setTextColor(...grayColor);
  doc.setFont("helvetica", "normal");
  doc.text(bill.transactionNumber || "BILL-0000", pageWidth - 20, 33, {
    align: "right",
  });

  // Divider
  doc.setDrawColor(229, 231, 235);
  doc.line(20, 50, pageWidth - 20, 50);

  // Vendor Info
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text("VENDOR", 20, 60);

  doc.setFontSize(12);
  doc.setTextColor(...darkColor);
  doc.text(bill.vendor?.name || "Vendor", 20, 68);

  doc.setFontSize(10);
  doc.setTextColor(...grayColor);
  doc.setFont("helvetica", "normal");
  doc.text(bill.vendor?.address || "Address not provided", 20, 75);

  // Bill Details
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text("BILL DATE", pageWidth - 70, 60);
  doc.text("DUE DATE", pageWidth - 70, 75);

  doc.setTextColor(...darkColor);
  doc.setFont("helvetica", "normal");
  doc.text(formatDate(bill.transactionDate), pageWidth - 20, 60, {
    align: "right",
  });
  doc.text(formatDate(bill.dueDate), pageWidth - 20, 75, { align: "right" });

  // Line Items
  const tableData = (bill.lines || []).map((line, index) => [
    index + 1,
    line.product?.name || "Product",
    line.quantity,
    formatCurrency(line.unitPrice),
    formatCurrency(line.lineTotal || line.quantity * line.unitPrice),
  ]);

  autoTable(doc, {
    startY: 90,
    head: [["#", "Description", "Qty", "Price", "Amount"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 15, halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 25, halign: "center" },
      3: { cellWidth: 35, halign: "right" },
      4: { cellWidth: 40, halign: "right" },
    },
    margin: { left: 20, right: 20 },
  });

  // Totals
  const finalY = doc.lastAutoTable.finalY + 10;
  const subtotal = (bill.lines || []).reduce(
    (sum, line) => sum + Number(line.lineTotal || 0),
    0,
  );
  const tax = subtotal * 0.18;
  const total = Number(bill.totalAmount) || subtotal + tax;

  const totalsX = pageWidth - 90;

  doc.setFontSize(10);
  doc.setTextColor(...grayColor);
  doc.text("Subtotal:", totalsX, finalY);
  doc.text(formatCurrency(subtotal), pageWidth - 20, finalY, {
    align: "right",
  });

  doc.text("Tax (GST 18%):", totalsX, finalY + 8);
  doc.text(formatCurrency(tax), pageWidth - 20, finalY + 8, { align: "right" });

  doc.setDrawColor(229, 231, 235);
  doc.line(totalsX, finalY + 14, pageWidth - 20, finalY + 14);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryColor);
  doc.text("TOTAL:", totalsX, finalY + 24);
  doc.text(formatCurrency(total), pageWidth - 20, finalY + 24, {
    align: "right",
  });

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setFontSize(9);
  doc.setTextColor(...grayColor);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated on ${formatDate(new Date())}`, pageWidth / 2, footerY, {
    align: "center",
  });

  doc.save(`${bill.transactionNumber || "Bill"}.pdf`);
};

/**
 * Generate Payment Receipt PDF
 */
export const generatePaymentReceiptPDF = (payment, invoice = null) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  const primaryColor = [79, 70, 229];
  const grayColor = [107, 114, 128];
  const darkColor = [17, 24, 39];
  const successColor = [16, 185, 129];

  // Header
  doc.setFontSize(24);
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.text(COMPANY.name, 20, 25);

  doc.setFontSize(10);
  doc.setTextColor(...grayColor);
  doc.setFont("helvetica", "normal");
  doc.text(COMPANY.address, 20, 33);
  doc.text(COMPANY.city, 20, 38);
  doc.text(`Phone: ${COMPANY.phone}`, 20, 43);

  // Receipt Title
  doc.setFontSize(28);
  doc.setTextColor(...darkColor);
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT RECEIPT", pageWidth - 20, 25, { align: "right" });

  doc.setFontSize(11);
  doc.setTextColor(...grayColor);
  doc.setFont("helvetica", "normal");
  doc.text(payment.paymentNumber || "RCP-0000", pageWidth - 20, 33, {
    align: "right",
  });

  // Success badge
  doc.setFillColor(...successColor);
  doc.roundedRect(pageWidth - 45, 36, 25, 8, 2, 2, "F");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("PAID", pageWidth - 32.5, 41.5, { align: "center" });

  // Divider
  doc.setDrawColor(229, 231, 235);
  doc.line(20, 55, pageWidth - 20, 55);

  // Receipt Details Box
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(20, 65, pageWidth - 40, 60, 3, 3, "F");

  let yPos = 80;
  const labelX = 30;
  const valueX = 100;

  const addRow = (label, value) => {
    doc.setFontSize(10);
    doc.setTextColor(...grayColor);
    doc.setFont("helvetica", "normal");
    doc.text(label, labelX, yPos);
    doc.setTextColor(...darkColor);
    doc.setFont("helvetica", "bold");
    doc.text(value || "-", valueX, yPos);
    yPos += 12;
  };

  addRow("Payment Date:", formatDate(payment.paymentDate));
  addRow("Payment Method:", payment.paymentMethod || "Online");
  addRow("Reference:", payment.reference || "-");
  addRow("Contact:", payment.contact?.name || invoice?.customer?.name || "-");

  // Amount Box
  doc.setFillColor(...primaryColor);
  doc.roundedRect(20, 140, pageWidth - 40, 40, 3, 3, "F");

  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.text("Amount Received", pageWidth / 2, 155, { align: "center" });

  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrency(payment.amount), pageWidth / 2, 172, {
    align: "center",
  });

  // Invoice Reference
  if (invoice || payment.sourceTransactionId) {
    doc.setFontSize(10);
    doc.setTextColor(...grayColor);
    doc.setFont("helvetica", "normal");
    doc.text("Payment for Invoice:", 20, 200);
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    doc.text(
      invoice?.transactionNumber || payment.sourceTransactionId || "-",
      75,
      200,
    );
  }

  // Notes
  if (payment.notes) {
    doc.setFontSize(10);
    doc.setTextColor(...grayColor);
    doc.setFont("helvetica", "normal");
    doc.text("Notes:", 20, 215);
    doc.setTextColor(...darkColor);
    doc.text(payment.notes, 20, 223, { maxWidth: pageWidth - 40 });
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 30;
  doc.setDrawColor(229, 231, 235);
  doc.line(20, footerY, pageWidth - 20, footerY);

  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "italic");
  doc.text("Thank you for your payment!", pageWidth / 2, footerY + 12, {
    align: "center",
  });

  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.setFont("helvetica", "normal");
  doc.text(
    "This is a computer-generated receipt and does not require a signature.",
    pageWidth / 2,
    footerY + 20,
    { align: "center" },
  );

  doc.save(`${payment.paymentNumber || "Receipt"}.pdf`);
};

export default {
  generateInvoicePDF,
  generateBillPDF,
  generatePaymentReceiptPDF,
};
