// Lógica de negocio de la función IA: se calcula en CÓDIGO (exacto, gratis y al instante).
// Gemini no calcula nada: solo redacta y prioriza a partir de estos números.
import { STOCK_BAJO, type Pedido, type ProductoVista } from "@/lib/pedidos";

// ---- Ajusta estas reglas a tu negocio -------------------------------------------
// Un pedido cuenta como "muy grande" si una de sus líneas pide al menos esta cantidad...
export const PEDIDO_GRANDE_MIN = 5;
// ...Y se lleva al menos esta fracción del stock físico de ese producto.
export const PEDIDO_GRANDE_FRACCION = 0.5;
// Ventana de ventas que se mira para recomendar fabricación.
export const DIAS_ANALISIS = 30;
// Se recomienda fabricar un 20 % por encima de lo vendido el último mes.
export const MARGEN_PRODUCCION = 1.2;
// Se muestran como máximo estos productos (solo los relevantes viajan a Gemini).
export const MAX_PRODUCTOS_IA = 10;
// ---------------------------------------------------------------------------------

export type AlertaPedidoGrande = {
  pedidoId: string;
  cliente: string;
  productoId: string;
  producto: string;
  cantidad: number;
  stock: number;
};

export type SugerenciaProduccion = {
  productoId: string;
  producto: string;
  stock: number;
  disponible: number;
  comprometido: number;
  vendido30d: number;
  producir: number;
};

const esPendiente = (p: Pedido) => !p.entregado && !p.solicitado;

// Pedido pendiente grande que dejó un producto sin unidades disponibles.
export function detectarAlertas(productos: ProductoVista[], pedidos: Pedido[]): AlertaPedidoGrande[] {
  const pendientes = pedidos.filter(esPendiente);
  const alertas: AlertaPedidoGrande[] = [];

  for (const prod of productos) {
    if (prod.disponible !== 0 || prod.comprometido <= 0) continue;

    // La línea más grande de este producto entre los pedidos pendientes.
    let mayor: { pedido: Pedido; cantidad: number } | null = null;
    for (const ped of pendientes) {
      for (const l of ped.lineas) {
        if (l.productoId === prod.id && (!mayor || l.cantidad > mayor.cantidad)) {
          mayor = { pedido: ped, cantidad: l.cantidad };
        }
      }
    }
    if (!mayor) continue;

    const esGrande =
      mayor.cantidad >= PEDIDO_GRANDE_MIN && mayor.cantidad >= prod.stock * PEDIDO_GRANDE_FRACCION;
    if (!esGrande) continue;

    alertas.push({
      pedidoId: mayor.pedido.id,
      cliente: mayor.pedido.cliente,
      productoId: prod.id,
      producto: prod.nombre,
      cantidad: mayor.cantidad,
      stock: prod.stock,
    });
  }
  return alertas;
}

// Productos con stock bajo/agotado + cuánto fabricar el próximo mes.
export function calcularSugerencias(
  productos: ProductoVista[],
  pedidos: Pedido[],
): SugerenciaProduccion[] {
  const desde = Date.now() - DIAS_ANALISIS * 24 * 60 * 60 * 1000;
  const vendido = new Map<string, number>();
  for (const ped of pedidos) {
    if (!ped.entregado) continue;
    // La base guarda la fecha de creación del pedido; se usa como aproximación de la venta.
    if (new Date(ped.fecha).getTime() < desde) continue;
    for (const l of ped.lineas) vendido.set(l.productoId, (vendido.get(l.productoId) ?? 0) + l.cantidad);
  }

  return productos
    .filter((p) => p.disponible <= STOCK_BAJO)
    .map((p) => {
      const vendido30d = vendido.get(p.id) ?? 0;
      // Meta del próximo mes: lo vendido + margen, y nunca menos que "stock bajo + 1"
      // para que el producto no vuelva a quedar en cero.
      const meta = Math.max(Math.ceil(vendido30d * MARGEN_PRODUCCION), STOCK_BAJO + 1);
      return {
        productoId: p.id,
        producto: p.nombre,
        stock: p.stock,
        disponible: p.disponible,
        comprometido: p.comprometido,
        vendido30d,
        producir: Math.max(meta - p.disponible, 0),
      };
    })
    .sort((a, b) => a.disponible - b.disponible || b.vendido30d - a.vendido30d)
    .slice(0, MAX_PRODUCTOS_IA);
}
