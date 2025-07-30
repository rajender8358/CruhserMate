const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const TEMP_DIR = path.join(__dirname, '..', 'temp');
fs.ensureDirSync(TEMP_DIR);

const formatCurrency = amount => `Rs. ${amount.toLocaleString('en-IN')}`;
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
      margin: 30,
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

    // Theme colors from your app
    const colors = {
      primary: '#2C3E50', // Dark blue-gray
      secondary: '#3498DB', // Modern blue
      accent: '#E74C3C', // Modern red
      white: '#FFFFFF',
      black: '#000000',
      gray: '#BDC3C7', // Light gray
      lightGray: '#ECF0F1', // Very light gray
      darkGray: '#7F8C8D', // Medium gray
      background: '#F8F9FA', // Light background
    };

    // Header with proper alignment
    const headerY = 30;
    const pageWidth = 595;
    const margin = 30;
    const contentWidth = pageWidth - margin * 2;

    // Blue header background
    doc.rect(0, 0, pageWidth, 70).fill(colors.secondary);
    doc.fillColor(colors.white);

    // Company name - centered
    doc
      .fontSize(28)
      .font('Helvetica-Bold')
      .text('CrusherMate', margin, headerY, { align: 'left' });
    doc
      .fontSize(14)
      .font('Helvetica')
      .text('Financial Report', margin, headerY + 35, { align: 'left' });

    // Generation date - right aligned
    doc
      .fontSize(10)
      .text(
        `Generated: ${new Date().toLocaleDateString('en-IN')}`,
        margin,
        headerY + 50,
        { align: 'left' },
      );

    // Reset colors
    doc.fillColor(colors.black);
    doc.strokeColor(colors.black);

    // Report period section
    const periodY = 120;
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('Report Period', margin, periodY);
    doc
      .fontSize(12)
      .font('Helvetica')
      .text(
        `${formatDate(data.reportInfo.dateRange.startDate)} - ${formatDate(
          data.reportInfo.dateRange.endDate,
        )}`,
        margin,
        periodY + 25,
      );

    // Financial Summary Section with proper alignment
    const summaryY = 180;
    const summaryWidth = contentWidth;
    const summaryHeight = 90;

    // Summary box with border
    doc
      .rect(margin, summaryY - 10, summaryWidth, summaryHeight)
      .stroke(colors.gray);
    doc
      .fillColor(colors.lightGray)
      .rect(margin, summaryY - 10, summaryWidth, summaryHeight)
      .fill();
    doc.fillColor(colors.black);

    // Summary title
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('Financial Summary', margin + 15, summaryY);

    // Summary metrics in a grid layout
    const col1X = margin + 15;
    const col2X = margin + 200;
    const row1Y = summaryY + 30;
    const row2Y = summaryY + 55;

    // Row 1 - Total Sales and Net Profit with better alignment
    doc.fontSize(12).font('Helvetica-Bold').text('Total Sales:', col1X, row1Y);
    doc
      .fontSize(12)
      .font('Helvetica')
      .text(formatCurrency(data.summary.totalSales), col1X + 120, row1Y);

    doc.fontSize(12).font('Helvetica-Bold').text('Net Profit:', col2X, row1Y);
    doc
      .fontSize(12)
      .font('Helvetica')
      .text(formatCurrency(data.summary.netIncome), col2X + 120, row1Y);

    // Row 2 - Raw Stone Cost and Total Entries with better alignment
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Raw Stone Cost:', col1X, row2Y);
    doc
      .fontSize(12)
      .font('Helvetica')
      .text(formatCurrency(data.summary.totalRawStone), col1X + 140, row2Y);

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Total Entries:', col2X, row2Y);
    doc
      .fontSize(12)
      .font('Helvetica')
      .text(data.summary.totalEntries.toString(), col2X + 120, row2Y);

    // Transaction Details Section
    const entriesY = 300;
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('Transaction Details', margin, entriesY);

    // Table with proper column widths
    const tableY = entriesY + 25;
    const tableWidth = contentWidth;
    const colWidths = [80, 60, 100, 70, 80, 50, 80]; // Date, Time, Truck, Type, Material, Units, Amount
    const colNames = [
      'Date',
      'Time',
      'Truck No.',
      'Type',
      'Material',
      'Units',
      'Amount',
    ];

    let currentX = margin;

    // Table header with theme color
    doc
      .fillColor(colors.primary)
      .rect(margin, tableY - 5, tableWidth, 25)
      .fill();
    doc.fillColor(colors.white);
    doc.fontSize(10).font('Helvetica-Bold');

    // Header text
    colNames.forEach((colName, index) => {
      doc.text(colName, currentX + 5, tableY);
      currentX += colWidths[index];
    });

    // Reset colors
    doc.fillColor(colors.black);
    doc.strokeColor(colors.gray);

    // Table rows with proper alignment
    let currentY = tableY + 30;
    data.entries.forEach((entry, index) => {
      // Alternate row colors
      if (index % 2 === 0) {
        doc
          .fillColor(colors.lightGray)
          .rect(margin, currentY - 5, tableWidth, 20)
          .fill();
      } else {
        doc
          .fillColor(colors.white)
          .rect(margin, currentY - 5, tableWidth, 20)
          .fill();
      }
      doc.fillColor(colors.black);

      // Row content with proper column alignment
      currentX = margin;

      // Date
      doc
        .fontSize(9)
        .font('Helvetica')
        .text(formatDate(entry.date), currentX + 5, currentY);
      currentX += colWidths[0];

      // Time
      doc.text(formatTime(entry.time), currentX + 5, currentY);
      currentX += colWidths[1];

      // Truck Number
      doc.text(entry.truckNumber, currentX + 5, currentY);
      currentX += colWidths[2];

      // Type
      doc.text(entry.entryType, currentX + 5, currentY);
      currentX += colWidths[3];

      // Material
      doc.text(entry.materialType || 'N/A', currentX + 5, currentY);
      currentX += colWidths[4];

      // Units
      doc.text(entry.units.toString(), currentX + 5, currentY);
      currentX += colWidths[5];

      // Amount (right aligned with proper spacing)
      doc
        .font('Helvetica-Bold')
        .text(
          formatCurrency(entry.totalAmount),
          currentX + colWidths[6] - 15,
          currentY,
          { align: 'right' },
        );
      doc.font('Helvetica');

      currentY += 25;
    });

    // Table border
    doc.strokeColor(colors.gray).lineWidth(1);
    doc.rect(margin, tableY - 5, tableWidth, currentY - tableY + 5).stroke();

    // Footer with proper alignment
    const footerY = 780;
    doc.fillColor(colors.darkGray);
    doc
      .fontSize(10)
      .font('Helvetica')
      .text('Generated by CrusherMate System', margin, footerY);
    doc.text(
      'This is an automated report. For questions, contact your administrator.',
      margin,
      footerY + 15,
    );

    // Page number - right aligned
    doc.text(`Page 1 of 1`, margin + contentWidth - 50, footerY, {
      align: 'right',
    });

    doc.end();
  });
};

module.exports = {
  generatePdf,
};
