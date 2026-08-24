import { format as dateFnsFormat } from 'date-fns';

import { SYSTEM_DEFAULT_LOCALE } from './currency-constants';

/**
 * Default formats to use if tenant/company settings are not found
 */
export const DEFAULT_DATE_FORMAT = 'dd-MM-yyyy';
export const DEFAULT_TIME_FORMAT = 'hh:mm aa';
export const DEFAULT_PRECISION = 2;

/**
 * Formats a date object or string into a string based on the provided format or default
 */
export function formatDate(date: Date | string | number, formatString?: string, timeZone?: string): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  
  // Resolve timezone dynamically from env or fallback to local
  const resolvedTimeZone = timeZone || (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE : undefined);

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
    hour12: false,
  };
  
  if (resolvedTimeZone) {
      options.timeZone = resolvedTimeZone;
  }

  // Construct a shifted date that tricks date-fns into printing the correct local time
  const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(d);
  
  const vals: any = {};
  parts.forEach(p => vals[p.type] = p.value);
  
  // Handle 24:00 edge case from Intl
  const hour = vals.hour === '24' ? 0 : parseInt(vals.hour);
  
  const shiftedDate = new Date(
    parseInt(vals.year), 
    parseInt(vals.month) - 1, 
    parseInt(vals.day), 
    hour, 
    parseInt(vals.minute), 
    parseInt(vals.second)
  );
  
  // Use provided format or fall back to system default
  return dateFnsFormat(shiftedDate, formatString || DEFAULT_DATE_FORMAT);
}

/**
 * Formats a number into a currency string with dynamic precision
 */
export function formatNumber(amount: number, precision: number = DEFAULT_PRECISION, locale: string = SYSTEM_DEFAULT_LOCALE): string {
  if (amount === undefined || amount === null) return '0.00';
  
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  }).format(amount);
}

/**
 * Centrailized formatting for currency with symbol
 */
export function formatCurrencyWithSymbol(
  amount: number, 
  symbol: string = '₹', 
  precision: number = DEFAULT_PRECISION
): string {
  const formatted = formatNumber(amount, precision);
  
  // Standard symbol placement logic
  if (symbol.length === 1 || symbol === 'A$' || symbol === 'C$' || symbol === 'S$') {
    return `${symbol}${formatted}`;
  } else {
    return `${formatted} ${symbol}`;
  }
}
