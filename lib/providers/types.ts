export interface FlightSearchParams {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  adults: number;
}

export interface FlightOffer {
  id: string;
  provider: string;
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  airline: string;
  price: number;
  currency: string;
  stops: number;
  durationMinutes: number;
  /** ISO timestamp of first departure and final arrival — needed for connection-time math (e.g. self-transfer search). */
  departAt: string;
  arriveAt: string;
  deepLink: string;
}

export interface FlightProvider {
  name: string;
  isConfigured(): boolean;
  search(params: FlightSearchParams): Promise<FlightOffer[]>;
}
