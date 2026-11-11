import type { ReactNode } from 'react';

/** Trazos de 24 × 24 de cada pantalla, dibujados con línea para que hereden el color del texto. */
export const ICONOS: Record<string, ReactNode> = {
  'esta-noche': <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  mapa: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 10l6.5-2.5-1 7.5-5.5-1z" />
    </>
  ),
  camara: (
    <>
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  explorar: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" />
    </>
  ),
  cohete: (
    <>
      <path d="M12 2.5c2.9 2.3 4.4 5.8 4.4 9.9v4.1H7.6v-4.1c0-4.1 1.5-7.6 4.4-9.9z" />
      <circle cx="12" cy="10" r="1.8" />
      <path d="M7.6 13.2 5 16.4v3.1h2.6M16.4 13.2l2.6 3.2v3.1h-2.6M10.4 19.2 12 21.8l1.6-2.6" />
    </>
  ),
  'cohete/lanzamientos': (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2.5M9.5 2.5h5M12 2.5V5M19 6l1.5-1.5" />
    </>
  ),
  'cohete/vuelo': (
    <>
      <path d="M3 20c4-1 8-5 11-11" />
      <path d="M14 9l1-5 3 3-4 2z" />
      <path d="M3 20h18" strokeDasharray="2 3" />
    </>
  ),
  nasa: (
    <>
      <path d="M3 12h3l2.5-6 4 13 3-9 1.5 2H21" />
    </>
  ),
  'nasa/asteroides': (
    <>
      <path d="M9 6.5l4-1.5 4 2 1.5 4-1.5 4-4 2.5-4.5-1-2.5-3.5.5-4z" />
      <path d="M3 21l4-4M2.5 16.5 5 14M7.5 21.5 10 19" />
    </>
  ),
  'nasa/tierra': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M5 8.5c2.5.5 3 2.5 5 2.5s1.5 3 3.5 3.5M14 3.5c-1 2 0 3.5 2 4s2.5 2.5 1.5 4M7 18.5c1-1.5 2.5-2 3.5-1" />
    </>
  ),
  'nasa/sol-luna': (
    <>
      <circle cx="9" cy="9" r="4" />
      <path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.7 3.7l1.4 1.4M12.9 12.9l1.4 1.4M3.7 14.3l1.4-1.4M12.9 5.1l1.4-1.4" />
      <path d="M21 17.5a4.5 4.5 0 1 1-5-5.5 3.5 3.5 0 0 0 5 5.5z" />
    </>
  ),
  'nasa/naves': (
    <>
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
      <path d="M2.5 9.5h5v5h-5zM16.5 9.5h5v5h-5zM7.5 12h2M14.5 12h2M12 9.5V5M12 5l-2.5-2M12 5l2.5-2M12 14.5V19" />
    </>
  ),
  'nasa/eventos': (
    <path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-3.5 2.5-5 .5 1.5 1.5 2.5 2.5 2.5C12 8.5 11 6 12 3z" />
  ),
  'nasa/bolidos': (
    <>
      <circle cx="16.5" cy="16.5" r="3.5" />
      <path d="M13.5 13.5 4 4M16 11.5 9.5 5M11.5 16 5 9.5" />
    </>
  ),
  'nasa/exoplanetas': (
    <>
      <circle cx="9" cy="13" r="5" />
      <path d="M2.5 15.5c3-.5 8-2.5 12.5-6" />
      <path d="M18 3.5v4M16 5.5h4" />
    </>
  ),
  'nasa/archivo': (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="1.5" />
      <path d="M3.5 16l5-5 4 4 2.5-2.5 5.5 5.5" />
      <circle cx="15.5" cy="9" r="1.5" />
    </>
  ),
  mas: <path d="M4 7h16M4 12h16M4 17h16" />,
};
