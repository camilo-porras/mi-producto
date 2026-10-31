import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { usePedidos } from "@/lib/pedidos";
import { MarcaTauro } from "@/components/MarcaTauro";

export const Route = createFileRoute("/nuevo-producto")({
  head: () => ({
    meta: [
      { title: "Agregar producto | Tauro Control" },
      { name: "description", content: "Agrega un producto nuevo al inventario." },
    ],
  }),
  component: NuevoProducto,
});

const etiqueta = "block text-sm font-bold text-muted-foreground mb-2";
const campo =
  "w-full rounded-2xl border border-border bg-card px-4 py-4 text-lg outline-none focus:border-primary";

function NuevoProducto() {
  const { crearProducto } = usePedidos();
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [stock, setStock] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setGuardando(true);
    setError("");
    try {
      await crearProducto(nombre, stock);
      navigate({ to: "/inventario" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos guardar el producto.");
      setGuardando(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-md pb-10">
      <header className="superficie-cuero relative rounded-b-4xl px-5 pb-7 pt-8">
        <MarcaTauro />
        <Link to="/inventario" className="text-sm text-accent">
          ← Volver al inventario
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Agregar producto</h1>
      </header>

      <form onSubmit={guardar} className="space-y-5 px-5 py-6">
        <div>
          <label className={etiqueta} htmlFor="nombre">
            Nombre del producto
          </label>
          <input
            id="nombre"
            className={campo}
            placeholder="Ej: Correa de reloj de cuero"
            maxLength={80}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>

        <div>
          <label className={etiqueta} htmlFor="stock">
            Unidades que tienes ahora
          </label>
          <input
            id="stock"
            type="number"
            min={0}
            inputMode="numeric"
            className={campo}
            value={stock}
            onChange={(e) => setStock(Math.max(0, Math.floor(Number(e.target.value))))}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Si todavía no tienes unidades, déjalo en 0 y regístralas después como una entrada.
          </p>
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={guardando || !nombre.trim()}
          className="superficie-cuero h-16 w-full rounded-2xl text-xl font-bold shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
        >
          {guardando ? "Guardando…" : "Guardar producto"}
        </button>
      </form>
    </div>
  );
}
