import Head from 'next/head';
import ParallaxProvider from '../components/ParallaxProvider';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import LiveTicker from '../components/LiveTicker';
import DemoPanel from '../components/DemoPanel';
import HowItWorks3D from '../components/HowItWorks3D';
import StorySection from '../components/StorySection';
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
        
        <StorySection
          imageSrc="/assets/crowd.png"
          title={<span>The Roar of the <br/><em className="text-coral">Gaur</em></span>}
          text={<p>In Goa, football is a religion. The stands of Fatorda vibrate with the passion of thousands. But the soul of the game isn't just in the goals; it's in the voices, the chants, and the raw emotion of the Konkani language echoing through the stadium.</p>}
          align="left"
        />

        <div style={{ position: 'relative', zIndex: 10, background: 'linear-gradient(to bottom, var(--bg), #0c1220, var(--bg))', paddingTop: '4rem', paddingBottom: '4rem' }}>
          <div className="section-header">
            <span className="section-tag">AI-Powered Passion</span>
            <h2 className="section-title">Bring the Stadium <em>Home</em></h2>
          </div>
          <DemoPanel />
        </div>

        <StorySection
          imageSrc="/assets/beach.png"
          title={<span>From the Sand to the <br/><em className="text-amber">Pitch</em></span>}
          text={<p>Whether it's a kickabout on Benaulim beach or the ISL finals, every moment deserves legendary commentary. Our local AI model translates and voices your clips with true Goan flavor, straight from your machine.</p>}
          align="right"
        />

        <HowItWorks3D />
        <Footer />
      </ParallaxProvider>
    </>
  );
}
