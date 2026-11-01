import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { formatoPesos, usePedidos, type FormaPago, type LineaForm } from "@/lib/pedidos";
import { SelectorCliente } from "@/components/SelectorCliente";
import { LineasPedido, lineasValidas, totalDe } from "@/components/LineasPedido";
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

function EditarPedido() {
  const { id } = Route.useParams();
  const { pedidos, productos, cargando, editarPedido } = usePedidos();
  const navigate = useNavigate();
  const pedido = pedidos.find((p) => p.id === id);

  const [clienteId, setClienteId] = useState("");
  const [lineas, setLineas] = useState<LineaForm[]>([]);
  const [formaPago, setFormaPago] = useState<FormaPago>("efectivo");
  const [cargado, setCargado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  // Precarga los datos ACTUALES del pedido (una sola vez, cuando ya cargó).
  useEffect(() => {
    if (pedido && !cargado) {
      setClienteId(pedido.clienteId);
      setFormaPago(pedido.formaPago);
      setLineas(
        pedido.lineas.map((l) => ({
          productoId: l.productoId,
          cantidad: l.cantidad,
          precioUnitario: l.precioUnitario,
        })),
      );
      setCargado(true);
    }
  }, [pedido, cargado]);

  // Las unidades que este pedido ya tiene apartadas no cuentan contra él mismo.
  const propias = useMemo(() => {
    const m: Record<string, number> = {};
    for (const l of pedido?.lineas ?? []) m[l.productoId] = l.cantidad;
    return m;
  }, [pedido]);

  const encabezado = (
    <header className="superficie-cuero relative rounded-b-4xl px-5 pb-7 pt-8">
      <MarcaTauro />
      <Link to="/comprobante/$id" params={{ id }} className="text-sm text-accent">
        ← Volver al comprobante
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Editar pedido</h1>
    </header>
  );

  if (cargando || (pedido && !cargado)) {
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

  const total = totalDe(lineas);
  const valido = !!clienteId && lineasValidas(lineas, productos, propias);

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    if (!valido) return;
    setGuardando(true);
    setError("");
    try {
      await editarPedido(pedido.id, { clienteId, formaPago, lineas });
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
        <SelectorCliente clienteId={clienteId} onChange={setClienteId} />

        <LineasPedido
          lineas={lineas}
          onChange={setLineas}
          productos={productos}
          propias={propias}
        />

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
          disabled={guardando || !valido}
          className="superficie-cuero h-16 w-full rounded-2xl text-xl font-bold shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
        >
          {guardando ? "Guardando…" : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}
