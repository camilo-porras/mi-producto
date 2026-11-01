import { useState } from "react";
import type { DatosCliente } from "@/lib/pedidos";

const etiqueta = "block text-sm font-bold text-muted-foreground mb-2";
const campo =
  "w-full rounded-2xl border border-border bg-card px-4 py-4 text-lg outline-none focus:border-primary";

type Props = {
  inicial?: Partial<DatosCliente>;
  textoBoton: string;
  onGuardar: (datos: DatosCliente) => Promise<void>;
  onCancelar?: () => void;
};

// Formulario de los datos de un cliente. No usa <form> para poder ir dentro del
// formulario de un pedido (no se permiten formularios anidados).
export function FormularioCliente({ inicial, textoBoton, onGuardar, onCancelar }: Props) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? "");
  const [negocio, setNegocio] = useState(inicial?.negocio ?? "");
  const [telefono, setTelefono] = useState(inicial?.telefono ?? "");
  const [direccion, setDireccion] = useState(inicial?.direccion ?? "");
  const [ciudad, setCiudad] = useState(inicial?.ciudad ?? "");
  const [departamento, setDepartamento] = useState(inicial?.departamento ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const guardar = async () => {
    const faltan = [
      !nombre.trim() && "el nombre",
      !telefono.trim() && "el teléfono",
      !direccion.trim() && "la dirección",
      !ciudad.trim() && "la ciudad",
      !departamento.trim() && "el departamento",
    ].filter(Boolean);
    if (faltan.length > 0) {
      setError(`Completa ${faltan.join(", ")}.`);
      return;
    }
    setGuardando(true);
    setError("");
    try {
      await onGuardar({
        nombre: nombre.trim(),
        negocio: negocio.trim(),
        telefono: telefono.trim(),
        direccion: direccion.trim(),
        ciudad: ciudad.trim(),
        departamento: departamento.trim(),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos guardar el cliente.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <label className={etiqueta} htmlFor="cli-nombre">
          Nombre del cliente
        </label>
        <input
          id="cli-nombre"
          className={campo}
          placeholder="Ej: Doña Luz"
          autoComplete="off"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
      </div>

      <div>
        <label className={etiqueta} htmlFor="cli-negocio">
          Nombre del local o negocio <span className="font-normal">(opcional)</span>
        </label>
        <input
          id="cli-negocio"
          className={campo}
          placeholder="Ej: Almacén La Esquina"
          autoComplete="off"
          value={negocio}
          onChange={(e) => setNegocio(e.target.value)}
        />
      </div>

      <div>
        <label className={etiqueta} htmlFor="cli-telefono">
          Número de teléfono
        </label>
        <input
          id="cli-telefono"
          type="tel"
          inputMode="tel"
          className={campo}
          placeholder="Ej: 300 123 4567"
          autoComplete="off"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
        />
      </div>

      <div>
        <label className={etiqueta} htmlFor="cli-direccion">
          Dirección
        </label>
        <input
          id="cli-direccion"
          className={campo}
          placeholder="Ej: Calle 10 # 5-20"
          autoComplete="off"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={etiqueta} htmlFor="cli-ciudad">
            Ciudad
          </label>
          <input
            id="cli-ciudad"
            className={campo}
            placeholder="Ej: Bogotá"
            autoComplete="off"
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
          />
        </div>
        <div>
          <label className={etiqueta} htmlFor="cli-departamento">
            Departamento
          </label>
          <input
            id="cli-departamento"
            className={campo}
            placeholder="Ej: Cundinamarca"
            autoComplete="off"
            value={departamento}
            onChange={(e) => setDepartamento(e.target.value)}
          />
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive"
        >
          {error}
        </p>
      ) : null}

      <div className={onCancelar ? "grid grid-cols-2 gap-3" : ""}>
        <button
          type="button"
          onClick={guardar}
          disabled={guardando}
          className="superficie-cuero h-16 w-full rounded-2xl text-xl font-bold shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
        >
          {guardando ? "Guardando…" : textoBoton}
        </button>
        {onCancelar ? (
          <button
            type="button"
            onClick={onCancelar}
            disabled={guardando}
            className="h-16 rounded-2xl border-2 border-primary bg-card text-lg font-bold text-primary disabled:opacity-60"
          >
            Cancelar
          </button>
        ) : null}
      </div>
    </div>
  );
}
