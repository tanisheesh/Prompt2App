import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0C0C0E',
          borderRadius: '40px',
          color: '#FAFAFA',
          fontSize: 84,
          fontWeight: 800,
          letterSpacing: '-0.05em',
        }}
      >
        <span>&gt;</span>
        <span style={{ color: '#10B981' }}>_</span>
      </div>
    ),
    { ...size }
  );
}
