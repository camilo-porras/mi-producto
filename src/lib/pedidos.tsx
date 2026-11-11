import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";

export type FormaPago = "efectivo" | "transferencia";

// ---------------------------------------------------------------- Clientes
// Cada cliente se identifica por su id interno (lo genera la base y nunca cambia).
// Nombre, negocio, teléfono, dirección, etc. se pueden editar sin perder el historial.
export type Cliente = {
  id: string;
  nombre: string;
  negocio: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  departamento: string;
};
export type DatosCliente = Omit<Cliente, "id">;

// ---------------------------------------------------------------- Pedidos
export type LineaPedido = {
  productoId: string;
  producto: string;
  cantidad: number;
  precioUnitario: number;
};

// Renglón tal como lo manejan los formularios (antes de guardarse).
export type LineaForm = { productoId: string; cantidad: number; precioUnitario: number };

export type Pedido = {
  id: string;
  clienteId: string;
  cliente: string;
  negocio: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  lineas: LineaPedido[];
  total: number;
  formaPago: FormaPago;
  registradoPor: string;
  entregado: boolean;
  // Solicitud de un cliente que el personal todavía no acepta (no aparta stock).
  solicitado: boolean;
  fecha: string;
};

export const unidadesDe = (p: Pick<Pedido, "lineas">) =>
  p.lineas.reduce((s, l) => s + l.cantidad, 0);

// Texto corto de lo que lleva el pedido: "2 × Billetera" o "3 productos · 7 unidades".
export const resumenLineas = (p: Pick<Pedido, "lineas">) => {
  const primera = p.lineas[0];
  if (p.lineas.length === 1 && primera) return `${primera.cantidad} × ${primera.producto}`;
  return `${p.lineas.length} productos · ${unidadesDe(p)} unidades`;
};

// ---------------------------------------------------------------- Productos
export type Producto = { id: string; nombre: string; stock: number; precio: number };

// stock = unidades físicas en bodega. comprometido = unidades apartadas por pedidos
// pendientes. disponible = lo que realmente se puede ofrecer (stock - comprometido).
export type ProductoVista = Producto & { comprometido: number; disponible: number };

// A partir de esta cantidad (o menos) un producto se marca como "stock bajo".
export const STOCK_BAJO = 5;

export const formatoPesos = (valor: number) =>
  "$" + Math.round(valor).toLocaleString("es-CO", { maximumFractionDigits: 0 });

// ---------------------------------------------------------------- Filas de la base
type FilaItem = { producto_id: string; cantidad: number; precio_unitario: number | string };

type FilaPedido = {
  id: string;
  created_at: string;
  cliente_id: string;
  estado: string;
  medio_pago: string | null;
  monto: number | string | null;
  anulado_por: string | null;
  motivo_anulacion: string | null;
  anulado_at: string | null;
  pedido_items: FilaItem[] | null;
};

type FilaCliente = {
  id: string;
  nombre: string;
  negocio: string | null;
  telefono: string | null;
  direccion: string | null;
  ciudad: string | null;
  departamento: string | null;
};

const COLUMNAS_PEDIDO =
  "id, created_at, cliente_id, estado, medio_pago, monto, anulado_por, motivo_anulacion, anulado_at, pedido_items(producto_id, cantidad, precio_unitario)";
const COLUMNAS_CLIENTE = "id, nombre, negocio, telefono, direccion, ciudad, departamento";

const aCliente = (f: FilaCliente): Cliente => ({
  id: f.id,
  nombre: f.nombre,
  negocio: f.negocio ?? "",
  telefono: f.telefono ?? "",
  direccion: f.direccion ?? "",
  ciudad: f.ciudad ?? "",
  departamento: f.departamento ?? "",
});

// Convierte una fila de la base en el Pedido que usan las pantallas. Los datos del
// cliente se leen de la tabla clientes, así que si el cliente se edita, se ven al día.
function aPedido(
  fila: FilaPedido,
  productos: Producto[],
  clientes: Cliente[],
  registrado: Record<string, string>,
): Pedido {
  const cli = clientes.find((c) => c.id === fila.cliente_id);
  return {
    id: fila.id,
    clienteId: fila.cliente_id,
    cliente: cli?.nombre ?? "Cliente",
    negocio: cli?.negocio ?? "",
    telefono: cli?.telefono ?? "",
    direccion: cli?.direccion ?? "",
    ciudad: cli?.ciudad ?? "",
    departamento: cli?.departamento ?? "",
    lineas: (fila.pedido_items ?? []).map((i) => ({
      productoId: i.producto_id,
      producto: productos.find((p) => p.id === i.producto_id)?.nombre ?? "Producto",
      cantidad: i.cantidad,
      precioUnitario: Number(i.precio_unitario),
    })),
    total: Number(fila.monto ?? 0),
    formaPago: fila.medio_pago?.toLowerCase() === "transferencia" ? "transferencia" : "efectivo",
    registradoPor: registrado[fila.id] ?? "—", // la base no guarda quién registró
    entregado: fila.estado === "Entregado",
    solicitado: fila.estado === "Solicitado",
    fecha: fila.created_at,
  };
}

// Pedido anulado: la fila sigue en la base, con quién lo anuló, por qué y cuándo.
export type PedidoAnulado = Pedido & {
  anuladoPor: string;
  motivo: string;
  anuladoEn: string;
};

const itemsParaBase = (lineas: LineaForm[]) =>
  lineas.map((l) => ({
    producto_id: l.productoId,
    cantidad: l.cantidad,
    precio_unitario: l.precioUnitario,
  }));

const pagoParaBase = (f: FormaPago) => (f === "transferencia" ? "Transferencia" : "Efectivo");

type DatosPedido = { clienteId: string; formaPago: FormaPago; lineas: LineaForm[] };

type Ctx = {
  pedidos: Pedido[];
  anulados: PedidoAnulado[];
  productos: ProductoVista[];
  clientes: Cliente[];
  cargando: boolean;
  agregarPedido: (datos: DatosPedido & { registradoPor: string }) => Promise<string>;
  editarPedido: (id: string, datos: DatosPedido) => Promise<void>;
  marcarEntregado: (id: string) => Promise<void>;
  aceptarSolicitud: (id: string) => Promise<void>;
  anularPedido: (id: string, anuladoPor: string, motivo: string) => Promise<void>;
  crearProducto: (nombre: string, stockInicial: number, precio: number) => Promise<void>;
  editarProducto: (id: string, nombre: string, precio: number) => Promise<void>;
  registrarMovimiento: (
    productoId: string,
    tipo: "entrada" | "salida",
    cantidad: number,
  ) => Promise<number>;
  crearCliente: (datos: DatosCliente) => Promise<Cliente>;
  editarCliente: (id: string, datos: DatosCliente) => Promise<void>;
};

const PedidosContext = createContext<Ctx | null>(null);

export function PedidosProvider({ children }: { children: ReactNode }) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filas, setFilas] = useState<FilaPedido[]>([]);
  const [registrado, setRegistrado] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(true);

  // READ: lee productos, clientes y pedidos (con sus renglones) desde Supabase.
  const cargar = useCallback(async () => {
    const [prod, cli, ped] = await Promise.all([
      supabase.from("productos").select("id, nombre, stock, precio").order("nombre"),
      supabase.from("clientes").select(COLUMNAS_CLIENTE).order("nombre"),
      supabase.from("pedidos").select(COLUMNAS_PEDIDO).order("created_at", { ascending: false }),
    ]);
    if (prod.error || cli.error || ped.error) {
      console.error("Error leyendo Supabase:", prod.error ?? cli.error ?? ped.error);
      return;
    }
    setProductos(
      (prod.data as (Omit<Producto, "precio"> & { precio: number | string })[]).map((p) => ({
        ...p,
        precio: Number(p.precio),
      })),
    );
    setClientes((cli.data as FilaCliente[]).map(aCliente));
    setFilas(ped.data as unknown as FilaPedido[]);
  }, []);

  useEffect(() => {
    let activo = true;
    (async () => {
      await cargar();
      if (activo) setCargando(false);
    })();
    return () => {
      activo = false;
    };
  }, [cargar]);

  const pedidos = useMemo(
    () =>
      filas
        .filter((f) => f.estado !== "Anulado") // los anulados siguen en la base, pero se ignoran aquí
        .map((f) => aPedido(f, productos, clientes, registrado)),
    [filas, productos, clientes, registrado],
  );

  const anulados = useMemo<PedidoAnulado[]>(
    () =>
      filas
        .filter((f) => f.estado === "Anulado")
        .sort((a, b) => (b.anulado_at ?? "").localeCompare(a.anulado_at ?? ""))
        .map((f) => ({
          ...aPedido(f, productos, clientes, registrado),
          anuladoPor: f.anulado_por ?? "—",
          motivo: f.motivo_anulacion ?? "—",
          anuladoEn: f.anulado_at ?? f.created_at,
        })),
    [filas, productos, clientes, registrado],
  );

  // Las unidades de un pedido pendiente quedan apartadas: siguen en bodega (el stock
  // solo baja al entregar), pero ya no están disponibles para otro cliente.
  const productosVista = useMemo<ProductoVista[]>(() => {
    const apartado = new Map<string, number>();
    for (const ped of pedidos) {
      if (ped.entregado || ped.solicitado) continue;
      for (const l of ped.lineas) {
        apartado.set(l.productoId, (apartado.get(l.productoId) ?? 0) + l.cantidad);
      }
    }
    return productos.map((p) => {
      const comprometido = apartado.get(p.id) ?? 0;
      return { ...p, comprometido, disponible: Math.max(p.stock - comprometido, 0) };
    });
  }, [productos, pedidos]);

  const valor = useMemo<Ctx>(
    () => ({
      pedidos,
      anulados,
      productos: productosVista,
      clientes,
      cargando,

      // CREATE con lógica de negocio: un cliente, uno o varios productos, todo o nada.
      // La función crear_pedido valida en la base que cada renglón tenga stock DISPONIBLE.
      agregarPedido: async (datos) => {
        const { data, error } = await supabase.rpc("crear_pedido", {
          p_cliente_id: datos.clienteId,
          p_medio_pago: pagoParaBase(datos.formaPago),
          p_items: itemsParaBase(datos.lineas),
        });
        if (error) throw new Error(error.message);
        const id = data as string;
        setRegistrado((prev) => ({ ...prev, [id]: datos.registradoPor }));
        await cargar();
        return id;
      },

      // UPDATE: cambia cliente, forma de pago y renglones de un pedido pendiente.
      editarPedido: async (id, datos) => {
        const { error } = await supabase.rpc("editar_pedido", {
          p_pedido_id: id,
          p_cliente_id: datos.clienteId,
          p_medio_pago: pagoParaBase(datos.formaPago),
          p_items: itemsParaBase(datos.lineas),
        });
        if (error) throw new Error(error.message);
        await cargar();
      },

      // UPDATE con lógica de negocio: entrega TODOS los renglones o ninguno, descuenta
      // el stock de cada producto y deja una salida por cada uno en el historial.
      marcarEntregado: async (id) => {
        const { error } = await supabase.rpc("entregar_pedido", { p_pedido_id: id });
        if (error) throw new Error(error.message);
        await cargar();
      },

      // Acepta la solicitud de un cliente: pasa a Pendiente y aparta el stock. Antes se le
      // deben poner los precios con «Editar pedido».
      aceptarSolicitud: async (id) => {
        const { error } = await supabase.rpc("aceptar_solicitud", { p_pedido_id: id });
        if (error) throw new Error(error.message);
        await cargar();
      },

      // DELETE lógico: anula un pedido pendiente SIN borrar la fila (queda quién y por qué).
      anularPedido: async (id, anuladoPor, motivo) => {
        const { error } = await supabase.rpc("anular_pedido", {
          p_pedido_id: id,
          p_anulado_por: anuladoPor,
          p_motivo: motivo,
        });
        if (error) throw new Error(error.message);
        await cargar();
      },

      // CREATE (inventario): agrega un producto nuevo.
      crearProducto: async (nombre, stockInicial, precio) => {
        const { data, error } = await supabase.rpc("crear_producto", {
          p_nombre: nombre,
          p_stock_inicial: stockInicial,
          p_precio: precio,
        });
        if (error) throw new Error(error.message);
        setProductos((prev) =>
          [
            ...prev,
            { id: data as string, nombre: nombre.trim(), stock: stockInicial, precio },
          ].sort((a, b) => a.nombre.localeCompare(b.nombre)),
        );
      },

      // UPDATE (inventario): cambia el nombre o el precio de un producto. Solo el personal
      // puede hacerlo (la base lo exige). El stock solo cambia con entradas y salidas.
      editarProducto: async (id, nombre, precio) => {
        const { error } = await supabase.rpc("editar_producto", {
          p_id: id,
          p_nombre: nombre,
          p_precio: precio,
        });
        if (error) throw new Error(error.message);
        setProductos((prev) =>
          prev
            .map((p) => (p.id === id ? { ...p, nombre: nombre.trim(), precio } : p))
            .sort((a, b) => a.nombre.localeCompare(b.nombre)),
        );
      },

      // CREATE (inventario): registra una entrada o salida de producto.
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

      // CREATE (clientes): registra un cliente nuevo. Su id lo genera la base.
      crearCliente: async (datos) => {
        const { data, error } = await supabase.rpc("crear_cliente", {
          p_nombre: datos.nombre,
          p_negocio: datos.negocio,
          p_telefono: datos.telefono,
          p_direccion: datos.direccion,
          p_ciudad: datos.ciudad,
          p_departamento: datos.departamento,
        });
        if (error) throw new Error(error.message);
        const nuevo: Cliente = {
          id: data as string,
          nombre: datos.nombre.trim(),
          negocio: datos.negocio.trim(),
          telefono: datos.telefono.trim(),
          direccion: datos.direccion.trim(),
          ciudad: datos.ciudad.trim(),
          departamento: datos.departamento.trim(),
        };
        setClientes((prev) => [...prev, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre)));
        return nuevo;
      },

      // UPDATE (clientes): el id no cambia, así sus pedidos anteriores siguen ligados a él
      // aunque cambie de teléfono, de negocio, de dirección o de dueño.
      editarCliente: async (id, datos) => {
        const { error } = await supabase.rpc("editar_cliente", {
          p_id: id,
          p_nombre: datos.nombre,
          p_negocio: datos.negocio,
          p_telefono: datos.telefono,
          p_direccion: datos.direccion,
          p_ciudad: datos.ciudad,
          p_departamento: datos.departamento,
        });
        if (error) throw new Error(error.message);
        setClientes((prev) =>
          prev
            .map((c) =>
              c.id === id
                ? {
                    id,
                    nombre: datos.nombre.trim(),
                    negocio: datos.negocio.trim(),
                    telefono: datos.telefono.trim(),
                    direccion: datos.direccion.trim(),
                    ciudad: datos.ciudad.trim(),
                    departamento: datos.departamento.trim(),
                  }
                : c,
            )
            .sort((a, b) => a.nombre.localeCompare(b.nombre)),
        );
      },
    }),
    [pedidos, anulados, productosVista, clientes, cargando, cargar],
  );

  return <PedidosContext.Provider value={valor}>{children}</PedidosContext.Provider>;
}

export function usePedidos() {
  const ctx = useContext(PedidosContext);
  if (!ctx) throw new Error("usePedidos debe usarse dentro de PedidosProvider");
  return ctx;
}
