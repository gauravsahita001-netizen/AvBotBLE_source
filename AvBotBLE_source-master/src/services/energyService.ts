// Energy math ported from js/energy.js of the original web app.
// Energy (kWh) = Power (kW) x elapsed hours since last update.
import type {EnergyReading, EnergyRecord} from '../types';
import {getEnergyData, saveEnergyData} from '../storage/storage';

let currentReading: EnergyReading | null = null;
let todayEnergyKwh = 0;
let dayAnchor = new Date().toDateString();

export function getCurrentReading(): EnergyReading | null {
  return currentReading ? {...currentReading} : null;
}

export function getTodayEnergy(): number {
  return todayEnergyKwh;
}

export async function initEnergy(settings: {
  baseVoltage: number;
  todayEnergyStart: number;
}): Promise<EnergyReading> {
  const history = await getEnergyData(1);
  if (history.length) {
    const last = history[history.length - 1];
    currentReading = {
      voltage: last.voltage,
      power: last.power,
      energyConsumption: last.energyConsumption,
      lastUpdate: last.timestamp,
    };
  } else {
    currentReading = {
      voltage: settings.baseVoltage || 230,
      power: 0,
      energyConsumption: 0,
      lastUpdate: Date.now(),
    };
  }
  todayEnergyKwh = settings.todayEnergyStart ?? 0;
  return {...currentReading};
}

export function accumulateEnergy(powerWatts: number, now = Date.now()): EnergyReading {
  if (!currentReading) {
    currentReading = {voltage: 230, power: powerWatts, energyConsumption: 0, lastUpdate: now};
  }
  resetDayIfNeeded();
  const elapsedHours = Math.max(0, now - currentReading.lastUpdate) / 3600000;
  const deltaKwh = (powerWatts / 1000) * elapsedHours;
  currentReading = {
    ...currentReading,
    power: powerWatts,
    energyConsumption: +(currentReading.energyConsumption + deltaKwh).toFixed(5),
    lastUpdate: now,
  };
  todayEnergyKwh = +(todayEnergyKwh + deltaKwh).toFixed(4);
  return {...currentReading};
}

export function setVoltage(voltage: number): void {
  if (!currentReading) return;
  currentReading = {...currentReading, voltage};
}

function resetDayIfNeeded(): void {
  const nowDay = new Date().toDateString();
  if (nowDay !== dayAnchor) {
    dayAnchor = nowDay;
    todayEnergyKwh = 0;
  }
}

export async function persistCurrentReading(): Promise<void> {
  if (!currentReading) return;
  await saveEnergyData(currentReading);
}

export interface ChartSeries {
  labels: string[];
  power: number[];
  energy: number[];
}

export async function getChartSeries(range: 'today' | 'week' | 'month'): Promise<ChartSeries> {
  const all = await getEnergyData(0);
  const now = Date.now();
  let windowMs: number, bucketMs: number, count: number;
  if (range === 'today') {
    windowMs = 24 * 3600000;
    bucketMs = 3600000;
    count = 24;
  } else if (range === 'week') {
    windowMs = 7 * 24 * 3600000;
    bucketMs = 24 * 3600000;
    count = 7;
  } else {
    windowMs = 30 * 24 * 3600000;
    bucketMs = 24 * 3600000;
    count = 30;
  }

  const start = now - windowMs;
  const inWindow = all.filter(r => r.timestamp >= start);

  const buckets = new Array(count).fill(null).map((_, i) => ({
    t: start + i * bucketMs,
    power: [] as number[],
    energy: [] as number[],
  }));

  inWindow.forEach(r => {
    const idx = Math.min(count - 1, Math.floor((r.timestamp - start) / bucketMs));
    if (buckets[idx]) {
      buckets[idx].power.push(r.power);
      buckets[idx].energy.push(r.energyConsumption);
    }
  });

  const labels = buckets.map(b => {
    const d = new Date(b.t);
    return range === 'today'
      ? `${d.getHours()}h`
      : `${d.getMonth() + 1}/${d.getDate()}`;
  });

  const avg = (arr: number[]) =>
    arr.length ? +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : 0;

  const power = buckets.map(b => avg(b.power));
  const energy = buckets.map(b =>
    b.energy.length ? +(Math.max(...b.energy) - Math.min(...b.energy)).toFixed(3) : 0,
  );

  return {labels, power, energy};
}
