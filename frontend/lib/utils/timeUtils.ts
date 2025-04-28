/**
 * Calculates and formats the time elapsed since a given date.
 * 
 * This function takes a reference date and computes the time difference
 * between the current date and the provided date. It returns a human-readable
 * string indicating how much time has passed, such as "5 sec ago" or "2 min ago".
 * 
 * @param {Date | null} date - The reference date from which to calculate the elapsed time.
 *                             If null, the function returns "Never".
 * @returns {string} A formatted string representing the time elapsed since the given date.
 *                   Returns "Never" if the input date is null.
 */
export function getTimeElapsed(date: Date | null): string {
  if (!date) return "Never";
  
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) {
    return `${seconds} sec ago`;
  } else {
    return `${Math.floor(seconds / 60)} min ago`;
  }
} 