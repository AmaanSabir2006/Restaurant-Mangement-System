import fs from "fs";
import path from "path";

export interface MonthlyCloseRecord {
  monthKey: string; // e.g. "2026-11"
  closedAt: string;
  totalSales: number;
  totalOrders: number;
  totalSupplies?: number;
  notes?: string;
  isReset: boolean;
}

const FILE_PATH = path.join(process.cwd(), "prisma", "monthly_closes.json");

function ensureFile(): MonthlyCloseRecord[] {
  try {
    if (!fs.existsSync(FILE_PATH)) {
      fs.writeFileSync(FILE_PATH, JSON.stringify([]), "utf-8");
      return [];
    }
    const data = fs.readFileSync(FILE_PATH, "utf-8");
    return JSON.parse(data) || [];
  } catch (err) {
    console.error("Error reading monthly_closes.json:", err);
    return [];
  }
}

function saveFile(records: MonthlyCloseRecord[]) {
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(records, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing monthly_closes.json:", err);
  }
}

export function getAllClosedMonths(): MonthlyCloseRecord[] {
  return ensureFile();
}

export function getClosedMonth(monthKey: string): MonthlyCloseRecord | undefined {
  const records = ensureFile();
  return records.find((r) => r.monthKey === monthKey && r.isReset);
}

export function resetMonthSales(
  monthKey: string,
  snapshot: { totalSales: number; totalOrders: number; totalSupplies?: number; notes?: string }
): MonthlyCloseRecord {
  const records = ensureFile();
  const existingIdx = records.findIndex((r) => r.monthKey === monthKey);

  const newRecord: MonthlyCloseRecord = {
    monthKey,
    closedAt: new Date().toISOString(),
    totalSales: snapshot.totalSales,
    totalOrders: snapshot.totalOrders,
    totalSupplies: snapshot.totalSupplies || 0,
    notes: snapshot.notes,
    isReset: true,
  };

  if (existingIdx >= 0) {
    records[existingIdx] = newRecord;
  } else {
    records.push(newRecord);
  }

  saveFile(records);
  return newRecord;
}

export function restoreMonthSales(monthKey: string): boolean {
  const records = ensureFile();
  const existingIdx = records.findIndex((r) => r.monthKey === monthKey);
  if (existingIdx >= 0) {
    records.splice(existingIdx, 1);
    saveFile(records);
    return true;
  }
  return false;
}
