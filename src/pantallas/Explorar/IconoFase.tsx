import { rutaIluminada } from './datosExplorar';

/**
 * Luna dibujada con su fase: parte iluminada a la derecha al crecer en el hemisferio norte y a la izquierda en el sur.
 * @param angulo ángulo de fase en grados, 0 nueva y 180 llena
 */
export function IconoFase({
  angulo,
  hemisferioSur,
  tamano = 18,
}: {
  angulo: number;
  hemisferioSur: boolean;
  tamano?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={tamano}
      height={tamano}
      aria-hidden="true"
      className="icono-fase"
    >
      <circle cx="12" cy="12" r="10" fill="#26305a" />
      <path d={rutaIluminada(angulo, hemisferioSur)} fill="#efe6cc" />
    </svg>
  );
}
