import type { AppProps } from 'next/app';
import Head from 'next/head';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0d0d2b" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="별빛 마을" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* Prevent zoom on double-tap (iOS) */}
        <meta name="format-detection" content="telephone=no" />
        <title>별빛 저택으로 가는 길 🌟</title>
        
        {/* Open Graph / Social Media Preview Thumbnail (티모 썸네일) */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="별빛 저택으로 가는 길 🌟" />
        <meta property="og:description" content="태일이를 위한 몬드풍 2D 픽셀 RPG 어드벤처 축제 파티!" />
        <meta property="og:image" content="https://taeilgame.vercel.app/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="별빛 저택으로 가는 길 🌟" />
        <meta name="twitter:description" content="태일이를 위한 몬드풍 2D 픽셀 RPG 어드벤처 축제 파티!" />
        <meta name="twitter:image" content="https://taeilgame.vercel.app/og-image.png" />
        <link rel="icon" href="/teemo-thumbnail.png" />
        <link rel="apple-touch-icon" href="/teemo-thumbnail.png" />

        <link rel="manifest" href="/manifest.json" />
        {/* Korean font — loaded as <link> to avoid CSS @import ordering issues */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
