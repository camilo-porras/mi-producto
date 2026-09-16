import { createFileRoute, Link } from "@tanstack/react-router";
import { formatoPesos, usePedidos } from "@/lib/pedidos";

export const Route = createFileRoute("/cierre")({
  head: () => ({
    meta: [
      { title: "Cierre de caja | Tauro Control" },
      {
        name: "description",
        content:
          "Resumen del día: dinero recibido en efectivo y transferencia, con pedidos entregados y pendientes.",
      },
      { property: "og:title", content: "Cierre de caja | Tauro Control" },
      { property: "og:description", content: "Cuánto dinero entró hoy en el negocio." },
    ],
  }),
  component: Cierre,
});

function Cierre() {
  const { pedidos } = usePedidos();
  const total = (lista: typeof pedidos) =>
    lista.reduce((s, p) => s + p.cantidad * p.precioUnitario, 0);

  const entregados = pedidos.filter((p) => p.entregado);
  const pendientes = pedidos.filter((p) => !p.entregado);
  const efectivo = total(entregados.filter((p) => p.formaPago === "efectivo"));
  const transferencia = total(entregados.filter((p) => p.formaPago === "transferencia"));

  return (
    <div className="mx-auto min-h-screen w-full max-w-md pb-10">
      <header className="superficie-cuero rounded-b-4xl px-5 pb-8 pt-8">
        <Link to="/" className="text-sm text-accent">
          ← Volver a pedidos
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Cierre de caja</h1>
        <div className="mt-5 rounded-2xl bg-background/15 p-4 backdrop-blur">
          <p className="text-sm text-accent">Dinero recibido hoy</p>
          <p className="mt-1 text-4xl font-bold">{formatoPesos(efectivo + transferencia)}</p>
        </div>
      </header>

      <main className="space-y-4 px-5 py-6">
        <div className="tarjeta-cuero flex items-center justify-between p-5">
          <span className="text-lg font-semibold">Efectivo</span>
          <span className="text-2xl font-bold text-primary">{formatoPesos(efectivo)}</span>
        </div>
        <div className="tarjeta-cuero flex items-center justify-between p-5">
          <span className="text-lg font-semibold">Transferencia</span>
          <span className="text-2xl font-bold text-primary">{formatoPesos(transferencia)}</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="tarjeta-cuero p-5 text-center">
            <p className="text-4xl font-bold text-exito">{entregados.length}</p>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">Entregados</p>
          </div>
          <div className="tarjeta-cuero p-5 text-center">
            <p className="text-4xl font-bold text-primary">{pendientes.length}</p>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">Pendientes</p>
          </div>
        </div>

        <div className="tarjeta-cuero p-5">
          <h2 className="text-lg font-semibold">Por cobrar (pendientes)</h2>
          <p className="mt-2 text-2xl font-bold text-primary">{formatoPesos(total(pendientes))}</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {pendientes.length === 0 ? (
              <li>Todo entregado. ¡Buen día de trabajo!</li>
            ) : (
              pendientes.map((p) => (
                <li key={p.id} className="flex justify-between gap-3">
                  <span className="truncate">
                    {p.cliente} · {p.producto}
                  </span>
                  <span className="font-semibold">
                    {formatoPesos(p.cantidad * p.precioUnitario)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </main>
    </div>
  );
}
