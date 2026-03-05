/* ───────────── Shared admin types ───────────── */

export interface Stop {
  id: number;
  name: string;
  lat: number;
  lng: number;
  busId: number;
}

export interface Driver {
  id: number;
  phone: string;
  isActive: boolean;
  busId: number;
  bus?: { id: number; number: string };
}

export interface Bus {
  id: number;
  number: string;
  route: string;
  location: string;
  comment: string;
  stops: Stop[];
  drivers: Driver[];
}
