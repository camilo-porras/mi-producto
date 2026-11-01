import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { usePedidos } from "@/lib/pedidos";
import { FormularioCliente } from "@/components/FormularioCliente";

const etiqueta = "block text-sm font-bold text-muted-foreground mb-2";
const campo =
  "w-full rounded-2xl border border-border bg-card px-4 py-4 text-lg outline-none focus:border-primary";

// Pasa a minúsculas y quita tildes para que "maria" encuentre a "María".
export const normalizar = (t: string) =>
  t
    .toLocaleLowerCase("es-CO")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

type Props = { clienteId: string; onChange: (id: string) => void };

// Elige un cliente ya registrado (buscando por nombre, negocio o teléfono) o crea uno nuevo.
export function SelectorCliente({ clienteId, onChange }: Props) {
  const { clientes, crearCliente, cargando } = usePedidos();
  const [busqueda, setBusqueda] = useState("");
  const [creando, setCreando] = useState(false);

  const elegido = clientes.find((c) => c.id === clienteId);

  if (elegido) {
    return (
      <div>
        <span className={etiqueta}>Cliente</span>
        <div className="tarjeta-cuero p-4">
          <p className="text-lg font-semibold">{elegido.nombre}</p>
          {elegido.negocio ? (
            <p className="text-sm text-muted-foreground">{elegido.negocio}</p>
          ) : null}
          <p className="mt-1 text-sm text-muted-foreground">
            {[elegido.telefono, elegido.direccion, elegido.ciudad, elegido.departamento]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <div className="mt-3 flex gap-5">
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-sm font-semibold text-primary underline"
            >
              Cambiar cliente
            </button>
            <Link
              to="/clientes/$id"
              params={{ id: elegido.id }}
              className="text-sm font-semibold text-primary underline"
            >
              Editar datos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (creando) {
    return (
      <div>
        <span className={etiqueta}>Cliente nuevo</span>
        <div className="tarjeta-cuero p-4">
          <FormularioCliente
            inicial={{ nombre: busqueda.trim() }}
            textoBoton="Guardar cliente"
            onCancelar={() => setCreando(false)}
            onGuardar={async (datos) => {
              const nuevo = await crearCliente(datos);
              onChange(nuevo.id);
              setCreando(false);
              setBusqueda("");
            }}
          />
        </div>
      </div>
    );
  }

  const q = normalizar(busqueda.trim());
  const resultados = clientes
    .filter(
      (c) =>
        !q ||
        normalizar(c.nombre).includes(q) ||
        normalizar(c.negocio).includes(q) ||
        c.telefono.replace(/\D/g, "").includes(q.replace(/\D/g, "") || "no-coincide"),
    )
    .slice(0, 6);

  return (
    <div>
      <label className={etiqueta} htmlFor="buscar-cliente">
        Cliente
      </label>
      <input
        id="buscar-cliente"
        className={campo}
        placeholder="Busca por nombre, negocio o teléfono"
        autoComplete="off"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      {cargando ? (
        <p className="mt-2 text-sm text-muted-foreground">Cargando clientes…</p>
      ) : resultados.length > 0 ? (
        <ul className="tarjeta-cuero mt-3 divide-y divide-border">
          {resultados.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onChange(c.id)}
                className="block w-full px-4 py-3 text-left"
              >
                <span className="block font-semibold">{c.nombre}</span>
                <span className="block text-xs text-muted-foreground">
                  {[c.negocio, c.telefono, c.ciudad].filter(Boolean).join(" · ") || "Sin más datos"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">No encontramos ese cliente.</p>
      )}

      <button
        type="button"
        onClick={() => setCreando(true)}
        className="mt-3 h-14 w-full rounded-2xl border-2 border-primary bg-card text-base font-bold text-primary"
      >
        + Cliente nuevo
      </button>
    </div>
  );
}
