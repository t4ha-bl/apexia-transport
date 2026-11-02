export interface Vehicle {
  id: string;
  name: string;
  category: string;
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
  description: string;
  descriptionEn?: string;
}

export interface Partner {
  id: string;
  name: string;
  logo: string;
}

export interface Reservation {
  id: string;
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
}

export interface ContactInfo {
  phoneOffice: string;
  phoneOfficeHours: string;
  phoneSecondary: string;
  phoneSecondaryHours: string;
  phoneEmergency: string;
  phoneEmergencyHours: string;
  emailContact: string;
  emailBooking: string;
  emailReclamation: string;
  whatsappUrl: string;
}

export interface LegalTexts {
  privacy: string;
  terms: string;
  slavery: string;
}
