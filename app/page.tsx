import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/sections/HeroSection';
import BrandStorySection from '@/components/sections/BrandStorySection';
import PartnersSection from '@/components/sections/PartnersSection';
import ServicesSection from '@/components/sections/ServicesSection';
import FleetSection from '@/components/sections/FleetSection';
import BenefitsSection from '@/components/sections/BenefitsSection';
import MapSection from '@/components/sections/MapSection';
import CtaSection from '@/components/sections/CtaSection';
import BookingModal from '@/components/booking/BookingModal';

export default function Home() {
  return (
    <>
      <Header />
      <HeroSection />
      <PartnersSection />
      <BrandStorySection />
      <ServicesSection />
      <FleetSection />
      <BenefitsSection />
      <MapSection />
      <CtaSection />
      <Footer />
      <BookingModal />
    </>
  );
}
