import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { usePedidos } from "@/lib/pedidos";
import { FormularioCliente } from "@/components/FormularioCliente";
import { MarcaTauro } from "@/components/MarcaTauro";

export const Route = createFileRoute("/clientes/nuevo")({
  head: () => ({
    meta: [
      { title: "Nuevo cliente | Tauro Control" },
      { name: "description", content: "Registra un cliente nuevo." },
    ],
  }),
  component: NuevoCliente,
});

function NuevoCliente() {
  const { crearCliente } = usePedidos();
  const navigate = useNavigate();

  return (
    <div className="mx-auto min-h-screen w-full max-w-md pb-10">
      <header className="superficie-cuero relative rounded-b-4xl px-5 pb-7 pt-8">
        <MarcaTauro />
        <Link to="/clientes" className="text-sm text-accent">
          ← Volver a clientes
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Nuevo cliente</h1>
      </header>

      <div className="px-5 py-6">
        <FormularioCliente
          textoBoton="Guardar cliente"
          onGuardar={async (datos) => {
            await crearCliente(datos);
            navigate({ to: "/clientes" });
          }}
        />
      </div>
    </div>
  );
}
