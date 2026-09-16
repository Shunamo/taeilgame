import type { NextPage } from 'next';
import dynamic from 'next/dynamic';

const Game2D = dynamic(
  () => import('@/components/game2d/Game2D').then((m) => m.Game2D),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#0a0c1b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ color: '#ffd700', fontFamily: 'sans-serif', fontSize: '16px' }}>
          게임 불러오는 중...
        </p>
      </div>
    ),
  }
);

const GamePage: NextPage = () => {
  return (
    <main
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        background: '#000',
        overflow: 'hidden',
      }}
    >
      <Game2D />
    </main>
  );
};

export default GamePage;

