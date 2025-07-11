export const formatDate = (
  date: Date | string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }
): string => {
  if (!date) return "N/A";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return "Invalid Date";

    return new Intl.DateTimeFormat(undefined, options).format(dateObj);
  } catch {
    return "Invalid Date";
  }
};

export const formatShortDate = (date: Date | string | null | undefined): string => {
  return formatDate(date, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

export const formatTime = (date: Date | string | null | undefined): string => {
  return formatDate(date, {
    hour: "2-digit",
    minute: "2-digit"
  });
};

export const formatCurrency = (value: number | string | null | undefined, decimals: number = 2, currency: string = "$"): string => {
  if (value === null || value === undefined) return `${currency}0.00`;

  const numValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numValue)) return `${currency}0.00`;

  return `${currency}${numValue.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`;
};
