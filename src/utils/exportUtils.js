import { Alert, Linking, Share } from 'react-native';

// Generate CSV content from report data
const generateCSVContent = (reportData, reportType, filters) => {
  const headers = [
    'Date',
    'Time',
    'Entry Type',
    'Truck Number',
    'Material Type',
    'Units',
    'Rate',
    'Total',
  ];
  const csvRows = [headers.join(',')];

  reportData.forEach(item => {
    const row = [
      item.date,
      item.time,
      item.entryType,
      item.truckNumber,
      item.materialType || 'N/A',
      item.units,
      item.rate,
      item.total,
    ];
    csvRows.push(row.join(','));
  });

  // Add summary
  csvRows.push(''); // Empty line
  csvRows.push('SUMMARY');

  const totalSales = reportData
    .filter(r => r.entryType === 'Sales')
    .reduce((sum, r) => sum + (r.total || 0), 0);

  const totalRawStone = reportData
    .filter(r => r.entryType === 'Raw Stone')
    .reduce((sum, r) => sum + (r.total || 0), 0);

  csvRows.push(`Total Sales,${totalSales}`);
  csvRows.push(`Raw Stone Cost,${totalRawStone}`);
  csvRows.push(`Net Profit,${totalSales - totalRawStone}`);

  return csvRows.join('\n');
};

// Generate HTML content for PDF
const generateHTMLContent = (reportData, reportType, filters) => {
  const formatCurrency = amount => `₹${amount.toLocaleString('en-IN')}`;
  const formatDate = dateStr => {
    if (!dateStr || dateStr === 'N/A') return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN');
    } catch {
      return dateStr;
    }
  };

  const totalSales = reportData
    .filter(r => r.entryType === 'Sales')
    .reduce((sum, r) => sum + (r.total || 0), 0);

  const totalRawStone = reportData
    .filter(r => r.entryType === 'Raw Stone')
    .reduce((sum, r) => sum + (r.total || 0), 0);

  const netProfit = totalSales - totalRawStone;

  // Get period info for dashboard reports
  const periodInfo = filters.period
    ? `Period: ${
        filters.period.charAt(0).toUpperCase() + filters.period.slice(1)
      }`
    : 'All Entries';

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>CrusherMate Report</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                margin: 20px; 
                line-height: 1.4;
                color: #333;
            }
            .header { 
                text-align: center; 
                margin-bottom: 30px; 
                border-bottom: 2px solid #2E86AB;
                padding-bottom: 20px;
            }
            .company-name { 
                font-size: 28px; 
                font-weight: bold; 
                color: #2E86AB; 
                margin-bottom: 5px;
            }
            .report-title { 
                font-size: 20px; 
                margin: 10px 0; 
                color: #555;
            }
            .report-info { 
                font-size: 12px; 
                color: #666; 
                margin-top: 10px;
            }
            .summary-section { 
                margin: 30px 0; 
                page-break-inside: avoid;
            }
            .summary-title { 
                font-size: 18px; 
                font-weight: bold; 
                margin-bottom: 15px; 
                color: #2E86AB;
                border-bottom: 1px solid #ddd;
                padding-bottom: 5px;
            }
            .summary-grid { 
                display: flex; 
                gap: 20px; 
                margin-bottom: 20px; 
                flex-wrap: wrap;
            }
            .summary-card { 
                border: 2px solid #ddd; 
                padding: 20px; 
                border-radius: 8px; 
                flex: 1; 
                text-align: center; 
                min-width: 150px;
                background-color: #f9f9f9;
            }
            .summary-label { 
                font-size: 14px; 
                color: #666; 
                margin-bottom: 8px; 
                font-weight: bold;
            }
            .summary-value { 
                font-size: 22px; 
                font-weight: bold; 
            }
            .positive { color: #27AE60; }
            .negative { color: #E74C3C; }
            .entries-section { 
                margin-top: 40px; 
                page-break-inside: avoid;
            }
            .entries-title { 
                font-size: 18px; 
                font-weight: bold; 
                margin-bottom: 15px; 
                color: #2E86AB;
                border-bottom: 1px solid #ddd;
                padding-bottom: 5px;
            }
            .entries-table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-top: 15px; 
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .entries-table th, .entries-table td { 
                border: 1px solid #ddd; 
                padding: 12px 8px; 
                text-align: left; 
                font-size: 11px; 
            }
            .entries-table th { 
                background-color: #2E86AB; 
                color: white;
                font-weight: bold; 
                text-align: center;
            }
            .entry-sales { background-color: #e8f5e8; }
            .entry-raw { background-color: #ffe8e8; }
            .entries-table tr:hover { background-color: #f5f5f5; }
            .footer {
                margin-top: 40px;
                text-align: center;
                font-size: 10px;
                color: #999;
                border-top: 1px solid #ddd;
                padding-top: 10px;
            }
            @media print {
                body { margin: 0; }
                .download-section { display: none; }
                .header { page-break-after: avoid; }
                .summary-section { page-break-inside: avoid; }
                .entries-section { page-break-before: auto; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="company-name">🏗️ CRUSHERMATE</div>
            <div class="report-title">${reportType.toUpperCase()} REPORT</div>
            <div class="report-info">
                📅 Generated on: ${new Date().toLocaleDateString(
                  'en-IN',
                )} at ${new Date().toLocaleTimeString('en-IN')}<br>
                🔍 ${periodInfo} | Date Range: ${filters.startDate} to ${
    filters.endDate
  }
            </div>
        </div>

        <div class="summary-section">
            <div class="summary-title">💰 Financial Summary</div>
            <div class="summary-grid">
                <div class="summary-card">
                    <div class="summary-label">📈 Total Sales</div>
                    <div class="summary-value positive">${formatCurrency(
                      totalSales,
                    )}</div>
                </div>
                <div class="summary-card">
                    <div class="summary-label">📉 Raw Stone Cost</div>
                    <div class="summary-value negative">${formatCurrency(
                      totalRawStone,
                    )}</div>
                </div>
                <div class="summary-card">
                    <div class="summary-label">💎 Net Profit</div>
                    <div class="summary-value ${
                      netProfit >= 0 ? 'positive' : 'negative'
                    }">${formatCurrency(netProfit)}</div>
                </div>
            </div>
        </div>

        <div class="entries-section">
            <div class="entries-title">📋 Detailed Entries (${
              reportData.length
            } transactions)</div>
            <table class="entries-table">
                <thead>
                    <tr>
                        <th>📅 Date</th>
                        <th>🕐 Time</th>
                        <th>📝 Type</th>
                        <th>🚛 Truck Number</th>
                        <th>📦 Material</th>
                        <th>⚖️ Units</th>
                        <th>💰 Rate</th>
                        <th>💵 Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${reportData
                      .map(
                        (item, index) => `
                        <tr class="${
                          item.entryType === 'Sales'
                            ? 'entry-sales'
                            : 'entry-raw'
                        }">
                            <td>${formatDate(item.date)}</td>
                            <td>${item.time}</td>
                            <td><strong>${item.entryType}</strong></td>
                            <td>${item.truckNumber}</td>
                            <td>${item.materialType || 'N/A'}</td>
                            <td>${item.units}</td>
                            <td>${formatCurrency(item.rate)}</td>
                            <td><strong>${formatCurrency(
                              item.total,
                            )}</strong></td>
                        </tr>
                    `,
                      )
                      .join('')}
                </tbody>
            </table>
        </div>
        
        <div class="footer">
            Generated by CrusherMate App | Report ID: ${new Date().getTime()}
        </div>
    </body>
    </html>
  `;
};

// Create data URL and open in browser
const openInBrowser = (content, fileName, type) => {
  try {
    let dataURL;
    let mimeType;

    if (type === 'csv') {
      mimeType = 'text/csv';
      dataURL = `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`;
    } else {
      mimeType = 'text/html';
      dataURL = `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`;
    }

    Linking.openURL(dataURL)
      .then(() => {
        if (type === 'csv') {
          Alert.alert(
            '📊 CSV Report Opened',
            'The CSV report has been opened in your browser. You can download it directly from the browser.',
            [{ text: 'OK' }],
          );
        } else {
          Alert.alert(
            '📄 PDF Report Opened',
            'The report has been opened in your browser. Use the download buttons on the page or print to save as PDF.',
            [{ text: 'OK' }],
          );
        }
      })
      .catch(err => {
        console.error('Error opening browser:', err);
        // Fallback to Share API
        Share.share({
          title: `CrusherMate ${type.toUpperCase()} Report`,
          message:
            type === 'csv'
              ? `📊 ${fileName}\n\n${content}`
              : `📄 ${fileName}\n\nReport content available. Please copy and paste into a document editor.`,
        });
      });
  } catch (error) {
    console.error('Error creating data URL:', error);
    Alert.alert('Error', 'Unable to open report. Please try again.');
  }
};

// Export to CSV
export const exportToCSV = async (reportData, reportType, filters) => {
  try {
    const csvContent = generateCSVContent(reportData, reportType, filters);
    const fileName = `CrusherMate_${reportType}_Report_${
      new Date().toISOString().split('T')[0]
    }.csv`;

    Alert.alert(
      '📊 CSV Export',
      'Opening CSV report in your browser for download...',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open',
          onPress: () => openInBrowser(csvContent, fileName, 'csv'),
        },
      ],
    );
  } catch (error) {
    console.error('Error exporting CSV:', error);
    Alert.alert(
      '❌ Export Failed',
      'Failed to export CSV file. Please try again.',
    );
  }
};

// Export to PDF
export const exportToPDF = async (reportData, reportType, filters) => {
  try {
    const htmlContent = generateHTMLContent(reportData, reportType, filters);
    const fileName = `CrusherMate_${reportType}_Report_${
      new Date().toISOString().split('T')[0]
    }.pdf`;

    Alert.alert(
      '📄 PDF Export',
      'Opening PDF report in your browser with download options...',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open',
          onPress: () => openInBrowser(htmlContent, fileName, 'html'),
        },
      ],
    );
  } catch (error) {
    console.error('Error generating PDF:', error);
    Alert.alert(
      '❌ PDF Generation Failed',
      'Failed to generate PDF file. Please try again.',
    );
  }
};
