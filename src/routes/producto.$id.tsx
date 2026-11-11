import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { usePedidos } from "@/lib/pedidos";
import { MarcaTauro } from "@/components/MarcaTauro";

export const Route = createFileRoute("/producto/$id")({
  head: () => ({
    meta: [
      { title: "Editar producto | Tauro Control" },
      { name: "description", content: "Cambia el nombre o el precio de un producto." },
    ],
  }),
  component: EditarProducto,
});

const etiqueta = "block text-sm font-bold text-muted-foreground mb-2";
const campo =
  "w-full rounded-2xl border border-border bg-card px-4 py-4 text-lg outline-none focus:border-primary";

function EditarProducto() {
  const { id } = Route.useParams();
  const { productos, cargando, editarProducto } = usePedidos();
  const navigate = useNavigate();
  const producto = productos.find((p) => p.id === id);

  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState(0);
  const [cargado, setCargado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  // Precarga los datos actuales (una sola vez)
  useEffect(() => {
    if (producto && !cargado) {
      setNombre(producto.nombre);
      setPrecio(producto.precio);
      setCargado(true);
    }
  }, [producto, cargado]);

  const encabezado = (
    <header className="superficie-cuero relative rounded-b-4xl px-5 pb-7 pt-8">
      <MarcaTauro />
      <Link to="/inventario" className="text-sm text-accent">
        ← Volver al inventario
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Editar producto</h1>
    </header>
  );

  if (cargando || (producto && !cargado)) {
    return (
      <div className="mx-auto min-h-screen w-full max-w-md pb-10">
        {encabezado}
        <p className="px-5 py-6 text-sm text-muted-foreground">Cargando producto…</p>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="mx-auto min-h-screen w-full max-w-md pb-10">
        {encabezado}
        <p className="px-5 py-6 text-sm text-muted-foreground">No encontramos ese producto.</p>
      </div>
    );
  }

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setGuardando(true);
    setError("");
    try {
      await editarProducto(producto.id, nombre, precio);
      navigate({ to: "/inventario" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos guardar los cambios.");
      setGuardando(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-md pb-10">
      {encabezado}

      <form onSubmit={guardar} className="space-y-5 px-5 py-6">
        <div className="rounded-2xl bg-muted px-4 py-3 text-sm">
          <span className="font-bold">En bodega: </span>
          {producto.stock} unidades
          <p className="mt-1 text-xs text-muted-foreground">
            Las unidades no se editan aquí: usa «Registrar entrada o salida» para que quede en el
            historial.
          </p>
        </div>

        <div>
          <label className={etiqueta} htmlFor="nombre">
            Nombre del producto
          </label>
          <input
            id="nombre"
            className={campo}
            maxLength={80}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>

        <div>
          <label className={etiqueta} htmlFor="precio">
            Precio de venta
          </label>
          <input
            id="precio"
            type="number"
            min={0}
            step={1000}
            inputMode="numeric"
            className={campo}
            value={precio}
            onChange={(e) => setPrecio(Math.max(0, Number(e.target.value)))}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Es el precio que ven los clientes. Los pedidos que ya existen conservan el precio con el
            que se hicieron.
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
          {guardando ? "Guardando…" : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}
