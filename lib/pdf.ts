import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { brl } from "./utils";

function afterTableY(doc: jsPDF, fallback: number) {
  return ((doc as any).lastAutoTable?.finalY || fallback) + 6;
}

export async function generateOsPdf(kind: "entrada" | "orcamento" | "saida", data: any) {
  const doc = new jsPDF("p", "mm", "a4");
  const company = data.company || {};
  const os = data.os || {};
  const items = data.items || [];
  const title =
    kind === "entrada"
      ? "ORDEM DE SERVIÇO - ENTRADA"
      : kind === "saida"
        ? "ORDEM DE SERVIÇO - SAÍDA"
        : "ORÇAMENTO";

  let y = 10;

  try {
    if (company.banner_url) {
      doc.addImage(company.banner_url, "JPEG", 10, 8, 190, 22);
      y = 36;
    }
  } catch {}

  try {
    if (company.logo_url) doc.addImage(company.logo_url, "PNG", 12, y, 24, 20);
  } catch {}

  doc.setFontSize(18);
  doc.text(company.trade_name || company.name || "Fixora ERP", company.logo_url ? 42 : 12, y + 7);
  doc.setFontSize(9);
  doc.text(`WhatsApp: ${company.whatsapp || ""}`, company.logo_url ? 42 : 12, y + 14);
  doc.text(`${company.email || ""}`, company.logo_url ? 42 : 12, y + 19);

  y += 28;
  doc.setDrawColor(0, 120, 212);
  doc.setLineWidth(0.6);
  doc.line(10, y, 200, y);
  y += 8;

  doc.setFontSize(15);
  doc.text(title, 10, y);
  doc.setFontSize(10);
  doc.text(`OS: ${os.os_number || ""}`, 160, y);
  y += 7;

  autoTable(doc, {
    startY: y,
    theme: "grid",
    headStyles: { fillColor: [0, 120, 212] },
    styles: { fontSize: 9, cellPadding: 2 },
    head: [["Campo", "Informação"]],
    body: [
      ["Cliente", os.client_name || ""],
      ["Equipamento", os.device_desc || ""],
      ["Marca / Modelo", `${os.device_brand || ""} ${os.device_model || ""}`],
      ["IMEI / Serial", os.imei || ""],
      ["Senha / Acessórios", `${os.device_password || ""} ${os.accessories || ""}`],
      ["Defeito relatado", os.issue_reported || ""],
      ["Diagnóstico", os.diagnosis || ""],
      ["Serviço / Mão de obra", os.service_name || os.service_done || ""],
      ["Técnico responsável", os.technician || ""],
      ["Status", os.status || ""],
      ["Garantia", os.warranty || ""]
    ]
  });

  y = afterTableY(doc, y);

  if (items.length) {
    autoTable(doc, {
      startY: y,
      theme: "grid",
      headStyles: { fillColor: [0, 120, 212] },
      styles: { fontSize: 9, cellPadding: 2 },
      head: [["Peça / Produto", "Qtd", "Valor unit.", "Total"]],
      body: items.map((i: any) => [i.description, i.quantity, brl(i.unit_value), brl(i.total_value)])
    });
    y = afterTableY(doc, y);
  }

  autoTable(doc, {
    startY: y,
    theme: "plain",
    styles: { fontSize: 10 },
    body: [
      ["Mão de obra", brl(os.labor_value || 0)],
      ["Peças", brl(os.parts_value || 0)],
      ["Desconto", brl(os.discount_value || 0)],
      ["Total", brl(os.total_value || 0)]
    ]
  });

  y = afterTableY(doc, y) + 2;

  const imgs = data.images || [];
  if (imgs.length) {
    if (y > 225) {
      doc.addPage();
      y = 15;
    }
    doc.setFontSize(11);
    doc.text("Fotos", 10, y);
    y += 5;
    let x = 10;
    for (const img of imgs.slice(0, 6)) {
      try {
        doc.addImage(img.url, "JPEG", x, y, 40, 30);
        x += 46;
        if (x > 165) {
          x = 10;
          y += 36;
        }
      } catch {}
    }
    y += 36;
  }

  if (data.signature) {
    if (y > 235) {
      doc.addPage();
      y = 15;
    }
    doc.setFontSize(10);
    doc.text(kind === "saida" ? "Assinatura de saída:" : "Assinatura de entrada:", 10, y);
    try {
      doc.addImage(data.signature, "PNG", 10, y + 4, 65, 26);
    } catch {}
  }

  const pages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(company.footer_notes || "Obrigado pela preferência.", 10, 287);
    doc.text(`Página ${i}/${pages}`, 180, 287);
  }

  doc.save(`${title}_${os.os_number || "os"}.pdf`);
}
