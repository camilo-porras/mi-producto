import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { formatoPesos, usePedidos } from "@/lib/pedidos";
import { MarcaTauro } from "@/components/MarcaTauro";

export const Route = createFileRoute("/comprobante/$id")({
  head: () => ({
    meta: [
      { title: "Comprobante del pedido | Tauro Control" },
      {
        name: "description",
        content: "Tirilla de respaldo del pedido, lista para mostrar o compartir por WhatsApp.",
      },
      { property: "og:title", content: "Comprobante del pedido | Tauro Control" },
      { property: "og:description", content: "Tirilla de respaldo de tu pedido de cuero." },
    ],
  }),
  component: Comprobante,
});

function Comprobante() {
  const { id } = Route.useParams();
  const { pedidos, marcarEntregado, anularPedido } = usePedidos();
  const navigate = useNavigate();
  const pedido = pedidos.find((p) => p.id === id);
  const [entregando, setEntregando] = useState(false);
  const [errorEntrega, setErrorEntrega] = useState("");
  const [confirmandoAnular, setConfirmandoAnular] = useState(false);
  const [anuladoPor, setAnuladoPor] = useState("");
  const [motivo, setMotivo] = useState("");

  const entregar = async (pedidoId: string) => {
    setEntregando(true);
    setErrorEntrega("");
    try {
      await marcarEntregado(pedidoId);
    } catch (e) {
      setErrorEntrega(e instanceof Error ? e.message : "No se pudo entregar, intenta de nuevo.");
    } finally {
      setEntregando(false);
    }
  };

  const anular = async (pedidoId: string) => {
    setEntregando(true);
    setErrorEntrega("");
    try {
      await anularPedido(pedidoId, anuladoPor, motivo);
      navigate({ to: "/" });
    } catch (e) {
      setErrorEntrega(e instanceof Error ? e.message : "No se pudo anular, intenta de nuevo.");
      setConfirmandoAnular(false);
      setEntregando(false);
    }
  };

  if (!pedido) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-semibold">No encontramos ese pedido</h1>
        <Link to="/" className="superficie-cuero rounded-2xl px-6 py-4 font-bold">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const total = pedido.cantidad * pedido.precioUnitario;
  const fecha = new Date(pedido.fecha).toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const texto = `*Mano Facturas Tauro*%0AComprobante #${pedido.id.slice(-4)}%0ACliente: ${pedido.cliente}%0A${pedido.cantidad} x ${pedido.producto}%0ATotal: ${formatoPesos(total)}%0APago: ${pedido.formaPago}%0A¡Gracias por su compra!`;

  return (
    <div className="mx-auto min-h-screen w-full max-w-md pb-10">
      <header className="superficie-cuero relative rounded-b-4xl px-5 pb-7 pt-8">
        <MarcaTauro />
        <Link to="/" className="text-sm text-accent">
          ← Volver a pedidos
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Comprobante</h1>
      </header>

      <main className="px-5 py-6">
        <article className="tarjeta-cuero px-6 py-7 text-center">
          <h2 className="text-xl font-bold">Mano Facturas Tauro</h2>
          <p className="text-sm text-muted-foreground">Artículos de cuero · Colombia</p>
          <p className="mt-1 text-sm text-muted-foreground">{fecha}</p>

          <div className="my-5 border-t border-dashed border-border" />

          <dl className="space-y-3 text-left text-base">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Comprobante</dt>
              <dd className="font-semibold">#{pedido.id.slice(-4)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Cliente</dt>
              <dd className="font-semibold">{pedido.cliente}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Producto</dt>
              <dd className="text-right font-semibold">{pedido.producto}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Cantidad</dt>
              <dd className="font-semibold">{pedido.cantidad}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Precio unitario</dt>
              <dd className="font-semibold">{formatoPesos(pedido.precioUnitario)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Forma de pago</dt>
              <dd className="font-semibold capitalize">{pedido.formaPago}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Registró</dt>
              <dd className="font-semibold">{pedido.registradoPor}</dd>
            </div>
          </dl>

          <div className="my-5 border-t border-dashed border-border" />

          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">Total</span>
            <span className="text-3xl font-bold text-primary">{formatoPesos(total)}</span>
          </div>

          <p className="mt-5 text-sm text-muted-foreground">¡Gracias por su compra!</p>
        </article>

        <div className="mt-6 space-y-3">
          <a
            href={`https://wa.me/?text=${texto}`}
            target="_blank"
            rel="noreferrer"
            className="flex h-16 w-full items-center justify-center rounded-2xl bg-verde-wa text-lg font-bold text-verde-wa-foreground shadow-lg"
          >
            Compartir por WhatsApp
          </a>

          {pedido.entregado ? (
            <p className="rounded-2xl bg-muted py-5 text-center text-lg font-bold text-muted-foreground">
              Pedido entregado ✓
            </p>
          ) : (
            <>
              {errorEntrega ? (
                <p
                  role="alert"
                  className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive"
                >
                  {errorEntrega}
                </p>
              ) : null}
              <button
                onClick={() => entregar(pedido.id)}
                disabled={entregando}
                className="superficie-cuero h-16 w-full rounded-2xl text-xl font-bold shadow-lg disabled:opacity-60"
              >
                {entregando && !confirmandoAnular ? "Entregando…" : "Marcar como entregado"}
              </button>

              {confirmandoAnular ? (
                <div className="rounded-2xl border-2 border-destructive p-4">
                  <p className="text-center text-base font-bold">
                    ¿Seguro que quieres anular este pedido?
                  </p>
                  <p className="mt-3 text-sm font-bold text-muted-foreground">¿Quién anula?</p>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    {["Don Tauro", "Ayudante"].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setAnuladoPor(q)}
                        className={`rounded-2xl border px-4 py-3 text-base font-bold ${
                          anuladoPor === q
                            ? "border-primary bg-accent text-accent-foreground"
                            : "border-border bg-card text-muted-foreground"
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                  <label
                    className="mt-3 block text-sm font-bold text-muted-foreground"
                    htmlFor="motivo"
                  >
                    Motivo
                  </label>
                  <input
                    id="motivo"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    maxLength={120}
                    placeholder="Ej: el cliente canceló"
                    className="mt-2 w-full rounded-2xl border border-border bg-card px-4 py-3 text-base outline-none focus:border-primary"
                  />
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => anular(pedido.id)}
                      disabled={entregando || !anuladoPor || !motivo.trim()}
                      className="h-14 rounded-2xl bg-destructive text-base font-bold text-destructive-foreground disabled:opacity-60"
                    >
                      Sí, anular
                    </button>
                    <button
                      onClick={() => setConfirmandoAnular(false)}
                      disabled={entregando}
                      className="h-14 rounded-2xl border-2 border-primary bg-card text-base font-bold text-primary disabled:opacity-60"
                    >
                      No, volver
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmandoAnular(true)}
                  disabled={entregando}
                  className="h-14 w-full rounded-2xl border-2 border-destructive bg-card text-base font-bold text-destructive disabled:opacity-60"
                >
                  Anular pedido
                </button>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
