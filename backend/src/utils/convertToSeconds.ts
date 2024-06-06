export const convertToSeconds = (number: number, unit: 'd' | 'h' | 'm'): number => {
  let seconds = 0;
  switch (unit) {
    case 'd':
      seconds = number * 24 * 60 * 60;
      break;
    case 'h':
      seconds = number * 60 * 60;
      break;
    case 'm':
      seconds = number * 60;
      break;
    default:
      throw new Error('Invalid unit. Please provide "d", "h", "m".');
  }
  return seconds;
};
