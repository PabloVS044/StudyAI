import React, { useState } from "react";
import TopBar from "../components/TopBar";
import { chatRag } from "../api/client";

interface Suggestion {
  icon: string;
  title: string;
  desc: string;
  bg: string;
  text: string;
}

interface Message {
  id: number;
  sender: "ai" | "user";
  content: string;
  suggestions?: Suggestion[];
}

interface Reference {
  title: string;
  icon: string;
  iconColor: string;
  excerpt: string;
  tags: string[];
}

function formatMarkdown(text: string): string {
  let formatted = text;

  // Escapar caracteres html básicos
  formatted = formatted
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bloques de código: ```lenguaje ... ```
  formatted = formatted.replace(
    /```(?:[a-zA-Z0-9]+)?\n([\s\S]*?)\n```/g,
    "<pre class='bg-surface-container-low rounded-xl p-3 font-mono text-sm my-3 overflow-x-auto border border-surface-variant'>$1</pre>"
  );

  // Código en línea: `código`
  formatted = formatted.replace(
    /`(.*?)`/g,
    "<code class='bg-surface-container px-1.5 py-0.5 rounded font-mono text-sm border border-surface-variant'>$1</code>"
  );

  // Texto en negrita: **texto**
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Saltos de línea
  formatted = formatted.replace(/\n/g, "<br />");

  return formatted;
}

export default function AIAssistantPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "ai",
      content: "¡Hola! Soy tu asistente de estudio inteligente de StudyAI. Tengo acceso a todos tus apuntes digitalizados y puedo ayudarte a resolver dudas, resumir conceptos complejos o repasar tus temas. ¿Sobre qué te gustaría estudiar hoy?",
      suggestions: [
        { icon: "school", title: "Explica la diferencia entre sinapsis química y eléctrica", desc: "Neurobiología clásica", bg: "bg-secondary-container", text: "text-on-secondary-container" },
        { icon: "assignment", title: "Genérame preguntas de práctica", desc: "Auto-evaluación rápida", bg: "bg-tertiary-container", text: "text-on-tertiary-container" },
        { icon: "troubleshoot", title: "Resume los puntos clave de mis apuntes", desc: "Análisis semántico de notas", bg: "bg-primary-container/20", text: "text-primary" },
      ],
    },
  ]);
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text) return;

    const userMessage: Message = {
      id: Date.now(),
      sender: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const data = await chatRag(text);

      const aiMessage: Message = {
        id: Date.now() + 1,
        sender: "ai",
        content: data.answer,
      };

      setMessages((prev) => [...prev, aiMessage]);

      if (data.sources && data.sources.length > 0) {
        const newRefs: Reference[] = data.sources.map((src) => ({
          title: src.title,
          icon: "description",
          iconColor: "text-primary",
          excerpt: `Coincidencia semántica con score de: ${src.score}`,
          tags: ["Nota", `ID: ${src.note_id.slice(0, 8)}`],
        }));
        setReferences(newRefs);
      }
    } catch (err) {
      const errorMessage: Message = {
        id: Date.now() + 1,
        sender: "ai",
        content: `Error al obtener respuesta del asistente: ${(err as Error).message}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <TopBar searchPlaceholder="Search across your notes..." />
      <main className="flex-1 ml-0 md:ml-64 h-[calc(100vh)] md:h-[calc(100vh-4rem)] md:mt-16 flex flex-col bg-surface overflow-hidden">
        {/* Workspace Header */}
        <div className="px-lg py-md border-b border-surface-container-high bg-surface flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0">
          <div>
            <h2 className="text-headline-lg text-on-surface">AI Assistant</h2>
            <p className="text-body-md text-on-surface-variant">Your integrated academic tutor. Ask anything about your materials.</p>
          </div>
          <div className="flex items-center gap-2 bg-surface-container-low p-1 rounded-lg border border-surface-variant shadow-sm">
            <span className="material-symbols-outlined text-on-surface-variant ml-2">tune</span>
            <select className="bg-transparent border-none text-body-md text-on-surface focus:ring-0 cursor-pointer py-1 pr-8">
              <option>Context: All Notes</option>
              <option selected>Context: StudyAI Notebook</option>
            </select>
          </div>
        </div>

        {/* Chat Workspace */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Side: Chat */}
          <div className="flex-1 flex flex-col min-w-0 border-r border-surface-container-high relative">
            {/* Chat Scroll Area */}
            <div className="flex-1 overflow-y-auto p-lg space-y-md custom-scrollbar">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-4 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.sender === "ai" ? "bg-primary shadow-sm" : "bg-surface-variant"
                  }`}>
                    {msg.sender === "ai" ? (
                      <span className="material-symbols-outlined text-on-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                    ) : (
                      <span className="material-symbols-outlined text-on-surface text-[20px]">person</span>
                    )}
                  </div>

                  <div className={`flex-1 max-w-3xl ${msg.sender === "user" ? "max-w-2xl" : ""}`}>
                    {msg.sender === "user" ? (
                      <div className="bg-surface-variant text-on-surface-variant rounded-2xl rounded-tr-sm p-4 shadow-sm">
                        <p className="text-body-md whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    ) : (
                      <div className="bg-surface-container-lowest border border-surface-variant shadow-sm rounded-2xl rounded-tl-sm p-md">
                        <p className="text-body-md text-on-surface mb-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }} />
                        {msg.suggestions && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                            {msg.suggestions.map((s, i) => (
                              <button
                                key={i}
                                onClick={() => handleSend(s.title)}
                                className="text-left p-3 rounded-xl border border-surface-variant hover:border-primary/50 hover:bg-primary-container/5 transition-all flex items-start gap-3 group"
                              >
                                <div className={`p-2 rounded-lg ${s.bg} ${s.text} group-hover:bg-primary group-hover:text-on-primary transition-colors flex-shrink-0`}>
                                  <span className="material-symbols-outlined text-[20px]">{s.icon}</span>
                                </div>
                                <div>
                                  <span className="block text-label-md text-on-surface mb-1">{s.title}</span>
                                  <span className="block text-caption text-on-surface-variant">{s.desc}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading State Indicator */}
              {loading && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-primary shadow-sm animate-pulse">
                    <span className="material-symbols-outlined text-on-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                  </div>
                  <div className="flex-1 max-w-3xl">
                    <div className="bg-surface-container-lowest border border-surface-variant shadow-sm rounded-2xl rounded-tl-sm p-md flex items-center gap-3">
                      <span className="text-body-md text-on-surface-variant font-medium">StudyAI está analizando tus apuntes y redactando la respuesta...</span>
                      <span className="flex gap-1 items-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="h-8" />
            </div>

            {/* Input Area */}
            <div className="p-md bg-surface border-t border-surface-container-high shadow-[0_-4px_16px_rgba(0,0,0,0.02)]">
              <div className="relative bg-surface-container-low rounded-2xl border border-surface-variant focus-within:border-primary focus-within:ring-1 focus-within:ring-primary shadow-sm transition-all">
                <textarea
                  className="w-full bg-transparent border-none resize-none p-4 pr-16 text-body-md text-on-surface focus:ring-0 placeholder-on-surface-variant/50"
                  placeholder="Escribe tus dudas, pide resúmenes o consulta sobre tus apuntes..."
                  rows={2}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <div className="absolute right-2 bottom-2 flex items-center gap-2">
                  <button
                    onClick={() => handleSend()}
                    disabled={loading || !input.trim()}
                    className="p-2 bg-primary text-on-primary rounded-full hover:bg-primary-container transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </div>
              </div>
              <div className="mt-2 text-center">
                <span className="text-caption text-outline">StudyAI puede cometer errores. Considera verificar la información importante.</span>
              </div>
            </div>
          </div>

          {/* Right Side: References */}
          <div className="hidden xl:flex w-80 flex-col bg-surface-container-lowest border-l border-surface-container-high overflow-y-auto">
            <div className="p-md border-b border-surface-variant sticky top-0 bg-surface-container-lowest/90 backdrop-blur z-10">
              <h3 className="text-headline-md text-on-surface">Active References</h3>
              <p className="text-caption text-on-surface-variant">Sources used in this conversation</p>
            </div>
            <div className="p-md space-y-4">
              {references.length === 0 ? (
                <div className="text-center py-8 px-4 border border-dashed border-outline-variant rounded-xl">
                  <span className="material-symbols-outlined text-outline text-3xl mb-2">find_in_page</span>
                  <p className="text-body-md text-on-surface-variant">No hay referencias activas.</p>
                  <p className="text-caption text-outline">Las referencias aparecerán aquí cuando StudyAI consulte tus apuntes.</p>
                </div>
              ) : (
                references.map((ref, i) => (
                  <div key={i} className="bg-surface rounded-xl border border-surface-variant p-3 shadow-sm hover:shadow-md transition-shadow cursor-default group">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`material-symbols-outlined ${ref.iconColor}`}>{ref.icon}</span>
                        <span className="text-label-md text-on-surface font-semibold">{ref.title}</span>
                      </div>
                    </div>
                    <p className="text-caption text-on-surface-variant">{ref.excerpt}</p>
                    <div className="mt-2 flex gap-1 flex-wrap">
                      {ref.tags.map((tag, j) => (
                        <span key={j} className="px-2 py-0.5 bg-surface-container rounded text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">{tag}</span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
