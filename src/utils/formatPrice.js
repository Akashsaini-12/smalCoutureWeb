export function formatPrice(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0";
  return number.toFixed(2).replace(/\.?0+$/, "");
}
