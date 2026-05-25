import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './LandingPage.css';

gsap.registerPlugin(ScrollTrigger);

// ── Translations ─────────────────────────────────────────────────
const T = {
  en: {
    navHow: 'How it works', navFeat: 'Features', navTools: 'Tools', navPrice: 'Pricing',
    navLogin: 'Log in', navStart: 'Start for free',
    eyebrow: 'AI-Powered Learning',
    h1a: 'Study smarter,', h1b: 'not harder.',
    sub:  'Scan your physical notes, ask anything about your material, and let AI generate flashcards and concept maps for you.',
    cta1: 'Start for free', cta2: 'See how it works',
    fc1m: 'Scanning ',        fc1b: 'Biology notes',
    fc2m: 'Flashcard created ', fc2b: 'Photosynthesis',
    fc3m: 'Concept map ready ', fc3b: 'Cell Division',
    aboutTag: 'Platform',
    aboutH: 'StudyAI is an intelligent study companion',
    aboutHem: 'designed to help you master any subject',
    pcol1h: 'Smart scanning —', pcol1p: 'StudyAI reads your handwritten notes and extracts every concept, term, and relationship.',
    pcol2h: 'Always in context —', pcol2p: 'Every question you ask is answered using your own notes as the source of truth.',
    pcol3h: 'Fully connected —', pcol3p: 'Flashcards, maps and summaries all update automatically as your notes grow.',
    featTag: 'Features',
    featH: 'Study smarter', featHsuffix: ' with\nthe help of AI',
    featP: 'From scanning your first note to acing your exam, StudyAI will support you.',
    f1h: 'Scan your physical notes', f1hem: 'instantly',
    f1p: 'Point your camera at any notebook, textbook page, or whiteboard. StudyAI extracts text, identifies key concepts, and organizes everything into a searchable digital format.',
    f1lrn: 'Learn how scanning works →',
    f2h: 'AI-generated flashcards', f2hem: '& concept maps',
    f2p: 'After scanning, StudyAI automatically creates a full set of flashcards and a visual concept map. Review them with spaced repetition, or let the map guide your next study session.',
    f2lrn: 'Learn about spaced repetition →',
    toolsH: 'All the study tools you need', toolsHspan: 'in one place',
    ttab1: 'Review flashcards\nat your own pace',
    ttab2: 'Study multiple subjects\nsimultaneously',
    ttab3: 'Customize your\nstudy sessions',
    ctaTag: 'Get started',
    ctaH: 'Start studying smarter\ntoday',
    ctaP: 'Join thousands of students who already study with AI.',
    ctaB1: 'Start for free', ctaB2: 'View pricing',
  },
  es: {
    navHow: 'Cómo funciona', navFeat: 'Características', navTools: 'Herramientas', navPrice: 'Precios',
    navLogin: 'Iniciar sesión', navStart: 'Comenzar gratis',
    eyebrow: 'Aprendizaje con IA',
    h1a: 'Estudia más inteligente,', h1b: 'no más difícil.',
    sub:  'Escanea tus notas físicas, pregunta sobre tu material y deja que la IA genere flashcards y mapas conceptuales por ti.',
    cta1: 'Comenzar gratis', cta2: 'Ver cómo funciona',
    fc1m: 'Escaneando ',       fc1b: 'Notas de Biología',
    fc2m: 'Flashcard creada ', fc2b: 'Fotosíntesis',
    fc3m: 'Mapa listo ',       fc3b: 'División celular',
    aboutTag: 'Plataforma',
    aboutH: 'StudyAI es un compañero de estudio inteligente',
    aboutHem: 'diseñado para ayudarte a dominar cualquier materia',
    pcol1h: 'Escaneo inteligente —', pcol1p: 'StudyAI lee tus notas manuscritas y extrae cada concepto, término y relación.',
    pcol2h: 'Siempre en contexto —', pcol2p: 'Cada pregunta se responde usando tus propias notas como fuente de verdad.',
    pcol3h: 'Totalmente conectado —', pcol3p: 'Flashcards, mapas y resúmenes se actualizan automáticamente al crecer tus notas.',
    featTag: 'Características',
    featH: 'Estudia más inteligente', featHsuffix: ' con\nla ayuda de la IA',
    featP: 'Desde escanear tus primeras notas hasta aprobar tu examen, StudyAI estará contigo.',
    f1h: 'Escanea tus notas físicas', f1hem: 'al instante',
    f1p: 'Apunta tu cámara a cualquier cuaderno, libro de texto o pizarrón. StudyAI extrae el texto, identifica conceptos clave y organiza todo en un formato digital buscable.',
    f1lrn: 'Aprende cómo funciona el escaneo →',
    f2h: 'Flashcards y mapas', f2hem: 'generados por IA',
    f2p: 'Tras escanear, StudyAI crea automáticamente un conjunto completo de flashcards y un mapa conceptual visual. Repásalos con repetición espaciada.',
    f2lrn: 'Aprende sobre la repetición espaciada →',
    toolsH: 'Todas las herramientas de estudio', toolsHspan: 'en un solo lugar',
    ttab1: 'Repasa flashcards\na tu propio ritmo',
    ttab2: 'Estudia múltiples materias\nsimultáneamente',
    ttab3: 'Personaliza tus\nsesiones de estudio',
    ctaTag: 'Comenzar',
    ctaH: 'Empieza a estudiar\nmás inteligente hoy',
    ctaP: 'Únete a miles de estudiantes que ya estudian con IA.',
    ctaB1: 'Comenzar gratis', ctaB2: 'Ver precios',
  },
} as const;

type Lang = 'en' | 'es';

const moonSVG = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M12 8.4A6 6 0 0 1 5.6 2a6 6 0 1 0 6.4 6.4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
  </svg>
);
const sunSVG = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M7 1v1M7 12v1M1 7h1M12 7h1M2.9 2.9l.7.7M10.4 10.4l.7.7M10.4 3.6l-.7.7M3.6 10.4l-.7.7"
      stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

export default function LandingPage() {
  const rootRef     = useRef<HTMLDivElement>(null);
  const navRef      = useRef<HTMLElement>(null);
  const heroBodyRef = useRef<HTMLDivElement>(null);
  const floatsRef    = useRef<HTMLDivElement>(null);
  const navigate    = useNavigate();

  const [dark, setDark] = useState(false);
  const [lang, setLang] = useState<Lang>('en');
  const t = T[lang];

  useEffect(() => {
    const nav = navRef.current!;
    const onScroll = () => nav.classList.toggle('l-solid', window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const ctx = gsap.context(() => {
      // Hero entrance
      gsap.fromTo(heroBodyRef.current,
        { y: 48, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', delay: 0.2 }
      );
      gsap.fromTo(
        floatsRef.current!.children,
        { x: 56, opacity: 0, scale: 0.80, rotationY: 18, rotationX: -10 },
        {
          x: 0, opacity: 1, scale: 1, rotationY: -5, rotationX: 3,
          duration: 0.68, stagger: 0.38, delay: 1.0,
          ease: 'back.out(1.8)',
          transformPerspective: 900,
        }
      );

      // Scroll reveals
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
        gsap.fromTo(el,
          { y: 36, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.85, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 82%' } }
        );
      });

      // Feat rows split
      gsap.utils.toArray<HTMLElement>('.l-feat-row').forEach((row) => {
        const text = row.querySelector('.l-feat-text')!;
        const ui   = row.querySelector('.l-feat-ui')!;
        const st   = { trigger: row, start: 'top 76%' };
        gsap.fromTo(text, { x: -44, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: 'power2.out', scrollTrigger: st });
        gsap.fromTo(ui,   { x:  44, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: 'power2.out', delay: 0.12, scrollTrigger: st });
      });
    }, rootRef);

    return () => {
      window.removeEventListener('scroll', onScroll);
      ctx.revert();
      ScrollTrigger.getAll().forEach((s) => s.kill());
    };
  }, []);

  return (
    <div ref={rootRef} className={`landing-root${dark ? ' l-dark' : ''}`}>

      {/* ══ NAV ══ */}
      <nav ref={navRef} className="l-nav">
        <div className="l-logo">StudyAI</div>

        <ul className="l-nav-links">
          <li><a href="#about">{t.navHow}</a></li>
          <li><a href="#features">{t.navFeat}</a></li>
          <li><a href="#tools">{t.navTools}</a></li>
          <li><a href="#cta">{t.navPrice}</a></li>
        </ul>

        <div className="l-nav-actions">
          <button className="l-btn-ghost" onClick={() => navigate('/dashboard')}>{t.navLogin}</button>
          <button className="l-btn-accent" onClick={() => navigate('/dashboard')}>{t.navStart}</button>
          <button className="l-icon-btn" onClick={() => setLang(l => l === 'en' ? 'es' : 'en')}>
            {lang === 'en' ? 'ES' : 'EN'}
          </button>
          <button className="l-icon-btn" title="Toggle theme" onClick={() => setDark(d => !d)}>
            {dark ? sunSVG : moonSVG}
          </button>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section className="l-hero">
        <video autoPlay muted loop playsInline className="l-hero-video">
          <source src="/videos/hero.mp4" type="video/mp4" />
        </video>
        <div className="l-hero-overlay" />

        <div ref={heroBodyRef} className="l-hero-body">
          <p className="l-eyebrow">{t.eyebrow}</p>
          <h1>{t.h1a}<br />{t.h1b}</h1>
          <p>{t.sub}</p>
          <div className="l-hero-btns">
            <button className="l-btn-primary" onClick={() => navigate('/dashboard')}>{t.cta1}</button>
            <a href="#about" className="l-btn-ghost-hero">{t.cta2}</a>
          </div>
        </div>

        <div ref={floatsRef} className="l-hero-floats">
          <div className="l-float-card">
            <span className="l-fc-dot l-dot-red" />
            <span className="l-fc-muted">{t.fc1m}</span><span className="l-fc-bold">{t.fc1b}</span>
          </div>
          <div className="l-float-card">
            <span className="l-fc-dot l-dot-green" />
            <span className="l-fc-muted">{t.fc2m}</span><span className="l-fc-bold">{t.fc2b}</span>
          </div>
          <div className="l-float-card">
            <span className="l-fc-dot l-dot-green" />
            <span className="l-fc-muted">{t.fc3m}</span><span className="l-fc-bold">{t.fc3b}</span>
          </div>
        </div>
        <div className="l-hero-overlay-bot" />
      </section>

      {/* ══ ABOUT ══ */}
      <section className="l-about" id="about">
        <div className="l-section-hdr" data-reveal>
          <span className="l-tag">{t.aboutTag}</span>
          <h2>{t.aboutH}<br /><em>{t.aboutHem}</em></h2>
        </div>

        <div className="l-platform-mockup" data-reveal>
          <div className="l-mock-panel">
            <div className="l-mock-bar">
              <div className="l-mock-dots"><span /><span /><span /></div>
              <span className="l-mock-label">My Notes — Concept Map</span>
              <span className="l-mock-pct">60%</span>
            </div>
            <div className="l-cmap-wrap">
              <svg className="l-cmap-svg" viewBox="0 0 460 290" xmlns="http://www.w3.org/2000/svg">
                <ellipse className="l-cm-orbit" cx="230" cy="145" rx="150" ry="108" />
                <line className="l-cm-line" x1="230" y1="145" x2="230" y2="50" />
                <line className="l-cm-line" x1="230" y1="145" x2="230" y2="246" />
                <line className="l-cm-line" x1="230" y1="145" x2="80"  y2="145" />
                <line className="l-cm-line" x1="230" y1="145" x2="380" y2="145" />
                <line className="l-cm-line" x1="230" y1="145" x2="335" y2="65" />
                <line className="l-cm-line" x1="230" y1="145" x2="115" y2="230" />
                <rect className="l-cm-node-rect l-cm-center" x="190" y="128" width="80"  height="34" rx="6" />
                <text className="l-cm-node-text l-cm-text-center" x="230" y="145">Photosynthesis</text>
                <rect className="l-cm-node-rect" x="181" y="32"  width="98" height="28" rx="6" />
                <text className="l-cm-node-text" x="230" y="46">Light Reactions</text>
                <rect className="l-cm-node-rect" x="181" y="232" width="98" height="28" rx="6" />
                <text className="l-cm-node-text" x="230" y="246">Calvin Cycle</text>
                <rect className="l-cm-node-rect" x="28"  y="131" width="90" height="28" rx="6" />
                <text className="l-cm-node-text" x="73"  y="145">Chlorophyll</text>
                <rect className="l-cm-node-rect" x="330" y="131" width="80" height="28" rx="6" />
                <text className="l-cm-node-text" x="370" y="145">Glucose</text>
                <rect className="l-cm-node-rect" x="298" y="50"  width="74" height="28" rx="6" />
                <text className="l-cm-node-text" x="335" y="64">ATP / NADPH</text>
                <rect className="l-cm-node-rect" x="58"  y="216" width="72" height="28" rx="6" />
                <text className="l-cm-node-text" x="94"  y="230">CO₂ + H₂O</text>
              </svg>
            </div>
          </div>

          <div className="l-mock-panel">
            <div className="l-mock-bar l-mock-bar-tabs">
              <span className="l-tab-pill l-tab-act">Home</span>
              <span className="l-tab-pill">Notes</span>
              <span className="l-tab-pill">Flashcards</span>
              <span className="l-tab-pill">Maps</span>
            </div>
            <div className="l-chat-wrap">
              <div className="l-chat-msgs">
                <div className="l-msg l-msg-user">What are the two main stages of photosynthesis?</div>
                <div className="l-msg l-msg-ai">
                  There are two main stages: the <strong>light-dependent reactions</strong>, which occur in
                  the thylakoid membranes and capture solar energy to produce ATP and NADPH — and the{' '}
                  <strong>Calvin cycle</strong>, which uses that energy to fix CO₂ into glucose.
                </div>
                <div className="l-msg-agent">
                  <span className="l-badge l-badge-run">Running</span>
                  <span>Flashcard Agent — Creating 3 cards from this topic</span>
                </div>
              </div>
              <div className="l-chat-input-row">
                <input className="l-chat-input" placeholder="Ask StudyAI about your notes…" readOnly />
                <button className="l-chat-send">↑</button>
              </div>
            </div>
          </div>
        </div>

        <div className="l-platform-cols" data-reveal>
          <div className="l-pcol"><h4><span>{t.pcol1h}</span> {t.pcol1p}</h4></div>
          <div className="l-pcol"><h4><span>{t.pcol2h}</span> {t.pcol2p}</h4></div>
          <div className="l-pcol"><h4><span>{t.pcol3h}</span> {t.pcol3p}</h4></div>
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section className="l-features" id="features">
        <div className="l-feats-hdr" data-reveal>
          <span className="l-tag">{t.featTag}</span>
          <h2><strong>{t.featH}</strong>{t.featHsuffix.split('\n').map((line, i) => i === 0 ? line : <><br key={i}/>{line}</>)}</h2>
          <p>{t.featP}</p>
        </div>

        <div className="l-feat-row">
          <div className="l-feat-text">
            <div className="l-feat-icon">📷</div>
            <h3>{t.f1h}<br /><em>{t.f1hem}</em></h3>
            <p>{t.f1p}</p>
            <a className="l-feat-learn" href="#"><strong>Learn</strong> {t.f1lrn}</a>
          </div>
          <div className="l-feat-ui">
            <div className="l-fui-bar">
              <div className="l-fui-dots"><span /><span /><span /></div>
              <span className="l-fui-title">Scan &amp; Import</span>
            </div>
            <div className="l-fui-body">
              <div className="l-scan-drop">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <rect x="3" y="3" width="22" height="22" rx="4" stroke="currentColor" strokeOpacity=".3" strokeWidth="1.5" strokeDasharray="4 3"/>
                  <path d="M14 10v8M10 14h8" stroke="currentColor" strokeOpacity=".4" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Drop a photo or take a picture of your notes
              </div>
              <div className="l-scan-chips">
                {[
                  { title: 'Cell Biology',      sub: '14 concepts extracted' },
                  { title: 'Organic Chemistry', sub: '9 formulas found' },
                  { title: 'History — WW2',     sub: '22 key dates' },
                ].map((c) => (
                  <div key={c.title} className="l-scan-chip">
                    <div className="l-chip-title">{c.title}</div>
                    <div className="l-chip-sub">{c.sub}</div>
                  </div>
                ))}
              </div>
              <div className="l-scan-progress">
                <span>Processing Biology notes…</span>
                <div className="l-prog-bar"><div className="l-prog-fill" /></div>
                <span className="l-prog-pct">72%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="l-feat-row">
          <div className="l-feat-text">
            <div className="l-feat-icon">🃏</div>
            <h3>{t.f2h}<br /><em>{t.f2hem}</em></h3>
            <p>{t.f2p}</p>
            <a className="l-feat-learn" href="#"><strong>Learn</strong> {t.f2lrn}</a>
          </div>
          <div className="l-feat-ui">
            <div className="l-fui-bar">
              <div className="l-fui-dots"><span /><span /><span /></div>
              <span className="l-fui-title">Flashcard Review — Biology</span>
            </div>
            <div className="l-fui-body">
              <div className="l-fc-progress">Card 4 of 24 · 3 remaining today</div>
              <div className="l-fc-stack">
                <div className="l-fc-card l-fc-back" />
                <div className="l-fc-card l-fc-front">
                  <div className="l-fc-tag">Light Reactions</div>
                  <div className="l-fc-q">Where do the light-dependent reactions of photosynthesis occur?</div>
                  <div className="l-fc-a">In the thylakoid membranes of the chloroplast, where light energy is captured and converted into ATP and NADPH.</div>
                </div>
              </div>
              <div className="l-fc-actions">
                <button className="l-fc-btn l-fc-wrong">Missed it</button>
                <button className="l-fc-btn l-fc-right">Got it</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ TOOLS ══ */}
      <section className="l-tools" id="tools">
        <video autoPlay muted loop playsInline className="l-tools-video">
          <source src="/videos/section.mp4" type="video/mp4" />
        </video>
        <div className="l-tools-overlay-top" />
        <div className="l-tools-overlay-bot" />

        <div className="l-tools-content" data-reveal>
          <div className="l-tools-hdr">
            <h2>{t.toolsH}<br /><span>{t.toolsHspan}</span></h2>
          </div>
          <div className="l-tools-tabs">
            {[t.ttab1, t.ttab2, t.ttab3].map((label, i) => (
              <button key={i} className={`l-ttab${i === 0 ? ' l-ttab-act' : ''}`}>
                {label.split('\n').map((line, j) => j === 0 ? line : <><br key={j}/>{line}</>)}
              </button>
            ))}
          </div>
          <div className="l-tools-card-wrap">
            <div className="l-tools-card">
              <div className="l-tc-tabs">
                {['All Subjects', 'Biology', 'History', 'Chemistry', 'Math'].map((tab, i) => (
                  <button key={tab} className={`l-tc-tab${i === 0 ? ' l-tc-act' : ''}`}>{tab}</button>
                ))}
              </div>
              <div className="l-status-group">
                <span className="l-lbl l-lbl-review">● Ready to review</span>
                {['Photosynthesis — light reactions', 'Cell membrane structure'].map((s) => (
                  <div key={s} className="l-si"><span>{s}</span><span className="l-si-r">Study Agent</span></div>
                ))}
                <span className="l-lbl l-lbl-run">● In progress</span>
                <div className="l-si"><span>World War II timeline</span><span className="l-si-r">Study Agent</span></div>
                <span className="l-lbl l-lbl-done">● Completed</span>
                {['Periodic table groups', 'Quadratic equations'].map((s) => (
                  <div key={s} className="l-si"><span>{s}</span><span className="l-si-r">Study Agent</span></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section className="l-cta" id="cta">
        <span className="l-tag" data-reveal>{t.ctaTag}</span>
        <h2 data-reveal>{t.ctaH.split('\n').map((line, i) => i === 0 ? line : <><br key={i}/>{line}</>)}</h2>
        <p data-reveal>{t.ctaP}</p>
        <div className="l-cta-row" data-reveal>
          <button className="l-cta-primary" onClick={() => navigate('/dashboard')}>{t.ctaB1}</button>
          <button className="l-btn-outline">{t.ctaB2}</button>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="l-footer">
        <div className="l-footer-logo">StudyAI</div>
        <nav className="l-footer-links">
          {['Features', 'Pricing', 'Blog', 'Privacy', 'Terms'].map((l) => (
            <a key={l} href="#">{l}</a>
          ))}
        </nav>
        <div className="l-footer-copy">© 2026 StudyAI</div>
      </footer>
    </div>
  );
}
