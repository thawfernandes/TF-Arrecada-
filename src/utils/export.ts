// ============================================================
// TF Arrecada+ | Export Utility
// Estrutura preparada para exportação futura de dados (JSON/CSV/Excel)
// ============================================================

export interface ExportableData {
  filename: string;
  data: any[];
  headers?: string[];
}

/**
 * Converte um array de objetos em string CSV.
 */
function convertToCSVString(data: any[], headers?: string[]): string {
  if (data.length === 0) return '';
  
  const targetHeaders = headers || Object.keys(data[0]);
  const csvRows = [];
  
  // Adiciona cabeçalhos
  csvRows.push(targetHeaders.join(','));
  
  // Adiciona linhas
  for (const row of data) {
    const values = targetHeaders.map(header => {
      const val = row[header];
      const escaped = ('' + (val ?? '')).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

/**
 * Dispara o download de um arquivo no navegador.
 */
function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exporta dados para o formato JSON.
 */
export function exportToJSON({ filename, data }: ExportableData) {
  const jsonContent = JSON.stringify(data, null, 2);
  triggerDownload(jsonContent, `${filename}.json`, 'application/json;charset=utf-8;');
}

/**
 * Exporta dados para o formato CSV.
 */
export function exportToCSV({ filename, data, headers }: ExportableData) {
  const csvContent = convertToCSVString(data, headers);
  // BOM para garantir que o Excel abra com acentuação correta em UTF-8
  const BOM = '\uFEFF';
  triggerDownload(BOM + csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Exporta dados para o formato Excel (stub/preparado para biblioteca externa).
 * Por enquanto, exporta como um CSV compatível que o Excel lê automaticamente.
 */
export function exportToExcel({ filename, data, headers }: ExportableData) {
  console.warn('[TF Arrecada+] Exportação direta para Excel utilizará CSV compatível nesta versão.');
  exportToCSV({ filename, data, headers });
}
