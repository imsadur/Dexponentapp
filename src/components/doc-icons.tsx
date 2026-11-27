import { File, FileCsv, FileDoc, FileImage, FilePdf, FilePpt, FileText, FileXls } from "@phosphor-icons/react";

/** File extension (PDF, DOCX…) from a name, falling back to the MIME subtype. */
export const docExt = (name: string, mime = "") => (name.includes(".") ? name.split(".").pop()! : mime.split("/").pop() || "file").toUpperCase();

/** Phosphor icon for a document type, so LPs can tell a PDF from a deck at a glance. */
export function DocIcon({ type, size = 20 }: { type: string; size?: number }) {
  const t = type.toUpperCase();
  const props = { size, "aria-hidden": true } as const;
  if (t === "PDF") return <FilePdf {...props} />;
  if (t === "DOC" || t === "DOCX") return <FileDoc {...props} />;
  if (t === "PPT" || t === "PPTX") return <FilePpt {...props} />;
  if (t === "XLS" || t === "XLSX") return <FileXls {...props} />;
  if (t === "CSV") return <FileCsv {...props} />;
  if (["PNG", "JPG", "JPEG", "GIF", "WEBP", "SVG"].includes(t)) return <FileImage {...props} />;
  if (t === "TXT") return <FileText {...props} />;
  return <File {...props} />;
}

/** Document types a manager can attach when creating a DTF. */
export const DOC_ACCEPT = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.webp";
