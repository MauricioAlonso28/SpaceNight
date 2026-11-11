declare module 'magvar' {
  /**
   * Declinación magnética en grados (World Magnetic Model 2025), positiva si el norte magnético está al este.
   * @param altitud kilómetros sobre el nivel del mar
   * @param cuando fecha del cálculo; por defecto, ahora
   */
  export function magvar(
    latitud: number,
    longitud: number,
    altitud?: number,
    cuando?: Date,
  ): number;
}
