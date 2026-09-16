import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { formatoPesos, usePedidos, type FormaPago } from "@/lib/pedidos";

export const Route = createFileRoute("/nuevo")({
  head: () => ({
    meta: [
      { title: "Nuevo pedido | Tauro Control" },
      {
        name: "description",
        content: "Registra un pedido nuevo de billeteras o cinturones con su forma de pago.",
      },
      { property: "og:title", content: "Nuevo pedido | Tauro Control" },
      { property: "og:description", content: "Registra un pedido nuevo en Tauro Control." },
    ],
  }),
  component: NuevoPedido,
});

const PRODUCTOS = ["Billetera clásica café", "Cinturón camel", "Cinturón trenzado negro"];

const etiqueta = "block text-sm font-bold text-muted-foreground mb-2";
const campo =
  "w-full rounded-2xl border border-border bg-card px-4 py-4 text-lg outline-none focus:border-primary";

function NuevoPedido() {
  const { agregarPedido } = usePedidos();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState("");
  const [producto, setProducto] = useState(PRODUCTOS[0]);
  const [cantidad, setCantidad] = useState(1);
  const [precio, setPrecio] = useState(45000);
  const [formaPago, setFormaPago] = useState<FormaPago>("efectivo");
  const [registradoPor, setRegistradoPor] = useState("Don Tauro");

  const total = cantidad * precio;

  const guardar = (e: React.FormEvent) => {
    e.preventDefault();
    const nuevo = agregarPedido({
      cliente: cliente.trim() || "Cliente sin nombre",
      producto,
      cantidad,
      precioUnitario: precio,
      formaPago,
      registradoPor,
    });
    navigate({ to: "/comprobante/$id", params: { id: nuevo.id } });
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-md pb-10">
      <header className="superficie-cuero rounded-b-4xl px-5 pb-7 pt-8">
        <Link to="/" className="text-sm text-accent">
          ← Volver
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Nuevo pedido</h1>
      </header>

      <form onSubmit={guardar} className="space-y-5 px-5 py-6">
        <div>
          <label className={etiqueta} htmlFor="cliente">
            Nombre del cliente
          </label>
          <input
            id="cliente"
            className={campo}
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            placeholder="Ej: Doña Luz"
          />
        </div>

        <div>
          <label className={etiqueta} htmlFor="producto">
            Producto
          </label>
          <select
            id="producto"
            className={campo}
            value={producto}
            onChange={(e) => setProducto(e.target.value)}
          >
            {PRODUCTOS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
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

        <button
          type="submit"
          className="superficie-cuero h-16 w-full rounded-2xl text-xl font-bold shadow-lg"
        >
          Guardar pedido
        </button>
      </form>
    </div>
  );
}
