// Demo mode: simulates power/voltage jitter when no hardware is connected.
// Ported from js/demo.js behavior.
import type {Device, Board, EnergyReading} from '../types';
import {accumulateEnergy, setVoltage} from './energyService';

let timer: ReturnType<typeof setInterval> | null = null;

export function isDemoRunning(): boolean {
  return timer !== null;
}

export function startDemoMode(
  devices: Device[],
  boards: Board[],
  baseVoltage: number,
  jitter: number,
  onTick: (reading: EnergyReading) => void,
): void {
  stopDemoMode();
  timer = setInterval(() => {
    const active = devices.filter(d =>
      d.type === 'curtain'
        ? d.curtainState === 'OPEN' || d.curtainState === 'MOVING'
        : d.type === 'fan'
          ? !!d.state && (d.speed ?? 0) > 0
          : !!d.state,
    );
    const totalPower = active.reduce((s, d) => s + (d.power || 0), 0);
    const onlineBoards = boards.filter(b => b.online);
    const boardBase = onlineBoards.reduce((s, b) => s + (b.basePower || 0), 0);
    const power = +(totalPower + boardBase + Math.random() * 5).toFixed(1);
    const voltage = +(
      baseVoltage +
      (Math.random() - 0.5) * 2 * jitter
    ).toFixed(1);
    setVoltage(voltage);
    const reading = accumulateEnergy(power);
    onTick(reading);
  }, 5000);
}

export function stopDemoMode(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
