const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Function to generate PDF receipt
const generateReceiptPDF = (receiptData) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      // Create a buffer to store PDF data
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header with Logo
      const logoPath = path.join(__dirname, '../../Frontend/public/Final Logo.png');
      
      // Check if logo file exists
      if (fs.existsSync(logoPath)) {
        try {
          // Add logo to the top of the receipt
          doc.image(logoPath, 50, 45, { width: 100 });
          // Position the text to the right of the logo
          doc.fontSize(20).text('PAYMENT RECEIPT', 160, 50);
        } catch (imageError) {
          console.error('Error loading logo image:', imageError);
          // Fallback to text-only header if logo fails to load
          doc.fontSize(20).text('PAYMENT RECEIPT', { align: 'center' });
        }
      } else {
        console.log('Logo file not found at:', logoPath);
        // Fallback to text-only header if logo doesn't exist
        doc.fontSize(20).text('PAYMENT RECEIPT', { align: 'center' });
      }
      doc.moveDown();

      // Company Info
      doc.fontSize(12).text('PrepZon - An EdTech Platform', { align: 'center' });
      doc.fontSize(10).text('Education Platform', { align: 'center' });
      doc.moveDown(2);

      // Receipt Info
      doc.fontSize(12).text(`Receipt #: ${receiptData.receiptNumber || receiptData.orderId}`, { align: 'right' });
      doc.text(`Date: ${new Date(receiptData.paymentDate || new Date()).toLocaleDateString()}`, { align: 'right' });
      doc.moveDown(2);

      // Customer Info
      doc.fontSize(12).text('Bill To:', { underline: true });
      doc.fontSize(10).text(receiptData.studentName);
      doc.text(receiptData.email);
      doc.text(receiptData.mobile);
      doc.moveDown(2);

      // Order Items
      doc.fontSize(12).text('Order Details:', { underline: true });
      
      // Table headers
      const tableTop = doc.y;
      const itemWidth = 200;
      const priceWidth = 100;
      
      doc.fontSize(10);
      doc.text('Item', 50, tableTop);
      doc.text('Price', 50 + itemWidth, tableTop, { width: priceWidth, align: 'right' });
      
      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(50 + itemWidth + priceWidth, doc.y).stroke();
      doc.moveDown(0.5);

      // Items
      let yPos = doc.y;
      receiptData.items.forEach(item => {
        const itemTitle = item.testTitle || item.courseTitle || 'Unknown Item';
        const itemType = item.testId ? 'Test' : (item.courseId ? 'Course' : 'Item');
        
        doc.text(`${itemTitle} (${itemType})`, 50, yPos);
        doc.text(`₹${item.price?.toLocaleString() || 0}`, 50 + itemWidth, yPos, { width: priceWidth, align: 'right' });
        yPos += 20;
      });

      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(50 + itemWidth + priceWidth, doc.y).stroke();
      doc.moveDown(0.5);

      // Summary
      const summaryY = doc.y;
      doc.text('Subtotal:', 50 + itemWidth - 50, summaryY);
      doc.text(`₹${(receiptData.totalAmount - (receiptData.taxes?.totalTax || 0) + (receiptData.discount?.discountAmount || 0)).toLocaleString()}`, 50 + itemWidth, summaryY, { width: priceWidth, align: 'right' });
      
      if (receiptData.discount && receiptData.discount.discountAmount > 0) {
        doc.text(`Discount (${receiptData.discount.couponCode || 'Promo'}):`, 50 + itemWidth - 50, summaryY + 20);
        doc.text(`-₹${receiptData.discount.discountAmount.toLocaleString()}`, 50 + itemWidth, summaryY + 20, { width: priceWidth, align: 'right' });
      }
      
      if (receiptData.taxes && receiptData.taxes.totalTax > 0) {
        doc.text('Tax:', 50 + itemWidth - 50, summaryY + 40);
        doc.text(`₹${receiptData.taxes.totalTax.toLocaleString()}`, 50 + itemWidth, summaryY + 40, { width: priceWidth, align: 'right' });
      }
      
      doc.moveDown(2);
      doc.fontSize(12).text('Total:', 50 + itemWidth - 50, doc.y);
      doc.font('Helvetica-Bold').text(`₹${receiptData.totalAmount?.toLocaleString() || 0}`, 50 + itemWidth, doc.y, { width: priceWidth, align: 'right' });
      doc.font('Helvetica');

      // Payment Info
      doc.moveDown(2);
      doc.fontSize(10).text('Payment Method:', 50);
      doc.text(receiptData.paymentMethod || 'N/A', 150);
      
      if (receiptData.transactionId) {
        doc.text('Transaction ID:', 50);
        doc.text(receiptData.transactionId, 150);
      }

      // Footer
      doc.moveDown(3);
      doc.fontSize(10).text('Thank you for your purchase!', { align: 'center' });
      doc.text('This is a computer generated receipt and does not require a signature.', { align: 'center' });

      // Finalize PDF file
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateReceiptPDF };