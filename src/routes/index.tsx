import { createFileRoute, Link } from "@tanstack/react-router";
import { formatoPesos, usePedidos } from "@/lib/pedidos";
import { MarcaTauro } from "@/components/MarcaTauro";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tauro Control | Pedidos de Mano Facturas Tauro" },
      {
        name: "description",
        content:
          "Registra pedidos de marroquinería, genera tirillas y controla entregas de Mano Facturas Tauro desde el celular.",
      },
      { property: "og:title", content: "Tauro Control | Pedidos de Mano Facturas Tauro" },
      {
        property: "og:description",
        content: "Pedidos, tirillas y cierre de caja para tu negocio de artículos de cuero.",
      },
    ],
  }),
  component: Inicio,
});

function Inicio() {
  const { pedidos } = usePedidos();
  const ordenados = [...pedidos].sort((a, b) => Number(a.entregado) - Number(b.entregado));
  const pendientes = pedidos.filter((p) => !p.entregado);
  const totalPendiente = pendientes.reduce((s, p) => s + p.cantidad * p.precioUnitario, 0);

  return (
    <div className="mx-auto min-h-screen w-full max-w-md pb-32">
      <header className="superficie-cuero relative rounded-b-4xl px-5 pb-8 pt-8">
        <MarcaTauro />
        <p className="text-sm uppercase tracking-widest text-accent">Mano Facturas Tauro</p>
        <h1 className="mt-1 text-3xl font-semibold">Tauro Control</h1>
        <div className="mt-6 rounded-2xl bg-background/15 p-4 backdrop-blur">
          <p className="text-sm text-accent">Pedidos pendientes hoy</p>
          <div className="mt-1 flex items-end justify-between">
            <span className="text-4xl font-bold">{pendientes.length}</span>
            <span className="text-lg font-semibold">{formatoPesos(totalPendiente)}</span>
          </div>
        </div>
      </header>

      <main className="px-5">
        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Pedidos del día</h2>
          <Link to="/cierre" className="text-sm font-semibold text-primary underline">
            Cierre de caja
          </Link>
        </div>

        <ul className="mt-4 space-y-3">
          {ordenados.map((p) => (
            <li key={p.id}>
              <Link
                to="/comprobante/$id"
                params={{ id: p.id }}
                className="tarjeta-cuero flex items-center justify-between gap-3 p-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold">{p.cliente}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {p.cantidad} × {p.producto}
                  </p>
                  <span
                    className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${
                      p.entregado
                        ? "bg-muted text-muted-foreground"
                        : "bg-accent text-accent-foreground"
                    }`}
                  >
                    {p.entregado ? "Entregado" : "Pendiente"}
                  </span>
                </div>
                <span className="shrink-0 text-lg font-bold text-primary">
                  {formatoPesos(p.cantidad * p.precioUnitario)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>

      <div className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 bg-gradient-to-t from-background via-background to-transparent p-5">
        <Link
          to="/nuevo"
          className="superficie-cuero flex h-16 items-center justify-center rounded-2xl text-xl font-bold shadow-lg"
        >
          + Nuevo pedido
        </Link>
      </div>
    </div>
  );
}
