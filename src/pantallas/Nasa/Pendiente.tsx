import { useLocation } from 'react-router';
import { RUTAS_NASA, RUTA_NASA, nombreRuta } from '../../app/rutas';
import { textos } from '../../idioma/idioma';
import './Nasa.css';

/** Pantalla provisional de una vista de NASA en vivo que todavía se está construyendo. */
export function Pendiente() {
  const ruta = useLocation().pathname.slice(1);
  const actual = [RUTA_NASA, ...RUTAS_NASA].find((r) => r.path === ruta);
  return (
    <section className="nasa" aria-labelledby="t-nasa">
      <p className="nasa-kicker">NASA</p>
      <h2 id="t-nasa" className="nasa-titulo">
        {actual ? nombreRuta(actual) : 'NASA'}
      </h2>
      <p className="nasa-lead">
        {textos({
          es: 'Esta vista está en construcción.',
          en: 'This view is being built.',
        })}
      </p>
    </section>
  );
}
