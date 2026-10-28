import { createFileRoute, Link } from "@tanstack/react-router";
import { STOCK_BAJO, usePedidos } from "@/lib/pedidos";
import { MarcaTauro } from "@/components/MarcaTauro";

export const Route = createFileRoute("/inventario")({
  head: () => ({
    meta: [
      { title: "Inventario | Tauro Control" },
      {
        name: "description",
        content: "Consulta el stock disponible de cada producto y las alertas de stock bajo.",
      },
    ],
  }),
  component: Inventario,
});

function Inventario() {
  const { productos, cargando } = usePedidos();
  const ordenados = [...productos].sort((a, b) => a.stock - b.stock);
  const porAgotarse = productos.filter((p) => p.stock <= STOCK_BAJO).length;

  return (
    <div className="mx-auto min-h-screen w-full max-w-md pb-32">
      <header className="superficie-cuero relative rounded-b-4xl px-5 pb-8 pt-8">
        <MarcaTauro className="pointer-events-none absolute right-5 top-7 h-20 w-20 object-contain" />
        <Link to="/" className="text-sm text-accent">
          ← Volver a pedidos
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Inventario</h1>
        <p className="mt-1 text-sm text-accent">Stock disponible de cada producto</p>
      </header>

      <main className="px-5 py-6">
        {porAgotarse > 0 ? (
          <p
            role="alert"
            className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive"
          >
            {porAgotarse === 1
              ? "1 producto con stock bajo"
              : `${porAgotarse} productos con stock bajo`}
          </p>
        ) : null}

        {cargando ? (
          <p className="mt-4 text-sm text-muted-foreground">Cargando inventario…</p>
        ) : productos.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No hay productos registrados.</p>
        ) : (
          <ul className="tarjeta-cuero mt-4 divide-y divide-border">
            {ordenados.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="truncate">{p.nombre}</span>
                <span className="flex shrink-0 items-center gap-2">
                  {p.stock <= STOCK_BAJO ? (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        p.stock === 0
                          ? "bg-destructive text-destructive-foreground"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {p.stock === 0 ? "Agotado" : "Stock bajo"}
                    </span>
                  ) : null}
                  <span className="text-lg font-bold text-primary">{p.stock}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </main>

      <div className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 bg-gradient-to-t from-background via-background to-transparent p-5">
        <Link
          to="/stock"
          className="superficie-cuero flex h-16 items-center justify-center rounded-2xl text-xl font-bold shadow-lg"
        >
          Registrar entrada o salida
        </Link>
      </div>
    </div>
  );
}
