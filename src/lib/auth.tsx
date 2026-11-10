import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type Rol = "dueno" | "ayudante" | "cliente";
export type Perfil = { id: string; rol: Rol; nombre: string };

export type DatosRegistro = {
  correo: string;
  clave: string;
  nombre: string;
  negocio: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  departamento: string;
};

type Auth = {
  cargando: boolean;
  sesion: Session | null;
  perfil: Perfil | null;
  esPersonal: boolean;
  ingresar: (correo: string, clave: string) => Promise<void>;
  registrarCliente: (datos: DatosRegistro) => Promise<{ requiereConfirmar: boolean }>;
  salir: () => Promise<void>;
};

const AuthContext = createContext<Auth | null>(null);

// Traduce los mensajes de Supabase Auth a mensajes claros en español.
const traducir = (mensaje: string) => {
  const m = mensaje.toLowerCase();
  if (m.includes("invalid login credentials")) return "Correo o contraseña incorrectos";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Ese correo ya tiene una cuenta";
  if (m.includes("at least 6")) return "La contraseña debe tener al menos 6 caracteres";
  if (m.includes("email not confirmed"))
    return "Confirma tu correo antes de ingresar (revisa tu bandeja de entrada)";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Demasiados intentos. Espera un momento e intenta de nuevo";
  if (m.includes("valid email") || m.includes("invalid email")) return "Escribe un correo válido";
  if (m.includes("failed to fetch") || m.includes("network"))
    return "No hay conexión. Revisa tu internet e intenta de nuevo";
  return mensaje;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Session | null>(null);
  const [sesionLista, setSesionLista] = useState(false);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [cargandoPerfil, setCargandoPerfil] = useState(false);

  // 1) Recupera la sesión guardada y escucha entradas y salidas
  useEffect(() => {
    let activo = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!activo) return;
      setSesion(data.session);
      setSesionLista(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_evento, nueva) => {
      setSesion(nueva);
      setSesionLista(true);
    });
    return () => {
      activo = false;
      data.subscription.unsubscribe();
    };
  }, []);

  // 2) Con la sesión, lee el rol de la persona (tabla perfiles)
  const usuarioId = sesion?.user.id;
  useEffect(() => {
    if (!usuarioId) {
      setPerfil(null);
      setCargandoPerfil(false);
      return;
    }
    let activo = true;
    setCargandoPerfil(true);
    supabase
      .from("perfiles")
      .select("id, rol, nombre")
      .eq("id", usuarioId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!activo) return;
        if (error) console.error("No se pudo leer el perfil:", error);
        setPerfil(
          data ? { id: data.id, rol: data.rol as Rol, nombre: data.nombre ?? "Cliente" } : null,
        );
        setCargandoPerfil(false);
      });
    return () => {
      activo = false;
    };
  }, [usuarioId]);

  const ingresar = useCallback(async (correo: string, clave: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: correo.trim(),
      password: clave,
    });
    if (error) throw new Error(traducir(error.message));
  }, []);

  // El formulario «Crear cuenta»: la base crea el perfil y la ficha del cliente (con su
  // ID propio) a partir de estos datos.
  const registrarCliente = useCallback(async (d: DatosRegistro) => {
    const { data, error } = await supabase.auth.signUp({
      email: d.correo.trim(),
      password: d.clave,
      options: {
        data: {
          registro: "cliente",
          nombre: d.nombre.trim(),
          negocio: d.negocio.trim(),
          telefono: d.telefono.trim(),
          direccion: d.direccion.trim(),
          ciudad: d.ciudad.trim(),
          departamento: d.departamento.trim(),
        },
      },
    });
    if (error) throw new Error(traducir(error.message));
    // Si Supabase pide confirmar el correo, todavía no hay sesión
    return { requiereConfirmar: !data.session };
  }, []);

  const salir = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const valor = useMemo<Auth>(
    () => ({
      cargando: !sesionLista || (!!sesion && cargandoPerfil),
      sesion,
      perfil,
      esPersonal: perfil?.rol === "dueno" || perfil?.rol === "ayudante",
      ingresar,
      registrarCliente,
      salir,
    }),
    [sesionLista, sesion, cargandoPerfil, perfil, ingresar, registrarCliente, salir],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
