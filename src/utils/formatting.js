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
    // If no time supplied, try deriving from the date string directly (e.g., ISO timestamps)
    if (!timeString) {
      if (!dateString) return '';
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
      });
    }

    const trimmed = String(timeString).trim();

    // If the time looks like a full ISO date, parse directly
    const looksLikeISO = /\d{4}-\d{2}-\d{2}T/.test(trimmed);
    if (looksLikeISO) {
      const d = new Date(trimmed);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
      });
    }

    // If already includes am/pm, just normalize casing to AM/PM
    if (/\b(am|pm)\b/i.test(trimmed)) {
      const normalized = trimmed
        .replace(/\s+/g, ' ')
        .replace(/\b(am|pm)\b/i, m => m.toUpperCase());
      return normalized;
    }

    // If looks like 24h time (HH:mm or HH:mm:ss), convert to 12h without timezone shifts
    const timeMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = timeMatch[2];
      if (isNaN(hours)) return '';
      const period = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${hours}:${minutes} ${period}`;
    }

    // Fallback: combine date+time as-is without forcing UTC conversion (avoid wrong offset)
    const baseDate = dateString || new Date().toISOString().split('T')[0];
    const combined = `${baseDate}T${trimmed}`;
    const d = new Date(combined);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
  } catch (e) {
    return '';
  }
};
