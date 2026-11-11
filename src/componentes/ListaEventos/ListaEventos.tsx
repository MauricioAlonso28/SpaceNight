import './ListaEventos.css';

/** Un evento ya redactado para mostrar. */
export interface ItemEvento {
  clave: string;
  icono: string;
  titulo: string;
  detalle: string;
}

/** Lista de próximos eventos con icono, título y detalle; avisa si está vacía. */
export function ListaEventos({
  items,
  vacia,
}: {
  items: ItemEvento[];
  vacia: string;
}) {
  if (items.length === 0) return <p className="panel aviso">{vacia}</p>;
  return (
    <ul className="eventos panel">
      {items.map((e) => (
        <li key={e.clave}>
          <span className="eventos-icono" aria-hidden="true">
            {e.icono}
          </span>
          <div>
            <p className="eventos-titulo">{e.titulo}</p>
            <p className="eventos-detalle">{e.detalle}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
