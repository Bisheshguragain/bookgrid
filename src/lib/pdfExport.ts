// @ts-ignore - jsPDF types may not be perfect
import jsPDF from 'jspdf';
// @ts-ignore - jspdf-autotable types
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface AnalyticsData {
  metrics: {
    totalBookings: number;
    confirmedBookings: number;
    cancelledBookings: number;
    conversionRate: number;
    averagePerDay: number;
  };
  chartData: Array<{ date: string; bookings: number }>;
  eventTypeData: Array<{ name: string; value: number }>;
  dateRange: {
    start: string;
    end: string;
  };
  userInfo?: {
    name?: string;
    email?: string;
  };
}

export async function generateAnalyticsPDF(data: AnalyticsData, bookingsData?: any[]) {
  // Create new PDF document
  const doc = new jsPDF();
  
  // Purple theme colors (using tuple type for jsPDF)
  const purpleColor: [number, number, number] = [147, 51, 234]; // #9333ea
  const lightPurpleColor: [number, number, number] = [233, 213, 255]; // #e9d5ff
  const whiteColor: [number, number, number] = [255, 255, 255];
  const grayColor: [number, number, number] = [107, 114, 128]; // #6b7280
  
  let yPosition = 20;
  
  // ========== HEADER SECTION WITH PURPLE GRADIENT ==========
  // Purple background for header
  doc.setFillColor(...purpleColor);
  doc.rect(0, 0, 210, 40, 'F'); // Full width purple rectangle
  
  // White text for title
  doc.setTextColor(...whiteColor);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Analytics Report', 105, 18, { align: 'center' });
  
  // Subtitle
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('BookAgreed - Booking Analytics', 105, 28, { align: 'center' });
  
  // Date range in header
  doc.setFontSize(10);
  doc.text(
    `Period: ${format(new Date(data.dateRange.start), 'MMM dd, yyyy')} - ${format(new Date(data.dateRange.end), 'MMM dd, yyyy')}`,
    105,
    35,
    { align: 'center' }
  );
  
  yPosition = 50;
  
  // ========== USER INFO SECTION ==========
  if (data.userInfo?.name || data.userInfo?.email) {
    doc.setTextColor(...grayColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    if (data.userInfo.name) {
      doc.text(`Generated for: ${data.userInfo.name}`, 20, yPosition);
      yPosition += 6;
    }
    if (data.userInfo.email) {
      doc.text(`Email: ${data.userInfo.email}`, 20, yPosition);
      yPosition += 6;
    }
    doc.text(`Generated on: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 20, yPosition);
    yPosition += 12;
  }
  
  // ========== KEY METRICS SECTION ==========
  doc.setTextColor(...purpleColor);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Key Metrics', 20, yPosition);
  yPosition += 8;
  
  // Metrics boxes with purple borders
  const metricsBoxY = yPosition;
  const boxWidth = 42;
  const boxHeight = 28;
  const boxSpacing = 3;
  
  // Function to draw a metric box
  const drawMetricBox = (x: number, y: number, label: string, value: string, subtext: string, color: [number, number, number]) => {
    // Border
    doc.setDrawColor(...color);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, y, boxWidth, boxHeight, 2, 2);
    
    // Label
    doc.setTextColor(...grayColor);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(label, x + boxWidth / 2, y + 6, { align: 'center' });
    
    // Value
    doc.setTextColor(...color);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(value, x + boxWidth / 2, y + 16, { align: 'center' });
    
    // Subtext
    doc.setTextColor(...grayColor);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    
    // Truncate subtext if too long
    const maxWidth = boxWidth - 4;
    let displayText = subtext;
    if (doc.getTextWidth(displayText) > maxWidth) {
      while (doc.getTextWidth(displayText + '...') > maxWidth && displayText.length > 0) {
        displayText = displayText.slice(0, -1);
      }
      displayText += '...';
    }
    doc.text(displayText, x + boxWidth / 2, y + 24, { align: 'center' });
  };
  
  // Draw metric boxes
  drawMetricBox(20, metricsBoxY, 'Total Bookings', String(data.metrics.totalBookings), 'all bookings', purpleColor);
  drawMetricBox(20 + boxWidth + boxSpacing, metricsBoxY, 'Confirmed', String(data.metrics.confirmedBookings), `${data.metrics.conversionRate}% conversion`, [16, 185, 129]); // green
  drawMetricBox(20 + (boxWidth + boxSpacing) * 2, metricsBoxY, 'Cancelled', String(data.metrics.cancelledBookings), `${data.metrics.totalBookings > 0 ? Math.round((data.metrics.cancelledBookings / data.metrics.totalBookings) * 100) : 0}% rate`, [239, 68, 68]); // red
  drawMetricBox(20 + (boxWidth + boxSpacing) * 3, metricsBoxY, 'Avg Per Day', String(data.metrics.averagePerDay), 'bookings/day', [59, 130, 246]); // blue
  
  yPosition = metricsBoxY + boxHeight + 12;
  
  // ========== BOOKINGS OVER TIME CHART DATA ==========
  if (data.chartData.length > 0) {
    doc.setTextColor(...purpleColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Bookings Over Time', 20, yPosition);
    yPosition += 6;
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Date', 'Bookings']],
      body: data.chartData.map(item => [item.date, String(item.bookings)]),
      theme: 'grid',
      headStyles: {
        fillColor: purpleColor,
        textColor: whiteColor,
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 9,
        halign: 'center',
      },
      alternateRowStyles: {
        fillColor: lightPurpleColor,
      },
      margin: { left: 20, right: 20 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 80 },
      },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 12;
  }
  
  // ========== EVENT TYPE DISTRIBUTION ==========
  if (data.eventTypeData.length > 0 && yPosition < 250) {
    doc.setTextColor(...purpleColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Bookings by Event Type', 20, yPosition);
    yPosition += 6;
    
    const eventTypeTableData = data.eventTypeData.map(item => {
      // Truncate long event type names
      let name = item.name;
      const maxLength = 40;
      if (name.length > maxLength) {
        name = name.substring(0, maxLength - 3) + '...';
      }
      
      const percentage = data.metrics.totalBookings > 0 
        ? ((item.value / data.metrics.totalBookings) * 100).toFixed(1)
        : '0.0';
      
      return [name, String(item.value), `${percentage}%`];
    });
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Event Type', 'Count', 'Percentage']],
      body: eventTypeTableData,
      theme: 'grid',
      headStyles: {
        fillColor: purpleColor,
        textColor: whiteColor,
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: lightPurpleColor,
      },
      margin: { left: 20, right: 20 },
      columnStyles: {
        0: { cellWidth: 100, halign: 'left' }, // Event Type - left aligned, wider
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' },
      },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 12;
  }
  
  // ========== DETAILED BOOKINGS TABLE (if provided) ==========
  if (bookingsData && bookingsData.length > 0) {
    // Add new page if needed
    if (yPosition > 240) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setTextColor(...purpleColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Detailed Bookings', 20, yPosition);
    yPosition += 6;
    
    const bookingsTableData = bookingsData.map(booking => {
      // Truncate long names/emails
      let guestName = booking.guest_name || 'N/A';
      let guestEmail = booking.guest_email || 'N/A';
      let eventType = booking.event_types?.title || 'Unknown';
      
      // Truncate if needed
      const maxNameLength = 25;
      const maxEmailLength = 30;
      const maxEventLength = 25;
      
      if (guestName.length > maxNameLength) {
        guestName = guestName.substring(0, maxNameLength - 3) + '...';
      }
      if (guestEmail.length > maxEmailLength) {
        guestEmail = guestEmail.substring(0, maxEmailLength - 3) + '...';
      }
      if (eventType.length > maxEventLength) {
        eventType = eventType.substring(0, maxEventLength - 3) + '...';
      }
      
      return [
        format(new Date(booking.start_time), 'MMM dd, yyyy'),
        format(new Date(booking.start_time), 'HH:mm'),
        guestName,
        guestEmail,
        eventType,
        booking.status || 'N/A',
      ];
    });
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Date', 'Time', 'Guest Name', 'Guest Email', 'Event Type', 'Status']],
      body: bookingsTableData,
      theme: 'grid',
      headStyles: {
        fillColor: purpleColor,
        textColor: whiteColor,
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 7,
      },
      alternateRowStyles: {
        fillColor: lightPurpleColor,
      },
      margin: { left: 10, right: 10 },
      columnStyles: {
        0: { cellWidth: 25, halign: 'center' },
        1: { cellWidth: 18, halign: 'center' },
        2: { cellWidth: 35, halign: 'left' },
        3: { cellWidth: 45, halign: 'left' },
        4: { cellWidth: 35, halign: 'left' },
        5: { cellWidth: 22, halign: 'center' },
      },
      didParseCell: function(data: any) {
        // Adjust font size dynamically if content is long
        if (data.section === 'body') {
          const cell = data.cell;
          const text = String(cell.text);
          if (text.length > 30) {
            cell.styles.fontSize = 6;
          }
        }
      },
    });
  }
  
  // ========== FOOTER ==========
  const pageCount = doc.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Purple footer background
    doc.setFillColor(...purpleColor);
    doc.rect(0, 285, 210, 12, 'F');
    
    // Footer text
    doc.setTextColor(...whiteColor);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    
    // Left side - App name
    doc.text('BookAgreed - Analytics Report', 20, 292);
    
    // Right side - Page number
    doc.text(`Page ${i} of ${pageCount}`, 190, 292, { align: 'right' });
    
    // Center - Generated date
    doc.text(format(new Date(), 'MMM dd, yyyy'), 105, 292, { align: 'center' });
  }
  
  // ========== SAVE PDF ==========
  const fileName = `analytics_report_${data.dateRange.start}_to_${data.dateRange.end}.pdf`;
  doc.save(fileName);
}
