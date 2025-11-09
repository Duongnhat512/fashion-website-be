export const isEffectiveNow = (
  startDate?: Date | null,
  endDate?: Date | null,
): boolean => {
  const now = new Date();
  return (!startDate || startDate <= now) && (!endDate || endDate >= now);
};
