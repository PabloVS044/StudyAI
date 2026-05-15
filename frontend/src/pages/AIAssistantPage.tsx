import { useState } from "react";
import TopBar from "../components/TopBar";

const chatMessages = [
  {
    id: 1,
    sender: "ai",
    content: "Hello Pablo. I see we are focusing on <strong>Neurobiology 101</strong> today. I have access to your recent lectures, the textbook annotations, and the flashcards you created last week. What would you like to focus on?",
    suggestions: [
      { icon: "school", title: "Explain this simply", desc: "Break down complex topics", bg: "bg-secondary-container", text: "text-on-secondary-container" },
      { icon: "assignment", title: "Exam-style questions", desc: "Generate practice tests", bg: "bg-tertiary-container", text: "text-on-tertiary-container" },
      { icon: "troubleshoot", title: "Find knowledge gaps", desc: "Analyze my current notes", bg: "bg-primary-container/20", text: "text-primary" },
      { icon: "calendar_month", title: "Study plan", desc: "Organize next week's prep", bg: "bg-surface-variant", text: "text-on-surface-variant" },
    ],
  },
  {
    id: 2,
    sender: "user",
    content: "Can you explain Action Potentials simply? I'm having trouble understanding the depolarization phase.",
  },
  {
    id: 3,
    sender: "ai",
    content: "Think of an action potential like a stadium wave. It needs a trigger to start, but once it goes, it travels all the way around.",
    isComplex: true,
  },
];

const references = [
  {
    title: "Lecture 4 Transcript",
    icon: "description",
    iconColor: "text-secondary",
    excerpt: '"When we talk about the action potential, remember the threshold is king. At -55mV, the sodium channels..."',
    tags: ["Doc", "Neuro 101"],
  },
  {
    title: "Ch. 3: Cell Biology",
    icon: "book",
    iconColor: "text-tertiary",
    excerpt: "Diagram 3.4: Voltage-gated channels and membrane permeability during the depolarization phase.",
    tags: ["Textbook"],
  },
];

export default function AIAssistantPage() {
  const [input, setInput] = useState("");

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
              <option>Context: This Course</option>
              <option selected>Context: Neurobiology 101</option>
              <option>Context: This Document</option>
            </select>
          </div>
        </div>

        {/* Chat Workspace */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Side: Chat */}
          <div className="flex-1 flex flex-col min-w-0 border-r border-surface-container-high relative">
            {/* Chat Scroll Area */}
            <div className="flex-1 overflow-y-auto p-lg space-y-md custom-scrollbar">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex gap-4 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.sender === "ai" ? "bg-primary shadow-sm" : "bg-surface-variant"
                  }`}>
                    {msg.sender === "ai" ? (
                      <span className="material-symbols-outlined text-on-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                    ) : (
                      <div className="w-full h-full rounded-full bg-on-surface-variant overflow-hidden" />
                    )}
                  </div>

                  <div className={`flex-1 max-w-3xl ${msg.sender === "user" ? "max-w-2xl" : ""}`}>
                    {msg.sender === "user" ? (
                      <div className="bg-surface-variant text-on-surface-variant rounded-2xl rounded-tr-sm p-4 shadow-sm">
                        <p className="text-body-md">{msg.content}</p>
                      </div>
                    ) : msg.isComplex ? (
                      <div className="bg-secondary-container/20 border border-secondary-container/50 shadow-sm rounded-2xl rounded-tl-sm p-md space-y-6">
                        <p className="text-body-md text-on-surface mb-2">Think of an action potential like a stadium wave. It needs a trigger to start, but once it goes, it travels all the way around.</p>
                        <p className="text-body-md text-on-surface">Depolarization is that exact moment the wave starts going UP. Here is a breakdown based on your notes from Lecture 4:</p>

                        <div className="bg-surface-container-lowest rounded-xl border border-surface-variant p-4">
                          <div className="flex items-center gap-2 mb-3 border-b border-surface-variant pb-2">
                            <span className="material-symbols-outlined text-primary">key</span>
                            <h4 className="text-label-md text-on-surface uppercase tracking-wider">Key Concepts: Depolarization</h4>
                          </div>
                          <ul className="space-y-3">
                            {[
                              { num: 1, title: "The Threshold", desc: "The cell sits at -70mV. If a stimulus pushes it to -55mV (the threshold), the 'wave' officially starts." },
                              { num: 2, title: "Sodium Rush", desc: "Voltage-gated Sodium (Na+) channels snap open. Na+ rushes INTO the cell." },
                              { num: 3, title: "The Spike", desc: "The inside of the cell rapidly becomes positive (up to +40mV). This is the peak of depolarization." },
                            ].map((item) => (
                              <li key={item.num} className="flex gap-3">
                                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-caption font-bold flex-shrink-0">{item.num}</div>
                                <div>
                                  <strong className="text-body-md text-on-surface block">{item.title}</strong>
                                  <span className="text-body-md text-on-surface-variant">{item.desc}</span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex items-start gap-3 bg-tertiary-container/10 border border-tertiary-container/30 rounded-xl p-4">
                          <span className="material-symbols-outlined text-tertiary mt-1">lightbulb</span>
                          <div>
                            <h4 className="text-label-md text-tertiary mb-1">Recommendation</h4>
                            <p className="text-body-md text-on-surface-variant">You previously struggled with "Resting Potential". Want me to generate a quick comparison chart?</p>
                            <div className="mt-3 flex gap-2">
                              <button className="px-3 py-1.5 bg-surface-container rounded-lg text-label-md text-on-surface hover:bg-surface-container-high border border-surface-variant">Yes, show chart</button>
                              <button className="px-3 py-1.5 bg-surface-container rounded-lg text-label-md text-on-surface hover:bg-surface-container-high border border-surface-variant">Move to Repolarization</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-surface-container-lowest border border-surface-variant shadow-sm rounded-2xl rounded-tl-sm p-md">
                        <p className="text-body-md text-on-surface mb-4" dangerouslySetInnerHTML={{ __html: msg.content }} />
                        {msg.suggestions && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                            {msg.suggestions.map((s, i) => (
                              <button key={i} className={`text-left p-3 rounded-xl border border-surface-variant hover:border-primary/50 hover:bg-primary-container/5 transition-all flex items-start gap-3 group`}>
                                <div className={`p-2 rounded-lg ${s.bg} ${s.text} group-hover:bg-primary group-hover:text-on-primary transition-colors`}>
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
              <div className="h-8" />
            </div>

            {/* Input Area */}
            <div className="p-md bg-surface border-t border-surface-container-high shadow-[0_-4px_16px_rgba(0,0,0,0.02)]">
              <div className="relative bg-surface-container-low rounded-2xl border border-surface-variant focus-within:border-primary focus-within:ring-1 focus-within:ring-primary shadow-sm transition-all">
                <textarea
                  className="w-full bg-transparent border-none resize-none p-4 pr-16 text-body-md text-on-surface focus:ring-0 placeholder-on-surface-variant/50"
                  placeholder="Ask follow-up questions, request summaries, or paste text..."
                  rows={2}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <div className="absolute right-2 bottom-2 flex items-center gap-2">
                  <button className="p-2 text-on-surface-variant hover:text-primary rounded-full hover:bg-surface-variant transition-colors">
                    <span className="material-symbols-outlined">attach_file</span>
                  </button>
                  <button className="p-2 bg-primary text-on-primary rounded-full hover:bg-primary-container transition-colors shadow-sm">
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </div>
              </div>
              <div className="mt-2 text-center">
                <span className="text-caption text-outline">StudyFlow AI can make mistakes. Consider verifying important information.</span>
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
              {references.map((ref, i) => (
                <div key={i} className="bg-surface rounded-xl border border-surface-variant p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`material-symbols-outlined ${ref.iconColor}`}>{ref.icon}</span>
                      <span className="text-label-md text-on-surface">{ref.title}</span>
                    </div>
                    <span className="material-symbols-outlined text-outline-variant group-hover:text-primary">open_in_new</span>
                  </div>
                  <p className="text-caption text-on-surface-variant line-clamp-2">{ref.excerpt}</p>
                  <div className="mt-2 flex gap-1">
                    {ref.tags.map((tag, j) => (
                      <span key={j} className="px-2 py-0.5 bg-surface-container rounded text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
