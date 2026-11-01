import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { usePedidos } from "@/lib/pedidos";
import { FormularioCliente } from "@/components/FormularioCliente";
import { MarcaTauro } from "@/components/MarcaTauro";

export const Route = createFileRoute("/clientes/$id")({
  head: () => ({
    meta: [
      { title: "Editar cliente | Tauro Control" },
      { name: "description", content: "Actualiza los datos de un cliente." },
    ],
  }),
  component: EditarCliente,
});

function EditarCliente() {
  const { id } = Route.useParams();
  const { clientes, cargando, editarCliente, pedidos } = usePedidos();
  const [guardado, setGuardado] = useState(false);
  const cliente = clientes.find((c) => c.id === id);
  const cantidadPedidos = pedidos.filter((p) => p.clienteId === id).length;

  const encabezado = (
    <header className="superficie-cuero relative rounded-b-4xl px-5 pb-7 pt-8">
      <MarcaTauro />
      <Link to="/clientes" className="text-sm text-accent">
        ← Volver a clientes
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Editar cliente</h1>
    </header>
  );

  if (cargando) {
    return (
      <div className="mx-auto min-h-screen w-full max-w-md pb-10">
        {encabezado}
        <p className="px-5 py-6 text-sm text-muted-foreground">Cargando cliente…</p>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="mx-auto min-h-screen w-full max-w-md pb-10">
        {encabezado}
        <p className="px-5 py-6 text-sm text-muted-foreground">No encontramos ese cliente.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-md pb-10">
      {encabezado}

      <div className="space-y-5 px-5 py-6">
        <p className="rounded-2xl bg-muted px-4 py-3 text-xs text-muted-foreground">
          Puedes cambiar el nombre, el negocio, el teléfono o la dirección. Los pedidos de este
          cliente siguen ligados a él{cantidadPedidos > 0 ? ` (${cantidadPedidos} activos)` : ""} y
          muestran los datos nuevos.
        </p>

        {guardado ? (
          <p
            role="status"
            className="rounded-2xl bg-accent px-4 py-3 text-sm font-bold text-accent-foreground"
          >
            Datos actualizados.
          </p>
        ) : null}

        <FormularioCliente
          key={cliente.id}
          inicial={cliente}
          textoBoton="Guardar cambios"
          onGuardar={async (datos) => {
            setGuardado(false);
            await editarCliente(cliente.id, datos);
            setGuardado(true);
          }}
        />
      </div>
    </div>
  );
}
