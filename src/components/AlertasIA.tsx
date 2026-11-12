import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { usePedidos } from "@/lib/pedidos";
import { detectarAlertas } from "@/lib/analisis-inventario";

// Aviso para Don Tauro y el Ayudante (esta parte de la app solo la ve el personal).
// La detección es lógica en código: instantánea y sin costo de API.
export function AlertasIA() {
  const { productos, pedidos, cargando } = usePedidos();
  const alertas = useMemo(() => detectarAlertas(productos, pedidos), [productos, pedidos]);

  if (cargando) return null;

  return (
    <div className="mt-6 space-y-3">
      {alertas.map((a) => (
        <Link
          key={`${a.pedidoId}-${a.productoId}`}
          to="/comprobante/$id"
          params={{ id: a.pedidoId }}
          role="alert"
          className="block rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive"
        >
          ⚠️ Pedido grande: {a.cliente} pidió {a.cantidad} × {a.producto} y ya no queda disponible.
          Toca para ver el pedido.
        </Link>
      ))}
      <Link
        to="/asistente"
        className="block rounded-2xl border-2 border-primary bg-card px-4 py-3 text-sm font-bold text-primary"
      >
        ✨ Asistente de producción · ¿Qué fabricar el próximo mes?
      </Link>
    </div>
  );
}
