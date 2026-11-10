// Las dos cuentas del personal. Se crean a mano en Supabase → Authentication → Users
// con estos correos (y la contraseña que tú elijas) y se les asigna el rol con
// paso9b_asignar_roles.sql. Si cambias un correo aquí, cámbialo también allá.
export const CUENTAS_PERSONAL = {
  dueno: { rol: "dueno", nombre: "Don Tauro", correo: "dontauro@taurocontrol.com" },
  ayudante: { rol: "ayudante", nombre: "Ayudante", correo: "ayudante@taurocontrol.com" },
} as const;
