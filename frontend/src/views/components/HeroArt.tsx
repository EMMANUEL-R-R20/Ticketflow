import { useEffect, useRef } from "react";

// ─── HeroArt ──────────────────────────────────────────────────────────────────
// Ilustraciones planas y animadas de la columna derecha del hero de la Landing:
// un ticket, un micrófono y las máscaras de teatro. Son SVG dibujados a mano,
// sin imágenes ni librerías, así que no dependen de Unsplash y pesan casi nada.
//
// Animaciones (todas dentro del propio SVG):
//  - Ticket: flota, se balancea, un brillo lo cruza y su línea punteada avanza.
//  - Micrófono: se mece y las ondas de sonido pulsan.
//  - Máscaras: se balancean en sentido contrario y parpadean.
// Si la persona tiene activado "reducir movimiento" en su sistema, se detienen.

export function HeroArt() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    ref.current?.querySelectorAll("svg").forEach((s) => s.pauseAnimations());
  }, []);

  return (
    <div ref={ref} className="grid grid-cols-2 gap-3" aria-hidden="true">
      {/* Ticket grande */}
      <div className="col-span-2 h-32 sm:h-40 rounded-2xl overflow-hidden">
        <svg
          viewBox="0 0 600 200"
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full block"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="bB1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#6D28D9" />
              <stop offset="1" stopColor="#ec4899" />
            </linearGradient>
            <clipPath id="bTk">
              <path d="M4 13a3.5 3.5 0 0 1 3.5-3.5h25A3.5 3.5 0 0 1 36 13v3.2a2.8 2.8 0 0 0 0 5.6V25a3.5 3.5 0 0 1-3.5 3.5h-25A3.5 3.5 0 0 1 4 25v-3.2a2.8 2.8 0 0 0 0-5.6V13z" />
            </clipPath>
          </defs>
          <rect width="600" height="200" fill="url(#bB1)" />
          <circle cx="90" cy="150" r="70" fill="#fff" opacity=".07">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0 0;14 -10;0 0"
              dur="9s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="530" cy="40" r="60" fill="#fff" opacity=".08">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0 0;-12 10;0 0"
              dur="11s"
              repeatCount="indefinite"
            />
          </circle>
          <g>
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0 0;0 -7;0 0"
              dur="4.2s"
              repeatCount="indefinite"
              calcMode="spline"
              keyTimes="0;.5;1"
              keySplines=".45 0 .55 1;.45 0 .55 1"
            />
            <g transform="translate(204 8.8) scale(4.8) rotate(-6 20 19)">
              <animateTransform
                attributeName="transform"
                type="rotate"
                additive="sum"
                values="-1.8 20 19;1.8 20 19;-1.8 20 19"
                dur="4.2s"
                repeatCount="indefinite"
                calcMode="spline"
                keyTimes="0;.5;1"
                keySplines=".45 0 .55 1;.45 0 .55 1"
              />
              <path
                d="M4 13a3.5 3.5 0 0 1 3.5-3.5h25A3.5 3.5 0 0 1 36 13v3.2a2.8 2.8 0 0 0 0 5.6V25a3.5 3.5 0 0 1-3.5 3.5h-25A3.5 3.5 0 0 1 4 25v-3.2a2.8 2.8 0 0 0 0-5.6V13z"
                fill="#fff"
              />
              <g clipPath="url(#bTk)">
                <rect
                  x="-12"
                  y="-4"
                  width="9"
                  height="48"
                  fill="#ddd6fe"
                  opacity=".85"
                  transform="rotate(18 0 20)"
                >
                  <animate
                    attributeName="x"
                    values="-12;48;48"
                    keyTimes="0;.45;1"
                    dur="4.8s"
                    repeatCount="indefinite"
                  />
                </rect>
              </g>
              <line
                x1="20"
                y1="10.5"
                x2="20"
                y2="27.5"
                stroke="#6D28D9"
                strokeWidth="1.4"
                strokeDasharray="1.6 2.6"
                strokeLinecap="round"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  values="0;-4.2"
                  dur="1.1s"
                  repeatCount="indefinite"
                />
              </line>
              <polygon
                points="0,-10 2.5,-2.5 10,0 2.5,2.5 0,10 -2.5,2.5 -10,0 -2.5,-2.5"
                transform="translate(12 19) scale(.45)"
                fill="#fbbf24"
              >
                <animate
                  attributeName="opacity"
                  values=".5;1;.5"
                  dur="1.8s"
                  repeatCount="indefinite"
                />
              </polygon>
              <polygon
                points="0,-10 2.5,-2.5 10,0 2.5,2.5 0,10 -2.5,2.5 -10,0 -2.5,-2.5"
                transform="translate(28 19) scale(.45)"
                fill="#fbbf24"
              >
                <animate
                  attributeName="opacity"
                  values=".5;1;.5"
                  dur="1.8s"
                  begin="-.9s"
                  repeatCount="indefinite"
                />
              </polygon>
            </g>
          </g>
          <polygon
            points="0,-10 2.5,-2.5 10,0 2.5,2.5 0,10 -2.5,2.5 -10,0 -2.5,-2.5"
            transform="translate(110 48) scale(1.1)"
            fill="#fbbf24"
            opacity="0.95"
          >
            <animate
              attributeName="opacity"
              values=".3;1;.3"
              dur="2.2s"
              begin="-0.0s"
              repeatCount="indefinite"
            />
          </polygon>
          <polygon
            points="0,-10 2.5,-2.5 10,0 2.5,2.5 0,10 -2.5,2.5 -10,0 -2.5,-2.5"
            transform="translate(490 150) scale(1.3)"
            fill="#fff"
            opacity="0.9"
          >
            <animate
              attributeName="opacity"
              values=".3;1;.3"
              dur="2.6s"
              begin="-0.7s"
              repeatCount="indefinite"
            />
          </polygon>
          <polygon
            points="0,-10 2.5,-2.5 10,0 2.5,2.5 0,10 -2.5,2.5 -10,0 -2.5,-2.5"
            transform="translate(70 160) scale(0.7)"
            fill="#fff"
            opacity="0.8"
          >
            <animate
              attributeName="opacity"
              values=".3;1;.3"
              dur="3.0s"
              begin="-1.4s"
              repeatCount="indefinite"
            />
          </polygon>
          <polygon
            points="0,-10 2.5,-2.5 10,0 2.5,2.5 0,10 -2.5,2.5 -10,0 -2.5,-2.5"
            transform="translate(540 96) scale(0.6)"
            fill="#fbbf24"
            opacity="0.9"
          >
            <animate
              attributeName="opacity"
              values=".3;1;.3"
              dur="3.4s"
              begin="-2.1s"
              repeatCount="indefinite"
            />
          </polygon>
          <polygon
            points="0,-10 2.5,-2.5 10,0 2.5,2.5 0,10 -2.5,2.5 -10,0 -2.5,-2.5"
            transform="translate(160 28) scale(0.6)"
            fill="#fff"
            opacity="0.8"
          >
            <animate
              attributeName="opacity"
              values=".3;1;.3"
              dur="3.8s"
              begin="-2.8s"
              repeatCount="indefinite"
            />
          </polygon>
        </svg>
      </div>
      {/* Micrófono */}
      <div className="h-24 sm:h-28 rounded-2xl overflow-hidden">
        <svg
          viewBox="0 0 300 136"
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full block"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="bB2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1A1B2E" />
              <stop offset="1" stopColor="#4c1d95" />
            </linearGradient>
          </defs>
          <rect width="300" height="136" fill="url(#bB2)" />
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="-3 150 124;3 150 124;-3 150 124"
              dur="3.2s"
              repeatCount="indefinite"
              calcMode="spline"
              keyTimes="0;.5;1"
              keySplines=".45 0 .55 1;.45 0 .55 1"
            />
            <rect
              x="128"
              y="22"
              width="44"
              height="64"
              rx="22"
              fill="#f472b6"
            />
            <path
              d="M128 44H172M128 56H172M128 68H172"
              stroke="#fff"
              strokeOpacity=".35"
              strokeWidth="2"
            />
            <path
              d="M114 64Q114 104 150 104Q186 104 186 64"
              fill="none"
              stroke="#fff"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M150 104V122M130 124H170"
              stroke="#fff"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </g>
          <path
            d="M92 50Q82 64 92 78M208 50Q218 64 208 78"
            stroke="#c4b5fd"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          >
            <animate
              attributeName="opacity"
              values=".2;1;.2"
              dur="1.4s"
              begin="-0s"
              repeatCount="indefinite"
            />
          </path>
          <path
            d="M76 40Q60 64 76 88M224 40Q240 64 224 88"
            stroke="#c4b5fd"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          >
            <animate
              attributeName="opacity"
              values=".2;1;.2"
              dur="1.4s"
              begin="-0.7s"
              repeatCount="indefinite"
            />
          </path>
          <polygon
            points="0,-10 2.5,-2.5 10,0 2.5,2.5 0,10 -2.5,2.5 -10,0 -2.5,-2.5"
            transform="translate(40 24) scale(0.6)"
            fill="#fbbf24"
            opacity="0.9"
          >
            <animate
              attributeName="opacity"
              values=".3;1;.3"
              dur="2.2s"
              begin="-0.0s"
              repeatCount="indefinite"
            />
          </polygon>
          <polygon
            points="0,-10 2.5,-2.5 10,0 2.5,2.5 0,10 -2.5,2.5 -10,0 -2.5,-2.5"
            transform="translate(262 110) scale(0.7)"
            fill="#fff"
            opacity="0.8"
          >
            <animate
              attributeName="opacity"
              values=".3;1;.3"
              dur="2.6s"
              begin="-0.7s"
              repeatCount="indefinite"
            />
          </polygon>
        </svg>
      </div>
      {/* Máscaras de teatro */}
      <div className="h-24 sm:h-28 rounded-2xl overflow-hidden">
        <svg
          viewBox="0 0 300 136"
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full block"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="bB3" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#be185d" />
              <stop offset="1" stopColor="#6D28D9" />
            </linearGradient>
          </defs>
          <rect width="300" height="136" fill="url(#bB3)" />
          <g transform="rotate(-12 112 66)">
            <animateTransform
              attributeName="transform"
              type="rotate"
              additive="sum"
              values="-5 112 66;5 112 66;-5 112 66"
              dur="3.4s"
              repeatCount="indefinite"
              calcMode="spline"
              keyTimes="0;.5;1"
              keySplines=".45 0 .55 1;.45 0 .55 1"
            />
            <path
              d="M112 28C140 28 150 40 150 62C150 90 134 106 112 106C90 106 74 90 74 62C74 40 84 28 112 28Z"
              fill="#ffffff"
            />
            <g transform="translate(0 56)">
              <g>
                <animateTransform
                  attributeName="transform"
                  type="scale"
                  values="1 1;1 1;1 .12;1 1;1 1"
                  keyTimes="0;.86;.9;.94;1"
                  dur="4s"
                  begin="-0s"
                  repeatCount="indefinite"
                />
                <g transform="translate(0 -56)">
                  <path
                    d="M92 56Q100 48 106 58Q99 62 92 56ZM118 58Q124 48 132 56Q125 62 118 58Z"
                    fill="#1A1B2E"
                  />
                </g>
              </g>
            </g>
            <path
              d="M94 78Q112 96 130 78"
              stroke="#1A1B2E"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />
          </g>
          <g transform="translate(78 8) rotate(12 112 66)">
            <animateTransform
              attributeName="transform"
              type="rotate"
              additive="sum"
              values="5 112 66;-5 112 66;5 112 66"
              dur="3.4s"
              repeatCount="indefinite"
              calcMode="spline"
              keyTimes="0;.5;1"
              keySplines=".45 0 .55 1;.45 0 .55 1"
            />
            <path
              d="M112 28C140 28 150 40 150 62C150 90 134 106 112 106C90 106 74 90 74 62C74 40 84 28 112 28Z"
              fill="#fbbf24"
            />
            <g transform="translate(0 56)">
              <g>
                <animateTransform
                  attributeName="transform"
                  type="scale"
                  values="1 1;1 1;1 .12;1 1;1 1"
                  keyTimes="0;.86;.9;.94;1"
                  dur="4s"
                  begin="-1.5s"
                  repeatCount="indefinite"
                />
                <g transform="translate(0 -56)">
                  <path
                    d="M92 56Q100 48 106 58Q99 62 92 56ZM118 58Q124 48 132 56Q125 62 118 58Z"
                    fill="#1A1B2E"
                  />
                </g>
              </g>
            </g>
            <path
              d="M94 96Q112 78 130 96"
              stroke="#1A1B2E"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />
          </g>
          <polygon
            points="0,-10 2.5,-2.5 10,0 2.5,2.5 0,10 -2.5,2.5 -10,0 -2.5,-2.5"
            transform="translate(30 30) scale(0.6)"
            fill="#fff"
            opacity="0.8"
          >
            <animate
              attributeName="opacity"
              values=".3;1;.3"
              dur="2.2s"
              begin="-0.0s"
              repeatCount="indefinite"
            />
          </polygon>
          <polygon
            points="0,-10 2.5,-2.5 10,0 2.5,2.5 0,10 -2.5,2.5 -10,0 -2.5,-2.5"
            transform="translate(272 24) scale(0.7)"
            fill="#fbbf24"
            opacity="0.9"
          >
            <animate
              attributeName="opacity"
              values=".3;1;.3"
              dur="2.6s"
              begin="-0.7s"
              repeatCount="indefinite"
            />
          </polygon>
        </svg>
      </div>
    </div>
  );
}
