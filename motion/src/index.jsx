import React from "react";
import {
  AbsoluteFill,
  Composition,
  registerRoot,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
export const PulsePortal = () => {
  const frame = useCurrentFrame(),
    { fps } = useVideoConfig();
  const enter = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 95, mass: 0.8 },
  });
  const charge = interpolate(frame, [0, 35, 58, 71], [0, 0.25, 1, 0], {
    extrapolateRight: "clamp",
  });
  const burst = interpolate(frame, [50, 62, 71], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rotation = frame * 2.7;
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#152630",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width="960"
        height="540"
        viewBox="0 0 960 540"
        style={{ position: "absolute", inset: 0 }}
      >
        <g
          transform={`translate(480 270) scale(${0.7 + enter * 0.3 + burst * 0.65})`}
        >
          {[180, 145, 108].map((radius, i) => (
            <g
              key={radius}
              transform={`rotate(${rotation * (i % 2 ? -1 : 1) + i * 42})`}
              opacity={0.35 + i * 0.15}
            >
              <ellipse
                rx={radius}
                ry={radius * (0.35 + i * 0.15)}
                fill="none"
                stroke={i === 1 ? "#ff8169" : "#83e5da"}
                strokeWidth={i === 1 ? 3 : 2}
                strokeDasharray={i === 2 ? "48 16" : "none"}
              />
            </g>
          ))}
          {Array.from({ length: 20 }, (_, i) => {
            const angle = (i * Math.PI) / 10 + frame * 0.015,
              distance = 80 + (i % 4) * 32 - charge * 45;
            return (
              <circle
                key={i}
                cx={Math.cos(angle) * distance}
                cy={Math.sin(angle) * distance * 0.7}
                r={2 + (i % 3)}
                fill={i % 5 === 0 ? "#ffb39e" : "#c8fff0"}
                opacity={Math.max(0, charge * 0.8)}
              />
            );
          })}
          <g
            transform={`rotate(${12 + rotation * 0.35}) scale(${enter * (1 + charge * 0.22)})`}
          >
            <rect
              x="-32"
              y="-32"
              width="64"
              height="64"
              rx="17"
              fill="#83e5da"
            />
            <path d="m5-22-23 28H0l-4 19 24-30H3z" fill="#153632" />
          </g>
          {[0, 1, 2].map((i) => (
            <circle
              key={i}
              r={40 + burst * 210 + i * 20}
              fill="none"
              stroke="#e4fff4"
              strokeWidth={3 - i * 0.7}
              opacity={Math.max(0, burst * (1 - i * 0.25))}
            />
          ))}
        </g>
        <rect width="960" height="540" fill="#d4fff0" opacity={burst * 0.13} />
      </svg>
    </AbsoluteFill>
  );
};
const Root = () => (
  <Composition
    id="PulsePortal"
    component={PulsePortal}
    durationInFrames={72}
    fps={60}
    width={960}
    height={540}
  />
);
registerRoot(Root);
