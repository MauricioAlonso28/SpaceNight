/** Idiomas de la interfaz. */
export type Idioma = 'es' | 'en';

/** Lo que se elige en Ajustes: seguir al navegador o fijar un idioma. */
export type PreferenciaIdioma = 'auto' | Idioma;

let actual: Idioma = 'en';

/**
 * El primero de los idiomas preferidos que la app tiene; si no tiene ninguno, inglés.
 * @param preferidos etiquetas como las de navigator.languages, por ejemplo es-PE o en-US
 */
export function detectarIdioma(preferidos: readonly string[]): Idioma {
  for (const etiqueta of preferidos) {
    const base = etiqueta.toLowerCase().slice(0, 2);
    if (base === 'es' || base === 'en') return base;
  }
  return 'en';
}

/** Idioma que pide el navegador, o inglés fuera de un navegador. */
export function idiomaNavegador(): Idioma {
  if (typeof navigator === 'undefined') return 'en';
  const lista = navigator.languages?.length
    ? navigator.languages
    : [navigator.language ?? ''];
  return detectarIdioma(lista);
}

/** El idioma que se usa para una preferencia guardada. */
export function resolverIdioma(preferencia: PreferenciaIdioma): Idioma {
  return preferencia === 'auto' ? idiomaNavegador() : preferencia;
}

/** Idioma con el que se está dibujando la interfaz. */
export function idioma(): Idioma {
  return actual;
}

/** Cambia el idioma de los textos; la raíz vuelve a montar la app al cambiarlo. */
export function fijarIdioma(nuevo: Idioma): void {
  actual = nuevo;
}

/** Los textos del idioma actual de un juego de traducciones. */
export function textos<T>(porIdioma: Record<Idioma, T>): T {
  return porIdioma[actual];
}
