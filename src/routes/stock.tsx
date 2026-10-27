import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { usePedidos } from "@/lib/pedidos";
import { MarcaTauro } from "@/components/MarcaTauro";

export const Route = createFileRoute("/stock")({
  head: () => ({
    meta: [
      { title: "Inventario | Tauro Control" },
      {
        name: "description",
        content: "Registra entradas y salidas de producto y consulta el stock disponible.",
      },
    ],
  }),
  component: Inventario,
});

type Mensaje = { tipo: "ok" | "error"; texto: string } | null;

function Inventario() {
  const { productos, cargando, registrarMovimiento } = usePedidos();
  const [cantidades, setCantidades] = useState<Record<string, string>>({});
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<Mensaje>(null);

  const cambiarCantidad = (id: string, valor: string) =>
    setCantidades((prev) => ({ ...prev, [id]: valor.replace(/\D/g, "") }));

  const registrar = async (id: string, nombre: string, tipo: "entrada" | "salida") => {
    const cantidad = Number(cantidades[id] ?? "1");
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      setMensaje({ tipo: "error", texto: "Escribe una cantidad mayor que cero." });
      return;
    }
    setOcupado(id);
    setMensaje(null);
    try {
      const nuevoStock = await registrarMovimiento(id, tipo, cantidad);
      setCantidades((prev) => ({ ...prev, [id]: "1" }));
      setMensaje({
        tipo: "ok",
        texto: `${tipo === "entrada" ? "Entrada" : "Salida"} registrada: ${nombre} ahora tiene ${nuevoStock}.`,
      });
    } catch (e) {
      setMensaje({
        tipo: "error",
        texto: e instanceof Error ? e.message : "No se pudo registrar, intenta de nuevo.",
      });
    } finally {
      setOcupado(null);
    }
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-md pb-10">
      <header className="superficie-cuero relative rounded-b-4xl px-5 pb-8 pt-8">
        <MarcaTauro className="pointer-events-none absolute right-5 top-7 h-20 w-20 object-contain" />
        <Link to="/" className="text-sm text-accent">
          ← Volver a pedidos
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Inventario</h1>
        <p className="mt-1 text-sm text-accent">Registra entradas y salidas de producto</p>
      </header>

      <main className="space-y-4 px-5 py-6">
        {mensaje ? (
          <p
            role="status"
            className={`rounded-2xl px-4 py-3 text-sm font-bold ${
              mensaje.tipo === "ok"
                ? "bg-accent text-accent-foreground"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {mensaje.texto}
          </p>
        ) : null}

        {cargando ? (
          <p className="text-sm text-muted-foreground">Cargando productos…</p>
        ) : productos.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay productos registrados.</p>
        ) : null}

        {productos.map((p) => (
          <div key={p.id} className="tarjeta-cuero p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-lg font-semibold">{p.nombre}</p>
              <p className="shrink-0 text-3xl font-bold text-primary">{p.stock}</p>
            </div>
            <label
              className="mt-4 block text-sm font-bold text-muted-foreground"
              htmlFor={`cant-${p.id}`}
            >
              Cantidad
            </label>
            <input
              id={`cant-${p.id}`}
              inputMode="numeric"
              className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-4 text-lg outline-none focus:border-primary"
              value={cantidades[p.id] ?? "1"}
              onChange={(e) => cambiarCantidad(p.id, e.target.value)}
            />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={ocupado === p.id}
                onClick={() => registrar(p.id, p.nombre, "entrada")}
                className="superficie-cuero h-16 rounded-2xl text-lg font-bold shadow-lg disabled:opacity-60"
              >
                + Entrada
              </button>
              <button
                type="button"
                disabled={ocupado === p.id}
                onClick={() => registrar(p.id, p.nombre, "salida")}
                className="h-16 rounded-2xl border-2 border-primary bg-card text-lg font-bold text-primary disabled:opacity-60"
              >
                − Salida
              </button>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
