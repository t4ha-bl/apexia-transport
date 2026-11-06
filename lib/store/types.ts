export interface Vehicle {
  id: string;
  name: string;
  nameEn?: string;
  category: string;
  categoryEn?: string;
  image: string;
  passengers?: number;
  luggage?: number;
  rating?: number;
  description?: string;
}

export interface Service {
  id: string;
  number: string;
  icon: string;
  title: string;
  titleEn?: string;
  price: string;
  priceEn?: string;
  description: string;
  descriptionEn?: string;
}

export interface Partner {
  id: string;
  name: string;
  logo: string;
  order?: number;
}

export interface Reservation {
  id: string;
  ref?: string; // customer-facing reference, e.g. APEX-3021
  service: string;
  vehicle: string;
  fullName: string;
  phone: string;
  address?: string;
  date: string;
  time: string;
  pickup: string;
  destination: string;
  message?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  // Optional details the customer can give in the booking form
  passengers?: number | null;
  luggage?: number | null;
  flightNumber?: string;
  email?: string;                  // optional, used for the review request after the trip
  lang?: 'fr' | 'en';              // language the customer booked in
  // Admin-only fields (the security rules block them on public bookings)
  price?: number | null;           // agreed price, MAD
  source?: 'website' | 'whatsapp' | 'phone' | 'email' | 'partner' | 'other';
  signName?: string;               // name to show on the pickup sign
  durationMin?: number | null;     // estimated job length, for the planning calendar
  notes?: string;                  // internal notes, never shown to the customer
  driverId?: string | null;
  fleetUnitId?: string | null;
  jobToken?: string | null;        // secret of the driver job link, if one was created
  reviewToken?: string | null;     // secret of the review request link, once sent
  reviewRequestedAt?: string | null;
  updatedAt?: string;
}

export interface Office {
  city: string;
  address: string;   // may contain line breaks
  lat: number;
  lng: number;
}

export interface ContactInfo {
  phoneOffice: string;
  phoneOfficeHours: string;
  phoneOfficeHoursEn?: string;
  phoneSecondary: string;
  phoneSecondaryHours: string;
  phoneSecondaryHoursEn?: string;
  phoneEmergency: string;
  phoneEmergencyHours: string;
  phoneEmergencyHoursEn?: string;
  emailContact: string;
  emailBooking: string;
  emailReclamation: string;
  whatsappUrl: string;
  offices?: Office[];
}

export interface LegalTexts {
  privacy: string;
  terms: string;
  slavery: string;
  privacyEn?: string;
  termsEn?: string;
  slaveryEn?: string;
}
