export const formatCurrency = amount => {
  if (amount === undefined || amount === null) {
    return '₹0';
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return '₹0';
  }

  return `₹${numAmount.toLocaleString('en-IN')}`;
};

// Format a time string (e.g., "13:11:36.553Z" or "13:11:36") into IST 12-hour format with AM/PM
// Accepts optional date string to combine when only time is provided
export const formatISTTime12h = (timeString, dateString) => {
  try {
    if (!timeString) return '';

    // If the time looks like a full ISO date, parse directly
    const looksLikeISO = /\d{4}-\d{2}-\d{2}T/.test(timeString);
    let dateObj;

    if (looksLikeISO) {
      dateObj = new Date(timeString);
    } else {
      // Build a full ISO string using provided date or today
      const baseDate = dateString || new Date().toISOString().split('T')[0];
      // Ensure we always treat as UTC to avoid local offset issues
      const iso = `${baseDate}T${timeString.replace(' ', '')}Z`;
      dateObj = new Date(iso);
    }

    if (isNaN(dateObj.getTime())) return '';

    // Convert to IST and 12-hour format
    return dateObj.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
  } catch (e) {
    return '';
  }
};
