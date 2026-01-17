export function formatNumber(value: number, decimals = 2): string {
  const fixed = value.toFixed(decimals);
  const [integerPart = "0", fractionalPart] = fixed.split(".");
  const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return fractionalPart ? `${grouped},${fractionalPart}` : grouped;
}

export function formatCurrency(value: number): string {
  return `${formatNumber(value, 2)} EUR`;
}
