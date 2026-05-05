export function getOffset(timezone: string, date: Date) {
  try {
    const tzStr = date.toLocaleString('en-US', { timeZone: timezone, timeZoneName: 'shortOffset' });
    const match = tzStr.match(/GMT([+-]\d{1,2}(?::?\d{2})?)/);
    if (!match) return "+00:00";
    let offset = match[1];
    if (!offset.includes(':')) offset += ':00';
    if (offset.length === 5) offset = offset.replace(/([+-])(\d):/, '$10$2:'); // pad single digit hour
    return offset;
  } catch {
    return "+00:00";
  }
}

export function getDayBounds(timezone: string = "UTC", dateObj = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(dateObj);
    
    const y = parts.find(p => p.type === 'year')?.value;
    const m = parts.find(p => p.type === 'month')?.value;
    const d = parts.find(p => p.type === 'day')?.value;

    const offset = getOffset(timezone, dateObj);
    
    const startOfDay = new Date(`${y}-${m}-${d}T00:00:00.000${offset}`);
    const endOfDay = new Date(`${y}-${m}-${d}T23:59:59.999${offset}`);
    
    // In case of parsing error that returns NaN date
    if (isNaN(startOfDay.getTime())) throw new Error("Invalid date parsing");

    return { startOfDay, endOfDay };
  } catch {
    const startOfDay = new Date(dateObj);
    startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date(dateObj);
    endOfDay.setHours(23,59,59,999);
    return { startOfDay, endOfDay };
  }
}
