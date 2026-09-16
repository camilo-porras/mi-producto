import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { formatoPesos, usePedidos, type FormaPago } from "@/lib/pedidos";
import {
  guardarCliente,
  listarClientes,
  type FichaCliente,
} from "@/lib/clientes.functions";
import { MarcaTauro } from "@/components/MarcaTauro";

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
  const consultarClientes = useServerFn(listarClientes);
  const guardarFicha = useServerFn(guardarCliente);
  const [cliente, setCliente] = useState("");
  const [negocio, setNegocio] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [clientes, setClientes] = useState<FichaCliente[]>([]);
  const [dispositivoId, setDispositivoId] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState("");
  const [producto, setProducto] = useState<string>(PRODUCTOS[0]!);
  const [cantidad, setCantidad] = useState(1);
  const [precio, setPrecio] = useState(45000);
  const [formaPago, setFormaPago] = useState<FormaPago>("efectivo");
  const [registradoPor, setRegistradoPor] = useState("Don Tauro");

  const total = cantidad * precio;

  useEffect(() => {
    const clave = "tauro-control-dispositivo";
    const existente = localStorage.getItem(clave);
    const id = existente ?? crypto.randomUUID();
    if (!existente) localStorage.setItem(clave, id);
    setDispositivoId(id);
    consultarClientes({ data: { dispositivoId: id } })
      .then(setClientes)
      .catch(() => setErrorGuardado("No pudimos cargar los clientes guardados."));
  }, [consultarClientes]);

  const completarCliente = (nombre: string) => {
    setCliente(nombre);
    const normalizado = nombre.trim().toLocaleLowerCase("es-CO");
    const encontrado = clientes.find(
      (item) => item.nombre.trim().toLocaleLowerCase("es-CO") === normalizado,
    );
    if (!encontrado) return;
    setNegocio(encontrado.negocio);
    setTelefono(encontrado.telefono);
    setDireccion(encontrado.direccion);
    setCiudad(encontrado.ciudad);
    setDepartamento(encontrado.departamento);
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispositivoId) return;
    setGuardando(true);
    setErrorGuardado("");
    const ficha = {
      nombre: cliente.trim(),
      negocio: negocio.trim(),
      telefono: telefono.trim(),
      direccion: direccion.trim(),
      ciudad: ciudad.trim(),
      departamento: departamento.trim(),
    };

    try {
      await guardarFicha({ data: { dispositivoId, ...ficha } });
    } catch {
      setErrorGuardado("No pudimos guardar los datos del cliente. Intenta de nuevo.");
      setGuardando(false);
      return;
    }

    const nuevo = agregarPedido({
      cliente: ficha.nombre,
      negocio: ficha.negocio,
      telefono: ficha.telefono,
      direccion: ficha.direccion,
      ciudad: ficha.ciudad,
      departamento: ficha.departamento,
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
      <header className="superficie-cuero relative rounded-b-4xl px-5 pb-7 pt-8">
        <MarcaTauro />
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
            onChange={(e) => completarCliente(e.target.value)}
            placeholder="Ej: Doña Luz"
            list="clientes-guardados"
            autoComplete="name"
            required
          />
          <datalist id="clientes-guardados">
            {clientes.map((item) => (
              <option key={item.nombre} value={item.nombre}>
                {item.negocio || item.telefono}
              </option>
            ))}
          </datalist>
        </div>

        <div>
          <label className={etiqueta} htmlFor="negocio">
            Nombre del local o negocio <span className="font-normal">(opcional)</span>
          </label>
          <input
            id="negocio"
            className={campo}
            value={negocio}
            onChange={(e) => setNegocio(e.target.value)}
            placeholder="Ej: Almacén La Esquina"
            autoComplete="organization"
          />
        </div>

        <div>
          <label className={etiqueta} htmlFor="telefono">
            Número de teléfono
          </label>
          <input
            id="telefono"
            type="tel"
            inputMode="tel"
            className={campo}
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="Ej: 300 123 4567"
            autoComplete="tel"
            required
          />
        </div>

        <div>
          <label className={etiqueta} htmlFor="direccion">
            Dirección
          </label>
          <input
            id="direccion"
            className={campo}
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder="Ej: Calle 10 # 5-20"
            autoComplete="street-address"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={etiqueta} htmlFor="ciudad">
              Ciudad
            </label>
            <input
              id="ciudad"
              className={campo}
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              placeholder="Ej: Bogotá"
              autoComplete="address-level2"
              required
            />
          </div>
          <div>
            <label className={etiqueta} htmlFor="departamento">
              Departamento
            </label>
            <input
              id="departamento"
              className={campo}
              value={departamento}
              onChange={(e) => setDepartamento(e.target.value)}
              placeholder="Ej: Cundinamarca"
              autoComplete="address-level1"
              required
            />
          </div>
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

        {errorGuardado ? (
          <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
            {errorGuardado}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={guardando || !dispositivoId}
          className="superficie-cuero h-16 w-full rounded-2xl text-xl font-bold shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
        >
          {guardando ? "Guardando…" : "Guardar pedido"}
        </button>
      </form>
    </div>
  );
}
