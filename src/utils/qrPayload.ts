export type QrPayload = { t: 'reservation'; id: string; v: 1 };

export function encodeReservationPayload(id: string) {
  const p: QrPayload = { t: 'reservation', id, v: 1 };
  return JSON.stringify(p);
}

export function decodePayload(text: string) {
  try {
    const obj = JSON.parse(text);
    if (obj && obj.t === 'reservation' && typeof obj.id === 'string') {
      return obj as QrPayload;
    }
  } catch {}
  return null;
}
