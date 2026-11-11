/**
 * Guarda en --barra-scroll el ancho de la barra de desplazamiento, siempre reservada (scrollbar-gutter: stable).
 * Así las secciones a todo el ancho usan --vw y no se meten bajo la barra ni se descentran.
 */
export function medirBarraScroll(): void {
  const medir = () => {
    const ancho = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--barra-scroll', `${ancho}px`);
  };
  medir();
  requestAnimationFrame(medir);
  window.addEventListener('load', medir);
  window.addEventListener('resize', medir);
}
