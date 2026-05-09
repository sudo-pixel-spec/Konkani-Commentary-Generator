import Head from 'next/head';
import ParallaxProvider from '../components/ParallaxProvider';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import LiveTicker from '../components/LiveTicker';
import DemoPanel from '../components/DemoPanel';
import HowItWorks3D from '../components/HowItWorks3D';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <>
      <Head>
        <title>Konkani Commentary Generator - Hear the Game in Goa</title>
      </Head>

      <ParallaxProvider>
        <Navbar />
        <HeroSection />
        <LiveTicker />
        <DemoPanel />
        <HowItWorks3D />
        <Footer />
      </ParallaxProvider>
    </>
  );
}
