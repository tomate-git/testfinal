import { Reservation, User, Space } from '../types';

export function resolveReservationInfo(
  reservations: Reservation[],
  users: User[],
  spaces: Space[],
  id: string
) {
  const reservation = reservations.find(r => r.id === id) || null;
  const user = reservation ? users.find(u => u.id === reservation.userId) || null : null;
  const space = reservation ? spaces.find(s => s.id === reservation.spaceId) || null : null;
  return { reservation, user, space };
}
