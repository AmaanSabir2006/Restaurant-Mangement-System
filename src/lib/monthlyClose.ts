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

import os from "os";

function getFilePath(): string {
  const isServerless = Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.NODE_ENV === "production"
  );

  if (isServerless) {
    const tmpPath = path.join(os.tmpdir(), "monthly_closes.json");
    if (!fs.existsSync(tmpPath)) {
      const srcPath = path.join(process.cwd(), "prisma", "monthly_closes.json");
      if (fs.existsSync(srcPath)) {
        try {
          fs.copyFileSync(srcPath, tmpPath);
        } catch {
          // ignore
        }
      }
    }
    return tmpPath;
  }
  return path.join(process.cwd(), "prisma", "monthly_closes.json");
}

function ensureFile(): MonthlyCloseRecord[] {
  const filePath = getFilePath();
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([]), "utf-8");
      return [];
    }
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data) || [];
  } catch (err) {
    console.error("Error reading monthly_closes.json:", err);
    return [];
  }
}

function saveFile(records: MonthlyCloseRecord[]) {
  const filePath = getFilePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(records, null, 2), "utf-8");
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
