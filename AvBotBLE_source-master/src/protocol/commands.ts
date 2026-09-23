// Hardware protocol - preserved verbatim from original web app (js/bluetooth.js).
// Command format: {boardId/switchId,value}  (UTF-8 text, chunked at 20 bytes)

export const COMMAND_CONFIG = {
  switch: {on: '1', off: '0'},
  fan: {speedPrefix: 'Speed'},
  ac: {tempPrefix: 'Temp'},
  curtain: {open: 'OPEN', close: 'CLOSE', stop: 'STOP'},
} as const;

export const AC_TEMP_STEPS = [16, 18, 20, 22, 24, 25, 27, 30];

export function buildSwitchCommand(
  boardId: string | number,
  switchId: string | number,
  state: boolean,
): string {
  return `{${boardId}/${switchId},${state ? COMMAND_CONFIG.switch.on : COMMAND_CONFIG.switch.off}}`;
}

export function buildFanSpeedCommand(
  boardId: string | number,
  switchId: string | number,
  speed: number,
): string {
  return `{${boardId}/${switchId},${COMMAND_CONFIG.fan.speedPrefix}_${speed}}`;
}

export function buildAcTemperatureCommand(
  boardId: string | number,
  switchId: string | number,
  temperature: number,
): string {
  return `{${boardId}/${switchId},${COMMAND_CONFIG.ac.tempPrefix}_${temperature}}`;
}

export function buildCurtainCommand(
  boardId: string | number,
  switchId: string | number,
  action: 'open' | 'close' | 'stop',
): string {
  return `{${boardId}/${switchId},${COMMAND_CONFIG.curtain[action]}}`;
}

export function chunkPayload(data: Uint8Array, size = 20): Uint8Array[] {
  const chunks: Uint8Array[] = [];
  for (let i = 0; i < data.length; i += size) {
    chunks.push(data.slice(i, i + size));
  }
  return chunks;
}
