/** Pantalla provisional mientras llega la fase que la construye. */
export function Pendiente({ titulo, fase }: { titulo: string; fase: string }) {
  return (
    <section className="pendiente">
      <h1>{titulo}</h1>
      <p>Llega en la {fase}.</p>
    </section>
  );
}
