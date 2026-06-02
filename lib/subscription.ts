export function isDatePast(dateValue?: string | null) {
  if (!dateValue || dateValue === "Sem vencimento") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateValue);
  date.setHours(0, 0, 0, 0);
  return date < today;
}

export function isMasterAdmin(user: any) {
  return Boolean(user?.master_admin) || user?.role === "Master" || user?.username === "admin";
}

export function checkCompanyAccess(company: any, user?: any) {
  if (isMasterAdmin(user)) return { allowed: true, status: "master" };
  if (!company) return { allowed: false, reason: "Empresa não encontrada." };
  if (company.owner_company) return { allowed: true, status: "owner" };
  if (company.blocked) return { allowed: false, status: "blocked", reason: company.block_reason || "Empresa bloqueada. Regularize sua assinatura." };
  if (company.subscription_status === "blocked" || company.subscription_status === "cancelled") {
    return { allowed: false, status: company.subscription_status, reason: "Assinatura bloqueada ou cancelada." };
  }
  if (isDatePast(company.subscription_due_date)) {
    return { allowed: false, status: "overdue", reason: "Assinatura vencida. Regularize o pagamento para continuar." };
  }
  return { allowed: true, status: company.subscription_status || "active" };
}
