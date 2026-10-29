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

// stock = unidades físicas en bodega. comprometido = unidades apartadas por pedidos
// pendientes. disponible = lo que realmente se puede ofrecer (stock - comprometido).
export type ProductoVista = Producto & { comprometido: number; disponible: number };

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
  productos: ProductoVista[];
  cargando: boolean;
  agregarPedido: (p: Omit<Pedido, "id" | "entregado" | "fecha">) => Promise<Pedido>;
  marcarEntregado: (id: string) => Promise<void>;
  anularPedido: (id: string) => Promise<void>;
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
        supabase
          .from("pedidos")
          .select(COLUMNAS_PEDIDO)
          .neq("estado", "Anulado") // los anulados siguen en la base, pero la app los ignora
          .order("created_at", { ascending: false }),
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

  // Las unidades de un pedido pendiente quedan apartadas: siguen en bodega (el stock
  // solo baja al entregar), pero ya no están disponibles para otro cliente.
  const productosVista = useMemo<ProductoVista[]>(() => {
    const apartado = new Map<string, number>();
    for (const ped of pedidos) {
      if (!ped.entregado)
        apartado.set(ped.producto, (apartado.get(ped.producto) ?? 0) + ped.cantidad);
    }
    return productos.map((p) => {
      const comprometido = apartado.get(p.nombre) ?? 0;
      return { ...p, comprometido, disponible: Math.max(p.stock - comprometido, 0) };
    });
  }, [productos, pedidos]);

  const valor = useMemo<Ctx>(
    () => ({
      pedidos,
      productos: productosVista,
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

      // DELETE lógico: anula un pedido pendiente SIN borrar la fila. La función
      // anular_pedido de Supabase cambia el estado a "Anulado" y valida las reglas.
      anularPedido: async (id) => {
        const { error } = await supabase.rpc("anular_pedido", { p_pedido_id: id });
        if (error) throw new Error(error.message);
        setPedidos((prev) => prev.filter((p) => p.id !== id));
      },

      // UPDATE con lógica de negocio: entrega el pedido en UNA sola operación.
      // La función entregar_pedido de Supabase valida (pedido pendiente, stock
      // suficiente), descuenta el stock, marca el pedido y guarda la salida.
      // Si algo falla no se guarda nada y el mensaje llega aquí como error.
      marcarEntregado: async (id) => {
        const pedido = pedidos.find((p) => p.id === id);
        if (!pedido || pedido.entregado) return;
        const { data, error } = await supabase.rpc("entregar_pedido", { p_pedido_id: id });
        if (error) throw new Error(error.message);
        const nuevoStock = Number(data);
        const prod = productos.find((p) => p.nombre === pedido.producto);
        setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, entregado: true } : p)));
        if (prod) {
          setProductos((prev) =>
            prev.map((p) => (p.id === prod.id ? { ...p, stock: nuevoStock } : p)),
          );
        }
      },
    }),
    [pedidos, productos, productosVista, cargando],
  );

  return <PedidosContext.Provider value={valor}>{children}</PedidosContext.Provider>;
}

export function usePedidos() {
  const ctx = useContext(PedidosContext);
  if (!ctx) throw new Error("usePedidos debe usarse dentro de PedidosProvider");
  return ctx;
}
