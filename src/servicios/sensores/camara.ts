/** Abre la cámara trasera sin audio; falla si no hay cámara o no hay permiso. */
export async function abrirCamaraTrasera(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia)
    throw new Error('CAMERA_UNSUPPORTED');
  return navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode: { ideal: 'environment' } },
  });
}

/** Apaga todas las pistas del vídeo para que se apague el indicador de cámara. */
export function cerrarCamara(stream: MediaStream | null): void {
  stream?.getTracks().forEach((t) => t.stop());
}
