import { useMemo } from "react";
import katex from "katex";

interface Props {
  latex?: string;
  plainText?: string;
  description?: string;
  display?: boolean;
}

export default function FormulaBlock({ latex, plainText, description, display = true }: Props) {
  const html = useMemo(() => {
    const src = latex || plainText || "";
    if (!src) return "";
    try {
      return katex.renderToString(src, { displayMode: display, throwOnError: false, strict: false });
    } catch {
      return src;
    }
  }, [latex, plainText, display]);

  if (!latex && !plainText) return null;

  return (
    <div className="bg-[#1e1e28] border border-slate-700 border-l-4 border-l-teal-400 rounded-lg p-3 mb-3">
      {description && (
        <p className="text-xs text-slate-400 mb-2 font-medium">{description}</p>
      )}
      {html && (
        <div
          className="overflow-x-auto text-slate-100"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
      {!latex && plainText && (
        <code className="text-xs text-slate-400 font-mono mt-1 block">{plainText}</code>
      )}
      {latex && plainText && (
        <code className="text-xs text-slate-500 font-mono mt-2 block">{plainText}</code>
      )}
    </div>
  );
}
