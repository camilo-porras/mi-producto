import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Producto = "Billetera clásica café" | "Cinturón camel" | "Cinturón trenzado negro";
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

export const formatoPesos = (valor: number) =>
  "$" + Math.round(valor).toLocaleString("es-CO", { maximumFractionDigits: 0 });

const hoy = new Date().toISOString();

const pedidosIniciales: Pedido[] = [
  {
    id: "1001",
    cliente: "Doña Luz",
    producto: "Billetera clásica café",
    cantidad: 2,
    precioUnitario: 45000,
    formaPago: "efectivo",
    registradoPor: "Don Tauro",
    entregado: false,
    fecha: hoy,
  },
  {
    id: "1002",
    cliente: "La vecina Luisa",
    producto: "Cinturón trenzado negro",
    cantidad: 1,
    precioUnitario: 85000,
    formaPago: "transferencia",
    registradoPor: "Ayudante",
    entregado: false,
    fecha: hoy,
  },
  {
    id: "1003",
    cliente: "Carlos",
    producto: "Cinturón camel",
    cantidad: 3,
    precioUnitario: 60000,
    formaPago: "efectivo",
    registradoPor: "Don Tauro",
    entregado: true,
    fecha: hoy,
  },
  {
    id: "1004",
    cliente: "Marta del centro",
    producto: "Billetera clásica café",
    cantidad: 1,
    precioUnitario: 180000,
    formaPago: "transferencia",
    registradoPor: "Don Tauro",
    entregado: true,
    fecha: hoy,
  },
];

type Ctx = {
  pedidos: Pedido[];
  agregarPedido: (p: Omit<Pedido, "id" | "entregado" | "fecha">) => Pedido;
  marcarEntregado: (id: string) => void;
};

const PedidosContext = createContext<Ctx | null>(null);
const CLAVE = "tauro-control-pedidos";

export function PedidosProvider({ children }: { children: ReactNode }) {
  const [pedidos, setPedidos] = useState<Pedido[]>(pedidosIniciales);

  useEffect(() => {
    const guardado = localStorage.getItem(CLAVE);
    if (guardado) {
      try {
        setPedidos(JSON.parse(guardado) as Pedido[]);
      } catch {
        /* datos corruptos: se conservan los de ejemplo */
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CLAVE, JSON.stringify(pedidos));
  }, [pedidos]);

  const valor = useMemo<Ctx>(
    () => ({
      pedidos,
      agregarPedido: (datos) => {
        const nuevo: Pedido = {
          ...datos,
          id: String(Date.now()),
          entregado: false,
          fecha: new Date().toISOString(),
        };
        setPedidos((prev) => [nuevo, ...prev]);
        return nuevo;
      },
      marcarEntregado: (id) =>
        setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, entregado: true } : p))),
    }),
    [pedidos],
  );

  return <PedidosContext.Provider value={valor}>{children}</PedidosContext.Provider>;
}

export function usePedidos() {
  const ctx = useContext(PedidosContext);
  if (!ctx) throw new Error("usePedidos debe usarse dentro de PedidosProvider");
  return ctx;
}
