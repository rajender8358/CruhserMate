const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const TEMP_DIR = path.join(__dirname, '..', 'temp');
fs.ensureDirSync(TEMP_DIR);

const formatCurrency = amount => `₹${amount.toLocaleString('en-IN')}`;
const formatDate = dateString =>
  new Date(dateString).toLocaleDateString('en-IN');
const formatTime = timeString => {
  if (!timeString) return '';
  const [hour, minute] = timeString.split(':');
  return `${parseInt(hour, 10) % 12 || 12}:${minute} ${
    parseInt(hour, 10) >= 12 ? 'PM' : 'AM'
  }`;
};

const generatePdf = data => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 40,
      size: 'A4',
      info: {
        Title: 'CrusherMate Financial Report',
        Author: 'CrusherMate System',
        Subject: 'Truck Entry Report',
        Keywords: 'crusher, truck, financial, report',
      },
    });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    // Header with logo and company info
    const headerY = 40;
    doc.rect(0, 0, 595, 80).fill('#1e40af'); // Blue header background
    doc.fillColor('white');
    doc.fontSize(24).font('Helvetica-Bold').text('CrusherMate', 40, headerY);
    doc
      .fontSize(12)
      .font('Helvetica')
      .text('Financial Report', 40, headerY + 30);
    doc
      .fontSize(10)
      .text(
        `Generated: ${new Date().toLocaleDateString('en-IN')}`,
        40,
        headerY + 45,
      );

    // Reset colors
    doc.fillColor('black');
    doc.strokeColor('black');

    // Report period
    const periodY = 120;
    doc.fontSize(14).font('Helvetica-Bold').text('Report Period', 40, periodY);
    doc
      .fontSize(12)
      .font('Helvetica')
      .text(
        `${formatDate(data.reportInfo.dateRange.startDate)} - ${formatDate(
          data.reportInfo.dateRange.endDate,
        )}`,
        40,
        periodY + 20,
      );

    // Financial Summary Section
    const summaryY = 180;
    doc.rect(40, summaryY - 10, 515, 80).stroke('#e5e7eb');
    doc
      .fillColor('#f8fafc')
      .rect(40, summaryY - 10, 515, 80)
      .fill();
    doc.fillColor('black');

    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('Financial Summary', 50, summaryY);

    const summaryCol1 = 50;
    const summaryCol2 = 200;
    const summaryCol3 = 350;

    // Summary metrics
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Total Sales:', summaryCol1, summaryY + 25);
    doc
      .fontSize(12)
      .font('Helvetica')
      .text(
        formatCurrency(data.summary.totalSales),
        summaryCol1 + 80,
        summaryY + 25,
      );

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Raw Stone Cost:', summaryCol1, summaryY + 45);
    doc
      .fontSize(12)
      .font('Helvetica')
      .text(
        formatCurrency(data.summary.totalRawStone),
        summaryCol1 + 100,
        summaryY + 45,
      );

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Net Profit:', summaryCol1, summaryCol2);
    doc
      .fontSize(12)
      .font('Helvetica')
      .text(
        formatCurrency(data.summary.netIncome),
        summaryCol1 + 80,
        summaryCol2,
      );

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Total Entries:', summaryCol1, summaryCol2 + 20);
    doc
      .fontSize(12)
      .font('Helvetica')
      .text(
        data.summary.totalEntries.toString(),
        summaryCol1 + 90,
        summaryCol2 + 20,
      );

    // Detailed Entries Section
    const entriesY = 300;
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('Transaction Details', 40, entriesY);

    // Table header
    const tableY = entriesY + 20;
    const col1 = 40; // Date
    const col2 = 120; // Time
    const col3 = 180; // Truck No
    const col4 = 280; // Type
    const col5 = 350; // Material
    const col6 = 420; // Units
    const col7 = 480; // Amount

    // Header background
    doc
      .fillColor('#1e40af')
      .rect(col1, tableY - 5, 500, 25)
      .fill();
    doc.fillColor('white');
    doc.fontSize(10).font('Helvetica-Bold').text('Date', col1, tableY);
    doc.text('Time', col2, tableY);
    doc.text('Truck No.', col3, tableY);
    doc.text('Type', col4, tableY);
    doc.text('Material', col5, tableY);
    doc.text('Units', col6, tableY);
    doc.text('Amount', col7, tableY);

    // Reset colors
    doc.fillColor('black');
    doc.strokeColor('#e5e7eb');

    // Table rows
    let currentY = tableY + 30;
    data.entries.forEach((entry, index) => {
      // Alternate row colors
      if (index % 2 === 0) {
        doc
          .fillColor('#f8fafc')
          .rect(col1, currentY - 5, 500, 20)
          .fill();
      } else {
        doc
          .fillColor('white')
          .rect(col1, currentY - 5, 500, 20)
          .fill();
      }
      doc.fillColor('black');

      // Row content
      doc
        .fontSize(9)
        .font('Helvetica')
        .text(formatDate(entry.date), col1, currentY);
      doc.text(formatTime(entry.time), col2, currentY);
      doc.text(entry.truckNumber, col3, currentY);
      doc.text(entry.entryType, col4, currentY);
      doc.text(entry.materialType || 'N/A', col5, currentY);
      doc.text(entry.units.toString(), col6, currentY);
      doc
        .font('Helvetica-Bold')
        .text(formatCurrency(entry.totalAmount), col7, currentY);
      doc.font('Helvetica');

      currentY += 25;
    });

    // Table border
    doc.strokeColor('#d1d5db').lineWidth(1);
    doc.rect(col1, tableY - 5, 500, currentY - tableY + 5).stroke();

    // Footer
    const footerY = 750;
    doc.fillColor('#6b7280');
    doc
      .fontSize(10)
      .font('Helvetica')
      .text('Generated by CrusherMate System', 40, footerY);
    doc.text(
      'This is an automated report. For questions, contact your administrator.',
      40,
      footerY + 15,
    );

    // Page number
    doc.text(`Page 1 of 1`, 500, footerY, { align: 'right' });

    doc.end();
  });
};

module.exports = {
  generatePdf,
};
