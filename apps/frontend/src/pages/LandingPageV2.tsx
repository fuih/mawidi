import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorks from "@/components/landing/HowItWorks";
import SocialProof from "@/components/landing/SocialProof";
import { DoctorSection } from "@/components/landing/DoctorSection";
import Footer from "@/components/landing/Footer";

export default function LandingPageV2() {
    return (
        <div className="min-h-screen" style={{ fontFamily: "'Inter', sans-serif" }}>
            <Navbar />
            <HeroSection />
            <HowItWorks />
            <SocialProof />
            <DoctorSection />
            <Footer />
        </div>
    );
}
