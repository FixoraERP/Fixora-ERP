export function canManageCompanyUsers(session: any) {
  return Boolean(session?.master_admin || session?.role === "Administrador" || session?.company_admin);
}

export function isMaster(session: any) {
  return Boolean(session?.master_admin);
}

export const roles = ["Administrador", "Gerente", "Atendente", "Técnico", "Financeiro"];
