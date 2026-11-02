import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Service, Vehicle, Partner, Reservation, ContactInfo, LegalTexts } from './types';
import { fetchCollection, fetchDocument, addDocument } from '../firebaseUtils';

interface AppStore {
  lang: 'fr' | 'en';
  setLang: (lang: 'fr' | 'en') => void;

  isInitialized: boolean;
  initializeStore: () => Promise<void>;

  reservations: Reservation[];
  addReservation: (r: Reservation) => Promise<void>;
  updateReservation: (id: string, updates: Partial<Reservation>) => void;
  deleteReservation: (id: string) => void;

  services: Service[];
  addService: (s: Service) => void;
  updateService: (id: string, updates: Partial<Service>) => void;
  deleteService: (id: string) => void;

  vehicles: Vehicle[];
  addVehicle: (v: Vehicle) => void;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;

  partners: Partner[];
  addPartner: (p: Partner) => void;
  updatePartner: (id: string, updates: Partial<Partner>) => void;
  deletePartner: (id: string) => void;

  contactInfo: ContactInfo;
  updateContactInfo: (updates: Partial<ContactInfo>) => void;

  legalTexts: LegalTexts;
  updateLegalText: (key: keyof LegalTexts, text: string) => void;

  isBookingOpen: boolean;
  preSelectedService: string | null;
  preSelectedVehicle: string | null;
  openBooking: (serviceId?: string, vehicleId?: string) => void;
  closeBooking: () => void;
}

const emptyContactInfo: ContactInfo = {
  phoneOffice: '', phoneOfficeHours: '', phoneSecondary: '',
  phoneSecondaryHours: '', phoneEmergency: '', phoneEmergencyHours: '',
  emailContact: '', emailBooking: '', emailReclamation: '', whatsappUrl: ''
};

const emptyLegalTexts: LegalTexts = {
  privacy: '', terms: '', slavery: ''
};

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      lang: 'fr',
      setLang: (lang) => set({ lang }),
      
      isInitialized: false,
      initializeStore: async () => {
        try {
          const [services, vehicles, partners, contactDoc, legalDoc] = await Promise.all([
            fetchCollection('services', 'number'),
            fetchCollection('vehicles'),
            fetchCollection('partners'),
            fetchDocument('settings', 'contact'),
            fetchDocument('settings', 'legal')
          ]);

          // Sort services numerically to ensure 1, 2, 3, 10 order
          const sortedServices = (services as Service[]).sort((a, b) => {
            const numA = parseInt(a.number) || 999;
            const numB = parseInt(b.number) || 999;
            return numA - numB;
          });

          set({
            services: sortedServices,
            vehicles: vehicles as Vehicle[],
            partners: partners as Partner[],
            contactInfo: (contactDoc as any) || emptyContactInfo,
            legalTexts: (legalDoc as any) || emptyLegalTexts,
            isInitialized: true
          });
        } catch (err) {
          console.error("Failed to fetch initial data from Firestore:", err);
        }
      },

      reservations: [],
      addReservation: async (r) => {
        try {
          await addDocument('reservations', r);
          set((state) => ({ reservations: [r, ...state.reservations] }));
        } catch (e) {
          console.error("Failed to add reservation to firestore:", e);
        }
      },
      updateReservation: (id, updates) => set((state) => ({
        reservations: state.reservations.map((r) => r.id === id ? { ...r, ...updates } : r)
      })),
      deleteReservation: (id) => set((state) => ({
        reservations: state.reservations.filter((r) => r.id !== id)
      })),

      services: [],
      addService: (s) => set((state) => ({ services: [...state.services, s] })),
      updateService: (id, updates) => set((state) => ({
        services: state.services.map((s) => s.id === id ? { ...s, ...updates } : s)
      })),
      deleteService: (id) => set((state) => ({
        services: state.services.filter((s) => s.id !== id)
      })),

      vehicles: [],
      addVehicle: (v) => set((state) => ({ vehicles: [...state.vehicles, v] })),
      updateVehicle: (id, updates) => set((state) => ({
        vehicles: state.vehicles.map((v) => v.id === id ? { ...v, ...updates } : v)
      })),
      deleteVehicle: (id) => set((state) => ({
        vehicles: state.vehicles.filter((v) => v.id !== id)
      })),

      partners: [],
      addPartner: (p) => set((state) => ({ partners: [...state.partners, p] })),
      updatePartner: (id, updates) => set((state) => ({
        partners: state.partners.map((p) => p.id === id ? { ...p, ...updates } : p)
      })),
      deletePartner: (id) => set((state) => ({
        partners: state.partners.filter((p) => p.id !== id)
      })),

      contactInfo: emptyContactInfo,
      updateContactInfo: (updates) => set((state) => ({ contactInfo: { ...state.contactInfo, ...updates } })),

      legalTexts: emptyLegalTexts,
      updateLegalText: (key, text) => set((state) => ({ legalTexts: { ...state.legalTexts, [key]: text } })),

      isBookingOpen: false,
      preSelectedService: null,
      preSelectedVehicle: null,
      openBooking: (serviceId?: string, vehicleId?: string) => set({ 
        isBookingOpen: true, 
        preSelectedService: serviceId || null, 
        preSelectedVehicle: vehicleId || null 
      }),
      closeBooking: () => set({ isBookingOpen: false, preSelectedService: null, preSelectedVehicle: null })
    }),
    { name: 'apexia-store-fb' } // Renamed to wipe old cached local storage
  )
);

