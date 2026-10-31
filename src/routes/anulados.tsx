import { createFileRoute, Link } from "@tanstack/react-router";
import { formatoPesos, usePedidos } from "@/lib/pedidos";
import { MarcaTauro } from "@/components/MarcaTauro";

export const Route = createFileRoute("/anulados")({
  head: () => ({
    meta: [
      { title: "Pedidos anulados | Tauro Control" },
      {
        name: "description",
        content: "Consulta los pedidos anulados, quién los anuló y el motivo.",
      },
    ],
  }),
  component: Anulados,
});

const fechaCorta = (iso: string) =>
  new Date(iso).toLocaleString("es-CO", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

function Anulados() {
  const { anulados, cargando } = usePedidos();

  return (
    <div className="mx-auto min-h-screen w-full max-w-md pb-10">
      <header className="superficie-cuero relative rounded-b-4xl px-5 pb-8 pt-8">
        <MarcaTauro className="pointer-events-none absolute right-5 top-7 h-20 w-20 object-contain" />
        <Link to="/" className="text-sm text-accent">
          ← Volver a pedidos
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Pedidos anulados</h1>
        <p className="mt-1 text-sm text-accent">
          {anulados.length === 1 ? "1 pedido anulado" : `${anulados.length} pedidos anulados`}
        </p>
      </header>

      <main className="px-5 py-6">
        {cargando ? (
          <p className="text-sm text-muted-foreground">Cargando pedidos anulados…</p>
        ) : anulados.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay pedidos anulados.</p>
        ) : (
          <ul className="space-y-3">
            {anulados.map((a) => (
              <li key={a.id} className="tarjeta-cuero p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-lg font-semibold">{a.cliente}</p>
                    <p className="text-sm text-muted-foreground">
                      {a.cantidad} × {a.producto}
                    </p>
                  </div>
                  <p className="shrink-0 text-lg font-bold text-muted-foreground line-through">
                    {formatoPesos(a.cantidad * a.precioUnitario)}
                  </p>
                </div>
                <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
                  <p>
                    <span className="font-bold">Anulado por: </span>
                    {a.anuladoPor}
                  </p>
                  <p>
                    <span className="font-bold">Motivo: </span>
                    {a.motivo}
                  </p>
                  <p className="text-xs text-muted-foreground">{fechaCorta(a.anuladoEn)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
