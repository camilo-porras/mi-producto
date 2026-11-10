import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { Acceso } from "@/components/Acceso";
import { AppCliente } from "@/components/AppCliente";

// Decide qué ve cada persona:
//  · sin sesión            -> pantalla de acceso
//  · cliente               -> área del cliente (productos y solicitudes)
//  · Don Tauro o Ayudante  -> la aplicación completa
// La seguridad real está en la base (RLS): aunque alguien cambie la dirección en el
// navegador, la base no le entrega datos de personal.
export function PuertaDeAcceso({ children }: { children: ReactNode }) {
  const { cargando, sesion, perfil, esPersonal, salir } = useAuth();

  if (cargando) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-5">
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  if (!sesion) return <Acceso />;

  if (!perfil) {
    return (
      <div className="mx-auto min-h-screen w-full max-w-md space-y-4 px-5 py-10">
        <p className="rounded-2xl bg-destructive/10 px-4 py-4 text-sm font-bold text-destructive">
          Tu cuenta todavía no tiene un rol asignado. Avísale a Don Tauro para que te dé acceso.
        </p>
        <button
          type="button"
          onClick={salir}
          className="h-14 w-full rounded-2xl border-2 border-primary bg-card text-base font-bold text-primary"
        >
          Cerrar sesión
        </button>
      </div>
    );
  }

  if (!esPersonal) return <AppCliente />;

  return <>{children}</>;
}
