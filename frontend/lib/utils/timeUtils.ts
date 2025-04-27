/**
 * Formats the time elapsed since a given date
 * @param date The reference date
 * @returns A formatted string like "5 sec ago" or "2 min ago"
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