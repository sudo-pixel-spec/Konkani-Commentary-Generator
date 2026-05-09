import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="description" content="World's first AI live match commentary in Konkani - the language of Goa. Upload football clips and hear them voiced in Konkani using free, local AI models." />
        <meta name="theme-color" content="#0A0E1A" />
        <meta property="og:title" content="Konkani Commentary Generator - Hear the Game in Goa" />
        <meta property="og:description" content="AI-powered football commentary in Konkani. 100% free, runs locally on your GPU." />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎙️</text></svg>" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
