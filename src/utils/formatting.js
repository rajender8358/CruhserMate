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
