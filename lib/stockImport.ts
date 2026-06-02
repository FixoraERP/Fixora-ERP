export type StockImportRow = {
  name: string;
  category?: string;
  quantity?: number;
  cost?: number;
  sale_price?: number;
  supplier_name?: string;
  notes?: string;
  sku?: string;
  barcode?: string;
  min_quantity?: number;
  brand?: string;
  compatible_model?: string;
  image_url?: string;
};

function num(value: any) {
  if (value === null || value === undefined || value === "") return 0;
  const cleaned = String(value).replace("R$", "").replace(/\./g, "").replace(",", ".").trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function text(value: any) {
  return String(value ?? "").trim();
}

export function normalizeStockRow(row: any): StockImportRow {
  const get = (...keys: string[]) => {
    for (const key of keys) {
      if (row[key] !== undefined) return row[key];
      const found = Object.keys(row).find(k => k.toLowerCase().trim() === key.toLowerCase().trim());
      if (found) return row[found];
    }
    return "";
  };

  return {
    name: text(get("nome", "name", "produto", "peça", "peca", "item", "descrição", "descricao")),
    category: text(get("categoria", "category", "grupo")),
    quantity: num(get("quantidade", "qtd", "quantity", "estoque")),
    cost: num(get("custo", "cost", "preço custo", "preco custo", "valor custo")),
    sale_price: num(get("venda", "preço venda", "preco venda", "sale_price", "valor venda", "preco")),
    supplier_name: text(get("fornecedor", "supplier", "supplier_name")),
    notes: text(get("observação", "observacao", "observações", "observacoes", "notes")),
    sku: text(get("sku", "codigo", "código", "cod")),
    barcode: text(get("codigo de barras", "código de barras", "barcode", "ean", "gtin")),
    min_quantity: num(get("estoque minimo", "estoque mínimo", "min_quantity", "mínimo", "minimo")),
    brand: text(get("marca", "brand")),
    compatible_model: text(get("modelo compatível", "modelo compativel", "compatible_model", "modelo")),
    image_url: text(get("imagem", "imagem_url", "image_url", "foto"))
  };
}

export const stockImportTemplateHeaders = [
  "nome",
  "categoria",
  "quantidade",
  "custo",
  "venda",
  "fornecedor",
  "observacao",
  "sku",
  "codigo de barras",
  "estoque minimo",
  "marca",
  "modelo compativel",
  "imagem_url"
];
