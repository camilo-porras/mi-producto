import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { CUENTAS_PERSONAL } from "@/lib/acceso";
import { MarcaTauro } from "@/components/MarcaTauro";

const etiqueta = "block text-sm font-bold text-muted-foreground mb-2";
const campo =
  "w-full rounded-2xl border border-border bg-card px-4 py-4 text-lg outline-none focus:border-primary";
const botonPrincipal =
  "superficie-cuero h-16 w-full rounded-2xl text-xl font-bold shadow-lg disabled:cursor-not-allowed disabled:opacity-60";
const botonSecundario =
  "h-14 w-full rounded-2xl border-2 border-primary bg-card text-base font-bold text-primary";

type Modo = "elegir" | "dueno" | "ayudante" | "cliente" | "registro";

function Mensaje({ texto }: { texto: string }) {
  return texto ? (
    <p
      role="alert"
      className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive"
    >
      {texto}
    </p>
  ) : null;
}

// Pantalla de acceso: Don Tauro, Ayudante o Cliente (con correo y contraseña).
export function Acceso() {
  const [modo, setModo] = useState<Modo>("elegir");

  return (
    <div className="mx-auto min-h-screen w-full max-w-md pb-10">
      <header className="superficie-cuero relative rounded-b-4xl px-5 pb-8 pt-8">
        <MarcaTauro className="pointer-events-none absolute right-5 top-7 h-20 w-20 object-contain" />
        <p className="text-sm uppercase tracking-widest text-accent">Mano Facturas Tauro</p>
        <h1 className="mt-1 pr-24 text-3xl font-semibold">Tauro Control</h1>
        <p className="mt-2 pr-24 text-sm text-accent">Inicia sesión para continuar</p>
      </header>

      <main className="px-5 py-6">
        {modo === "elegir" ? <Elegir onElegir={setModo} /> : null}
        {modo === "dueno" || modo === "ayudante" ? (
          <IngresoPersonal quien={modo} onVolver={() => setModo("elegir")} />
        ) : null}
        {modo === "cliente" ? (
          <IngresoCliente
            onVolver={() => setModo("elegir")}
            onRegistro={() => setModo("registro")}
          />
        ) : null}
        {modo === "registro" ? <Registro onVolver={() => setModo("cliente")} /> : null}
      </main>
    </div>
  );
}

function Elegir({ onElegir }: { onElegir: (m: Modo) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-lg font-semibold">¿Cómo quieres ingresar?</p>
      <button type="button" onClick={() => onElegir("dueno")} className={botonPrincipal}>
        Don Tauro
      </button>
      <button type="button" onClick={() => onElegir("ayudante")} className={botonPrincipal}>
        Ayudante
      </button>
      <button type="button" onClick={() => onElegir("cliente")} className={botonSecundario}>
        Soy cliente
      </button>
    </div>
  );
}

function IngresoPersonal({
  quien,
  onVolver,
}: {
  quien: "dueno" | "ayudante";
  onVolver: () => void;
}) {
  const { ingresar } = useAuth();
  const cuenta = CUENTAS_PERSONAL[quien];
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [entrando, setEntrando] = useState(false);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!clave) return;
    setEntrando(true);
    setError("");
    try {
      await ingresar(cuenta.correo, clave);
    } catch (err) {
      setError(
        err instanceof Error && err.message.includes("incorrectos")
          ? "Contraseña incorrecta"
          : err instanceof Error
            ? err.message
            : "No pudimos ingresar",
      );
      setEntrando(false);
    }
  };

  return (
    <form onSubmit={enviar} className="space-y-5">
      <p className="text-lg font-semibold">Ingresar como {cuenta.nombre}</p>
      <div>
        <label className={etiqueta} htmlFor="clave-personal">
          Contraseña
        </label>
        <input
          id="clave-personal"
          type="password"
          autoComplete="current-password"
          className={campo}
          value={clave}
          onChange={(e) => setClave(e.target.value)}
        />
      </div>
      <Mensaje texto={error} />
      <button type="submit" disabled={entrando || !clave} className={botonPrincipal}>
        {entrando ? "Ingresando…" : "Ingresar"}
      </button>
      <button type="button" onClick={onVolver} className={botonSecundario}>
        ← Volver
      </button>
    </form>
  );
}

function IngresoCliente({
  onVolver,
  onRegistro,
}: {
  onVolver: () => void;
  onRegistro: () => void;
}) {
  const { ingresar } = useAuth();
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [entrando, setEntrando] = useState(false);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!correo.trim() || !clave) return;
    setEntrando(true);
    setError("");
    try {
      await ingresar(correo, clave);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos ingresar");
      setEntrando(false);
    }
  };

  return (
    <form onSubmit={enviar} className="space-y-5">
      <p className="text-lg font-semibold">Ingreso de clientes</p>
      <div>
        <label className={etiqueta} htmlFor="correo-cliente">
          Correo electrónico
        </label>
        <input
          id="correo-cliente"
          type="email"
          inputMode="email"
          autoComplete="email"
          className={campo}
          placeholder="Ej: tucorreo@gmail.com"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
        />
      </div>
      <div>
        <label className={etiqueta} htmlFor="clave-cliente">
          Contraseña
        </label>
        <input
          id="clave-cliente"
          type="password"
          autoComplete="current-password"
          className={campo}
          value={clave}
          onChange={(e) => setClave(e.target.value)}
        />
      </div>
      <Mensaje texto={error} />
      <button
        type="submit"
        disabled={entrando || !correo.trim() || !clave}
        className={botonPrincipal}
      >
        {entrando ? "Ingresando…" : "Ingresar"}
      </button>
      <button type="button" onClick={onRegistro} className={botonSecundario}>
        Crear cuenta nueva
      </button>
      <button
        type="button"
        onClick={onVolver}
        className="w-full text-center text-sm font-semibold text-primary underline"
      >
        ← Volver
      </button>
    </form>
  );
}

function Registro({ onVolver }: { onVolver: () => void }) {
  const { registrarCliente } = useAuth();
  const [d, setD] = useState({
    nombre: "",
    negocio: "",
    telefono: "",
    direccion: "",
    ciudad: "",
    departamento: "",
    correo: "",
    clave: "",
    repetir: "",
  });
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);

  const poner = (campoNombre: keyof typeof d) => (e: { target: { value: string } }) =>
    setD((prev) => ({ ...prev, [campoNombre]: e.target.value }));

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    const faltan = [
      !d.nombre.trim() && "tu nombre",
      !d.telefono.trim() && "el teléfono",
      !d.direccion.trim() && "la dirección",
      !d.ciudad.trim() && "la ciudad",
      !d.departamento.trim() && "el departamento",
      !d.correo.trim() && "el correo",
      !d.clave && "la contraseña",
    ].filter(Boolean);
    if (faltan.length > 0) {
      setError(`Completa ${faltan.join(", ")}.`);
      return;
    }
    if (d.clave.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (d.clave !== d.repetir) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setEnviando(true);
    setError("");
    try {
      const { requiereConfirmar } = await registrarCliente({
        correo: d.correo,
        clave: d.clave,
        nombre: d.nombre,
        negocio: d.negocio,
        telefono: d.telefono,
        direccion: d.direccion,
        ciudad: d.ciudad,
        departamento: d.departamento,
      });
      if (requiereConfirmar) setConfirmar(true);
      // Si no hay que confirmar, la sesión ya quedó iniciada y la app cambia sola
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos crear la cuenta");
    } finally {
      setEnviando(false);
    }
  };

  if (confirmar) {
    return (
      <div className="space-y-5">
        <p className="rounded-2xl bg-accent px-4 py-4 text-sm font-bold text-accent-foreground">
          Cuenta creada. Te enviamos un correo para confirmarla: ábrelo y luego ingresa con tu
          correo y contraseña.
        </p>
        <button type="button" onClick={onVolver} className={botonPrincipal}>
          Ir a ingresar
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-5">
      <p className="text-lg font-semibold">Crear cuenta de cliente</p>
      <div>
        <label className={etiqueta} htmlFor="reg-nombre">
          Tu nombre
        </label>
        <input
          id="reg-nombre"
          className={campo}
          placeholder="Ej: Doña Luz"
          value={d.nombre}
          onChange={poner("nombre")}
        />
      </div>
      <div>
        <label className={etiqueta} htmlFor="reg-negocio">
          Nombre del local o negocio <span className="font-normal">(opcional)</span>
        </label>
        <input
          id="reg-negocio"
          className={campo}
          placeholder="Ej: Almacén La Esquina"
          value={d.negocio}
          onChange={poner("negocio")}
        />
      </div>
      <div>
        <label className={etiqueta} htmlFor="reg-telefono">
          Número de teléfono
        </label>
        <input
          id="reg-telefono"
          type="tel"
          inputMode="tel"
          className={campo}
          placeholder="Ej: 300 123 4567"
          value={d.telefono}
          onChange={poner("telefono")}
        />
      </div>
      <div>
        <label className={etiqueta} htmlFor="reg-direccion">
          Dirección
        </label>
        <input
          id="reg-direccion"
          className={campo}
          placeholder="Ej: Calle 10 # 5-20"
          value={d.direccion}
          onChange={poner("direccion")}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={etiqueta} htmlFor="reg-ciudad">
            Ciudad
          </label>
          <input
            id="reg-ciudad"
            className={campo}
            placeholder="Ej: Pereira"
            value={d.ciudad}
            onChange={poner("ciudad")}
          />
        </div>
        <div>
          <label className={etiqueta} htmlFor="reg-departamento">
            Departamento
          </label>
          <input
            id="reg-departamento"
            className={campo}
            placeholder="Ej: Risaralda"
            value={d.departamento}
            onChange={poner("departamento")}
          />
        </div>
      </div>
      <div>
        <label className={etiqueta} htmlFor="reg-correo">
          Correo electrónico
        </label>
        <input
          id="reg-correo"
          type="email"
          inputMode="email"
          autoComplete="email"
          className={campo}
          placeholder="Ej: tucorreo@gmail.com"
          value={d.correo}
          onChange={poner("correo")}
        />
      </div>
      <div>
        <label className={etiqueta} htmlFor="reg-clave">
          Contraseña <span className="font-normal">(mínimo 6 caracteres)</span>
        </label>
        <input
          id="reg-clave"
          type="password"
          autoComplete="new-password"
          className={campo}
          value={d.clave}
          onChange={poner("clave")}
        />
      </div>
      <div>
        <label className={etiqueta} htmlFor="reg-repetir">
          Repite la contraseña
        </label>
        <input
          id="reg-repetir"
          type="password"
          autoComplete="new-password"
          className={campo}
          value={d.repetir}
          onChange={poner("repetir")}
        />
      </div>
      <Mensaje texto={error} />
      <button type="submit" disabled={enviando} className={botonPrincipal}>
        {enviando ? "Creando cuenta…" : "Crear cuenta"}
      </button>
      <button
        type="button"
        onClick={onVolver}
        className="w-full text-center text-sm font-semibold text-primary underline"
      >
        ← Ya tengo cuenta
      </button>
    </form>
  );
}
