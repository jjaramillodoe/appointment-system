export interface DailyVolumePoint {
  date: string;
  total: number;
  confirmed: number;
  cancelled: number;
  pendingProfile: number;
}

export function fillDailyVolume(
  startDate: string,
  endDate: string,
  rows: Array<{ _id: string; total: number; confirmed: number; cancelled: number; pendingProfile: number }>
): DailyVolumePoint[] {
  const byDate = new Map(rows.map((row) => [row._id, row]));
  const points: DailyVolumePoint[] = [];
  const cursor = new Date(`${startDate}T00:00:00`);
  const last = new Date(`${endDate}T00:00:00`);

  while (cursor <= last) {
    const year = cursor.getFullYear();
    const month = String(cursor.getMonth() + 1).padStart(2, '0');
    const day = String(cursor.getDate()).padStart(2, '0');
    const date = `${year}-${month}-${day}`;
    const row = byDate.get(date);
    points.push({
      date,
      total: row?.total || 0,
      confirmed: row?.confirmed || 0,
      cancelled: row?.cancelled || 0,
      pendingProfile: row?.pendingProfile || 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return points;
}

export function percent(part: number, total: number): number {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}
