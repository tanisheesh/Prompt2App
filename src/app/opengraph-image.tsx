import { ImageResponse } from 'next/og';

export const alt = 'Prompt2App — Build & Ship Web Apps from Plain English';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#09090B',
          padding: '72px 80px',
          color: '#FAFAFA',
        }}
      >
        {/* Top Brand Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#18181B',
                border: '1px solid #27272A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 700,
              }}
            >
              <span>&gt;</span>
              <span style={{ color: '#10B981' }}>_</span>
            </div>
            <span
              style={{
                fontSize: '28px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}
            >
              Prompt2App
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 18px',
              borderRadius: '999px',
              background: '#18181B',
              border: '1px solid #27272A',
              fontSize: '18px',
              color: '#A1A1AA',
            }}
          >
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '999px',
                background: '#10B981',
              }}
            />
            <span>Powered by Groq LPU</span>
          </div>
        </div>

        {/* Center Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              fontSize: '68px',
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: '-0.035em',
              maxWidth: '960px',
            }}
          >
            Turn plain English into working web apps in seconds.
          </div>
          <div
            style={{
              fontSize: '26px',
              color: '#A1A1AA',
              maxWidth: '820px',
              lineHeight: 1.4,
            }}
          >
            Live sandboxed preview · Multi-turn edits · Voice dictation ·
            Zero-dependency HTML export
          </div>
        </div>

        {/* Bottom URL */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid #27272A',
            paddingTop: '28px',
            fontSize: '20px',
            color: '#71717A',
          }}
        >
          <span>prompt2app.tanisheesh.in</span>
          <span style={{ color: '#E4E4E7' }}>Open Studio →</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
