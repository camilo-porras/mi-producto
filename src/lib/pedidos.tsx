import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

export type FormaPago = "efectivo" | "transferencia";

export type Pedido = {
  id: string;
  cliente: string;
  negocio?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  departamento?: string;
  producto: string;
  cantidad: number;
  precioUnitario: number;
  formaPago: FormaPago;
  registradoPor: string;
  entregado: boolean;
  fecha: string;
};

export type Producto = { id: string; nombre: string; stock: number };

// A partir de esta cantidad (o menos) un producto se marca como "stock bajo".
export const STOCK_BAJO = 5;

export const formatoPesos = (valor: number) =>
  "$" + Math.round(valor).toLocaleString("es-CO", { maximumFractionDigits: 0 });

// Fila tal como vive en la tabla "pedidos" de Supabase.
type FilaPedido = {
  id: string;
  created_at: string;
  cliente: string;
  producto_id: string;
  cantidad: number;
  estado: string;
  medio_pago: string | null;
  monto: number | null;
};

const COLUMNAS_PEDIDO = "id, created_at, cliente, producto_id, cantidad, estado, medio_pago, monto";

// Convierte una fila de la base en el Pedido que usan las pantallas.
// El precio unitario se calcula: monto (total) / cantidad.
function aPedido(fila: FilaPedido, productos: Producto[]): Pedido {
  const monto = Number(fila.monto ?? 0);
  return {
    id: fila.id,
    cliente: fila.cliente,
    producto: productos.find((p) => p.id === fila.producto_id)?.nombre ?? "Producto",
    cantidad: fila.cantidad,
    precioUnitario: fila.cantidad > 0 ? monto / fila.cantidad : 0,
    formaPago: fila.medio_pago?.toLowerCase() === "transferencia" ? "transferencia" : "efectivo",
    registradoPor: "—", // la base no guarda quién registró (no está en la sección 7 del BRD)
    entregado: fila.estado === "Entregado",
    fecha: fila.created_at,
  };
}

type Ctx = {
  pedidos: Pedido[];
  productos: Producto[];
  cargando: boolean;
  agregarPedido: (p: Omit<Pedido, "id" | "entregado" | "fecha">) => Promise<Pedido>;
  marcarEntregado: (id: string) => Promise<void>;
  registrarMovimiento: (
    productoId: string,
    tipo: "entrada" | "salida",
    cantidad: number,
  ) => Promise<number>;
};

const PedidosContext = createContext<Ctx | null>(null);

export function PedidosProvider({ children }: { children: ReactNode }) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);

  // READ: al abrir la app se leen productos y pedidos desde Supabase.
  useEffect(() => {
    let activo = true;
    (async () => {
      const [prod, ped] = await Promise.all([
        supabase.from("productos").select("id, nombre, stock").order("nombre"),
        supabase.from("pedidos").select(COLUMNAS_PEDIDO).order("created_at", { ascending: false }),
      ]);
      if (!activo) return;
      if (prod.error || ped.error) {
        console.error("Error leyendo Supabase:", prod.error ?? ped.error);
      } else {
        const lista = prod.data as Producto[];
        setProductos(lista);
        setPedidos((ped.data as FilaPedido[]).map((f) => aPedido(f, lista)));
      }
      setCargando(false);
    })();
    return () => {
      activo = false;
    };
  }, []);

  const valor = useMemo<Ctx>(
    () => ({
      pedidos,
      productos,
      cargando,

      // CREATE: inserta el pedido; el id y la fecha los genera la base.
      agregarPedido: async (datos) => {
        const prod = productos.find((p) => p.nombre === datos.producto);
        if (!prod) throw new Error("Producto no encontrado");
        const { data, error } = await supabase
          .from("pedidos")
          .insert({
            cliente: datos.cliente,
            producto_id: prod.id,
            cantidad: datos.cantidad,
            estado: "Pendiente",
            medio_pago: datos.formaPago === "transferencia" ? "Transferencia" : "Efectivo",
            monto: datos.cantidad * datos.precioUnitario,
          })
          .select(COLUMNAS_PEDIDO)
          .single();
        if (error || !data) throw new Error(error?.message ?? "No se pudo guardar el pedido");
        // Se conservan en pantalla los datos extra del formulario (la base no los guarda).
        const base = aPedido(data as FilaPedido, productos);
        const nuevo: Pedido = { ...base, registradoPor: datos.registradoPor };
        if (datos.negocio) nuevo.negocio = datos.negocio;
        if (datos.telefono) nuevo.telefono = datos.telefono;
        if (datos.direccion) nuevo.direccion = datos.direccion;
        if (datos.ciudad) nuevo.ciudad = datos.ciudad;
        if (datos.departamento) nuevo.departamento = datos.departamento;
        setPedidos((prev) => [nuevo, ...prev]);
        return nuevo;
      },

      // CREATE (inventario): registra una entrada o salida de producto.
      // Las reglas (cantidad positiva, stock suficiente, todo o nada) viven en
      // la función registrar_movimiento de Supabase. Devuelve el nuevo stock.
      registrarMovimiento: async (productoId, tipo, cantidad) => {
        const { data, error } = await supabase.rpc("registrar_movimiento", {
          p_producto_id: productoId,
          p_tipo: tipo,
          p_cantidad: cantidad,
        });
        if (error) throw new Error(error.message);
        const nuevoStock = Number(data);
        setProductos((prev) =>
          prev.map((p) => (p.id === productoId ? { ...p, stock: nuevoStock } : p)),
        );
        return nuevoStock;
      },

      // UPDATE: marca el pedido como Entregado y descuenta el stock.
      marcarEntregado: async (id) => {
        const pedido = pedidos.find((p) => p.id === id);
        if (!pedido || pedido.entregado) return;
        const prod = productos.find((p) => p.nombre === pedido.producto);

        const r1 = await supabase.from("pedidos").update({ estado: "Entregado" }).eq("id", id);
        if (r1.error) {
          console.error("No se pudo marcar como entregado:", r1.error);
          return;
        }

        let stockNuevo: number | null = null;
        if (prod) {
          stockNuevo = Math.max(prod.stock - pedido.cantidad, 0);
          const r2 = await supabase
            .from("productos")
            .update({ stock: stockNuevo })
            .eq("id", prod.id);
          if (r2.error) {
            // Si falla el stock se revierte el pedido para no dejar datos inconsistentes.
            console.error("No se pudo descontar el stock:", r2.error);
            await supabase.from("pedidos").update({ estado: "Pendiente" }).eq("id", id);
            return;
          }
        }

        setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, entregado: true } : p)));
        if (prod && stockNuevo !== null) {
          setProductos((prev) =>
            prev.map((p) => (p.id === prod.id ? { ...p, stock: stockNuevo! } : p)),
          );
        }
      },
    }),
    [pedidos, productos, cargando],
  );

  return <PedidosContext.Provider value={valor}>{children}</PedidosContext.Provider>;
}

export function usePedidos() {
  const ctx = useContext(PedidosContext);
  if (!ctx) throw new Error("usePedidos debe usarse dentro de PedidosProvider");
  return ctx;
}
