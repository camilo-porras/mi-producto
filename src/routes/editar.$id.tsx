import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { formatoPesos, STOCK_BAJO, usePedidos, type FormaPago } from "@/lib/pedidos";
import { MarcaTauro } from "@/components/MarcaTauro";

export const Route = createFileRoute("/editar/$id")({
  head: () => ({
    meta: [
      { title: "Editar pedido | Tauro Control" },
      { name: "description", content: "Corrige los datos de un pedido pendiente." },
    ],
  }),
  component: EditarPedido,
});

const etiqueta = "block text-sm font-bold text-muted-foreground mb-2";
const campo =
  "w-full rounded-2xl border border-border bg-card px-4 py-4 text-lg outline-none focus:border-primary";

function EditarPedido() {
  const { id } = Route.useParams();
  const { pedidos, productos, cargando, editarPedido } = usePedidos();
  const navigate = useNavigate();
  const pedido = pedidos.find((p) => p.id === id);

  const [cliente, setCliente] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [precio, setPrecio] = useState(0);
  const [formaPago, setFormaPago] = useState<FormaPago>("efectivo");
  const [cargado, setCargado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  // Precarga los datos ACTUALES del pedido (una sola vez, cuando ya cargó).
  useEffect(() => {
    if (pedido && !cargado) {
      setCliente(pedido.cliente);
      setCantidad(pedido.cantidad);
      setPrecio(pedido.precioUnitario);
      setFormaPago(pedido.formaPago);
      setCargado(true);
    }
  }, [pedido, cargado]);

  const encabezado = (
    <header className="superficie-cuero relative rounded-b-4xl px-5 pb-7 pt-8">
      <MarcaTauro />
      <Link to="/comprobante/$id" params={{ id }} className="text-sm text-accent">
        ← Volver al comprobante
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Editar pedido</h1>
    </header>
  );

  if (cargando) {
    return (
      <div className="mx-auto min-h-screen w-full max-w-md pb-10">
        {encabezado}
        <p className="px-5 py-6 text-sm text-muted-foreground">Cargando pedido…</p>
      </div>
    );
  }

  if (!pedido || pedido.entregado) {
    return (
      <div className="mx-auto min-h-screen w-full max-w-md pb-10">
        {encabezado}
        <p className="px-5 py-6 text-sm text-muted-foreground">
          Solo se puede editar un pedido pendiente.
        </p>
      </div>
    );
  }

  // Lo máximo que se puede pedir: lo disponible + las unidades de ESTE pedido.
  const prod = productos.find((p) => p.nombre === pedido.producto);
  const maximo = prod ? prod.disponible + pedido.cantidad : 0;
  const sinStock = cantidad > maximo;
  const total = cantidad * precio;

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    if (!cliente.trim() || sinStock) return;
    setGuardando(true);
    setError("");
    try {
      await editarPedido(pedido.id, { cliente, cantidad, precioUnitario: precio, formaPago });
      navigate({ to: "/comprobante/$id", params: { id: pedido.id } });
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
          <span className="font-bold">Producto: </span>
          {pedido.producto}
          <p className="mt-1 text-xs text-muted-foreground">
            Para cambiar el producto, anula el pedido y crea uno nuevo.
          </p>
        </div>

        <div>
          <label className={etiqueta} htmlFor="cliente">
            Nombre del cliente
          </label>
          <input
            id="cliente"
            className={campo}
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
          />
        </div>

        <div>
          <label className={etiqueta} htmlFor="cantidad">
            Cantidad
          </label>
          <input
            id="cantidad"
            type="number"
            min={1}
            className={campo}
            value={cantidad}
            onChange={(e) => setCantidad(Math.max(1, Number(e.target.value)))}
          />
          <p
            className={`mt-2 text-sm font-bold ${
              sinStock ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            Puedes pedir hasta: {maximo}
            {sinStock
              ? ` · pides ${cantidad}: no puedes guardar este cambio`
              : maximo <= STOCK_BAJO
                ? " · stock bajo"
                : ""}
          </p>
        </div>

        <div>
          <label className={etiqueta} htmlFor="precio">
            Precio unitario
          </label>
          <input
            id="precio"
            type="number"
            min={0}
            step={1000}
            className={campo}
            value={precio}
            onChange={(e) => setPrecio(Math.max(0, Number(e.target.value)))}
          />
        </div>

        <div>
          <span className={etiqueta}>Forma de pago</span>
          <div className="grid grid-cols-2 gap-3">
            {(["efectivo", "transferencia"] as FormaPago[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormaPago(f)}
                className={`rounded-2xl border px-4 py-4 text-base font-bold capitalize ${
                  formaPago === f
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="tarjeta-cuero flex items-center justify-between px-5 py-4">
          <span className="font-bold text-muted-foreground">Total</span>
          <span className="text-2xl font-bold text-primary">{formatoPesos(total)}</span>
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
          disabled={guardando || sinStock || !cliente.trim()}
          className="superficie-cuero h-16 w-full rounded-2xl text-xl font-bold shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
        >
          {guardando ? "Guardando…" : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}
