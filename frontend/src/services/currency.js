const currencyFormats = {
  INR: { locale: 'en-IN', symbol: '₹' },
  USD: { locale: 'en-US', symbol: '$' },
  EUR: { locale: 'de-DE', symbol: '€' },
  GBP: { locale: 'en-GB', symbol: '£' },
};

export const formatCurrency = (amount, currencyCode = 'INR') => {
  const cfg = currencyFormats[currencyCode] || currencyFormats.INR;
  const num = parseFloat(amount);
  if (isNaN(num)) return cfg.symbol + '0.00';
  
  // Clean currency code formatting
  let cleanCode = currencyCode;
  if (currencyCode.includes('INR') || currencyCode.includes('₹')) cleanCode = 'INR';
  if (currencyCode.includes('USD') || currencyCode.includes('$')) cleanCode = 'USD';
  if (currencyCode.includes('EUR') || currencyCode.includes('€')) cleanCode = 'EUR';
  if (currencyCode.includes('GBP') || currencyCode.includes('£')) cleanCode = 'GBP';
  
  const targetCfg = currencyFormats[cleanCode] || currencyFormats.INR;
  
  return targetCfg.symbol + num.toLocaleString(targetCfg.locale, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
};

export const getCurrencySymbol = (currencyCode = 'INR') => {
  let cleanCode = currencyCode;
  if (currencyCode.includes('INR') || currencyCode.includes('₹')) cleanCode = 'INR';
  if (currencyCode.includes('USD') || currencyCode.includes('$')) cleanCode = 'USD';
  if (currencyCode.includes('EUR') || currencyCode.includes('€')) cleanCode = 'EUR';
  if (currencyCode.includes('GBP') || currencyCode.includes('£')) cleanCode = 'GBP';
  
  const cfg = currencyFormats[cleanCode] || currencyFormats.INR;
  return cfg.symbol;
};
