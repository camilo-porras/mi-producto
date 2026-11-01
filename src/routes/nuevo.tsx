import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { formatoPesos, usePedidos, type FormaPago, type LineaForm } from "@/lib/pedidos";
import { SelectorCliente } from "@/components/SelectorCliente";
import { LineasPedido, lineaNueva, lineasValidas, totalDe } from "@/components/LineasPedido";
import { MarcaTauro } from "@/components/MarcaTauro";

export const Route = createFileRoute("/nuevo")({
  head: () => ({
    meta: [
      { title: "Nuevo pedido | Tauro Control" },
      {
        name: "description",
        content: "Registra un pedido nuevo con uno o varios productos y su forma de pago.",
      },
      { property: "og:title", content: "Nuevo pedido | Tauro Control" },
      { property: "og:description", content: "Registra un pedido nuevo en Tauro Control." },
    ],
  }),
  component: NuevoPedido,
});

const etiqueta = "block text-sm font-bold text-muted-foreground mb-2";

function NuevoPedido() {
  const { agregarPedido, productos } = usePedidos();
  const navigate = useNavigate();
  const [clienteId, setClienteId] = useState("");
  const [lineas, setLineas] = useState<LineaForm[]>([]);
  const [formaPago, setFormaPago] = useState<FormaPago>("efectivo");
  const [registradoPor, setRegistradoPor] = useState("Don Tauro");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  // Cuando cargan los productos, arranca con el primer renglón
  useEffect(() => {
    if (lineas.length === 0 && productos.length > 0) {
      const primera = lineaNueva(productos, []);
      if (primera) setLineas([primera]);
    }
  }, [productos, lineas.length]);

  const total = totalDe(lineas);
  const valido = !!clienteId && lineasValidas(lineas, productos);

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    if (!valido) return;
    setGuardando(true);
    setError("");
    try {
      const id = await agregarPedido({ clienteId, formaPago, registradoPor, lineas });
      navigate({ to: "/comprobante/$id", params: { id } });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No pudimos guardar el pedido. Intenta de nuevo.",
      );
      setGuardando(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-md pb-10">
      <header className="superficie-cuero relative rounded-b-4xl px-5 pb-7 pt-8">
        <MarcaTauro />
        <Link to="/" className="text-sm text-accent">
          ← Volver
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Nuevo pedido</h1>
      </header>

      <form onSubmit={guardar} className="space-y-5 px-5 py-6">
        <SelectorCliente clienteId={clienteId} onChange={setClienteId} />

        <LineasPedido lineas={lineas} onChange={setLineas} productos={productos} />

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

        <div>
          <span className={etiqueta}>¿Quién registra el pedido?</span>
          <div className="grid grid-cols-2 gap-3">
            {["Don Tauro", "Ayudante"].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setRegistradoPor(q)}
                className={`rounded-2xl border px-4 py-4 text-base font-bold ${
                  registradoPor === q
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="tarjeta-cuero flex items-center justify-between p-5">
          <span className="text-lg font-bold">Total</span>
          <span className="text-3xl font-bold text-primary">{formatoPesos(total)}</span>
        </div>

        {!clienteId ? (
          <p className="text-sm font-bold text-muted-foreground">
            Elige o crea un cliente para guardar el pedido.
          </p>
        ) : null}

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
          {guardando ? "Guardando…" : "Guardar pedido"}
        </button>
      </form>
    </div>
  );
}
