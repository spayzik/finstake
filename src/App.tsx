import ServiceCards from './components/ServiceCards';
import HeroGlass from './components/HeroGlass';
import QuickHelp from './components/QuickHelp';
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, BadgeCheck, Banknote, Check, CheckCircle2, ChevronDown, FileCheck2, Menu, MessageCircle, Plus, ShieldCheck, TrendingUp, X } from 'lucide-react';
import LeadForm from './components/LeadForm';
import CreditCalculator, { type CalculationPrefill } from './components/CreditCalculator';
import { resolveLeadConfig, type ServiceType } from './lib/lead';

const leadConfig = resolveLeadConfig({ endpoint: import.meta.env.VITE_LEAD_ENDPOINT, privacyPolicyVersion: import.meta.env.VITE_PRIVACY_POLICY_VERSION, privacyPolicyUrl: import.meta.env.VITE_PRIVACY_POLICY_URL });
const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;

function containDialogFocus(event: ReactKeyboardEvent<HTMLDialogElement>) {
  if (event.key !== 'Tab') return;
  const dialog = event.currentTarget;
  const controls = [...dialog.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')].filter(control => control.getClientRects().length > 0 && !control.closest('[inert], [hidden]'));
  const first = controls[0];
  const last = controls.at(-1);
  if (!first || !last) { event.preventDefault(); dialog.focus(); return; }
  const active = document.activeElement;
  if (event.shiftKey && (active === first || !controls.includes(active as HTMLElement))) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && (active === last || !controls.includes(active as HTMLElement))) { event.preventDefault(); first.focus(); }
}

const navigation = [
  ['Частным клиентам', '#personal'], ['Бизнесу', '#business'], ['Под залог', '#secured'],
  ['Рефинансирование', '#refinancing'], ['Как работаем', '#process'], ['О компании', '#about'],
];

function Brand({ light = false }: { light?: boolean }) {
  return <a className={`brand${light ? ' brand-light' : ''}`} href="#top" aria-label="FinStake — на главную">
    <img className="brand-mark" src={assetUrl('finstake-mark.png')} width="34" height="40" alt="" />
    <img className="brand-wordmark" src={assetUrl('finstake-wordmark.png')} width="120" height="24" alt="" />
  </a>;
}

function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduced = useReducedMotion();
  return <motion.div className={className} initial={reduced ? false : { opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>;
}

function Header({ onApply }: { onApply: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    update(); window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus(); } };
    const outside = (event: PointerEvent) => { if (!headerRef.current?.contains(event.target as Node)) setMenuOpen(false); };
    document.addEventListener('keydown', escape); document.addEventListener('pointerdown', outside);
    return () => { document.removeEventListener('keydown', escape); document.removeEventListener('pointerdown', outside); };
  }, [menuOpen]);
  return <header ref={headerRef} className={`site-header${scrolled ? ' is-scrolled' : ''}`}>
    <div className="container header-inner">
      <Brand />
      <nav className={`main-nav${menuOpen ? ' is-open' : ''}`} id="main-navigation" aria-label="Основная навигация">
        {navigation.map(([name, href]) => <a href={href} key={href} onClick={() => setMenuOpen(false)}>{name}</a>)}
        <button className="button mobile-nav-cta" onClick={() => { setMenuOpen(false); menuButton.current?.focus(); onApply(); }}>Оставить заявку <ArrowUpRight size={16} /></button>
      </nav>
      <button className="button header-cta" onClick={onApply}>Оставить заявку <ArrowUpRight size={15} /></button>
      <button ref={menuButton} className="icon-button menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'} aria-expanded={menuOpen} aria-controls="main-navigation">{menuOpen ? <X /> : <Menu />}</button>
    </div>
  </header>;
}

function Hero({ onApply }: { onApply: () => void }) {
  const reduced = useReducedMotion();
  const entrance = (delay: number) => ({ initial: reduced ? false as const : { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const } });
  return <section className="hero" aria-labelledby="hero-title">
    <motion.div className="hero-photo" aria-hidden="true" initial={reduced ? false : { opacity: .7, scale: 1.025 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .65, ease: [0.22, 1, 0.36, 1] }}><img src={assetUrl('images/hero-v2-1800.webp')} srcSet={`${assetUrl('images/hero-v2-960.webp')} 960w, ${assetUrl('images/hero-v2-1800.webp')} 1800w`} sizes="100vw" alt="" fetchPriority="high" width="1800" height="1029" /><div className="hero-photo-wash" /></motion.div>
    <div className="container hero-inner">
      <div className="hero-copy">
        <motion.p className="eyebrow hero-eyebrow" {...entrance(0)}><span className="status-dot" /> Кредитный брокер · без предоплаты</motion.p>
        <motion.h1 id="hero-title" {...entrance(0.06)}><span>Кредиты </span><span>для жизни </span><span className="hero-emphasis">и бизнеса.</span></motion.h1>
        <motion.p className="hero-description" {...entrance(0.12)}>Находим возможности получить больше. Подбираем условия под вашу ситуацию и сопровождаем весь путь — от документов до получения кредита.</motion.p>
        <motion.div className="hero-actions" {...entrance(0.18)}><button className="button" onClick={onApply}>Получить консультацию <ArrowUpRight size={18} /></button><a className="text-link hero-secondary" href="#calculator">Рассчитать кредит <ArrowUpRight size={16} /></a></motion.div>
        <motion.p className="hero-note" {...entrance(0.22)}><BadgeCheck size={17} /> Без предоплаты. Оплата после получения кредита.</motion.p>
      </div>
      <HeroGlass />
    </div>
    <div className="hero-bottom-label" aria-hidden="true"><span /> Больше возможностей для ваших планов.</div>
  </section>;
}

function ValueProposition() {
  const benefits = [
    { Icon: TrendingUp, title: 'Больше возможностей', text: 'Ищем потенциал вашей ситуации' },
    { Icon: Banknote, title: 'Без предоплаты', text: 'Вознаграждение после результата' },
    { Icon: FileCheck2, title: 'Кредитование под ключ', text: 'От документов до получения средств' },
    { Icon: ShieldCheck, title: 'Индивидуальный подход', text: 'Решение под ваши цели и возможности' },
  ];
  return <section className="benefits" aria-label="Преимущества FinStake"><div className="container benefits-grid">{benefits.map(({ Icon, title, text }) => <div className="benefit" key={title}><Icon size={23} strokeWidth={1.45} /><div><h2>{title}</h2><p>{text}</p></div></div>)}</div></section>;
}

function ProcessTimeline() {
  const steps = [
    ['Разберём вашу ситуацию', 'Оценим задачу, документы и возможности для получения нужной суммы.'],
    ['Подберём решение', 'Сравним подходящие варианты и выстроим план получения финансирования.'],
    ['Подготовим и оформим', 'Поможем собрать документы, проверить детали и пройти этапы оформления.'],
    ['Доведём до результата', 'Сопроводим до получения кредита. Затем вы оплачиваете нашу работу.'],
  ];
  return <section className="section process-section" id="process" aria-labelledby="process-title"><div className="container">
    <Reveal className="section-heading"><div><p className="eyebrow">Как мы работаем</p><h2 id="process-title">От вашей задачи —<br />до получения кредита.</h2></div><p className="section-intro">Ведём весь процесс и остаёмся рядом<br className="desktop-break" /> на каждом этапе.</p></Reveal>
    <ol className="process-grid">{steps.map(([title, text], index) => <li key={title} className="process-step"><Reveal delay={index * 0.09}><div className="step-top"><span className="step-number" aria-hidden="true">0{index + 1}</span><span className="step-line" />{index < 3 && <ChevronDown className="step-chevron" size={15} aria-hidden="true" />}</div><h3>{title}</h3><p>{text}</p></Reveal></li>)}</ol>
    <Reveal className="creditor-note"><BadgeCheck size={20} strokeWidth={1.5} /><p>Сопровождение продолжается до получения средств. <strong>Окончательную сумму и условия финансирования определяет банк.</strong></p></Reveal>
  </div></section>;
}

function SuccessFee({ onApply }: { onApply: () => void }) {
  return <section className="success-fee-section" id="payment" aria-labelledby="payment-title"><div className="container"><Reveal className="success-fee-panel"><div className="success-fee-copy"><p className="eyebrow"><span className="status-dot" /> Наш интерес совпадает с вашим</p><h2 id="payment-title">Сначала — результат.<br /><span>Потом — оплата.</span></h2><p>Вы оплачиваете нашу работу после получения кредита. Поэтому нам важно глубоко разобраться в вашей ситуации, найти подходящее решение и довести процесс до результата.</p><button className="success-fee-link" onClick={onApply}>Обсудить вашу ситуацию <ArrowUpRight size={18} aria-hidden="true" /></button></div><div className="success-fee-glass"><span className="success-fee-badge"><ShieldCheck size={19} aria-hidden="true" /> Прозрачный подход</span><div className="zero-advance"><strong>0 ₽</strong><span>предоплаты<br />за нашу работу</span></div><div className="success-fee-checks"><p><CheckCircle2 size={16} aria-hidden="true" /> Индивидуальный анализ вашей задачи</p><p><CheckCircle2 size={16} aria-hidden="true" /> Сопровождение до получения средств</p><p><CheckCircle2 size={16} aria-hidden="true" /> Вознаграждение после результата</p></div></div></Reveal></div></section>;
}

function Consultation({ onApply }: { onApply: () => void }) {
  return <section className="section consultation-section" id="about" aria-labelledby="consultation-title"><div className="container"><Reveal className="consultation-box">
    <div className="consultation-copy" id="consultation"><p className="eyebrow"><span className="status-dot" /> FinStake. На вашей стороне.</p><h2 id="consultation-title">Больше возможностей <br />начинается с разговора.</h2><p>Расскажите о вашей цели и текущей ситуации. Разберём, как получить нужную сумму, какие условия рассмотреть и с чего начать.</p><button className="button" onClick={onApply}>Разобрать мою ситуацию <ArrowUpRight size={18} /></button><div className="consultation-caption"><span className="caption-line" /> Личное сопровождение. Общий интерес к результату.</div></div>
    <div className="consultation-visual"><img src={assetUrl('images/consultation-v5-1200.webp')} srcSet={`${assetUrl('images/consultation-v5-600.webp')} 600w, ${assetUrl('images/consultation-v5-1200.webp')} 1200w`} sizes="(max-width: 700px) 100vw, 50vw" alt="Обсуждение документов на деловой встрече в светлом офисе" width="1200" height="984" loading="lazy" /><div className="consultation-image-label"><span className="small-icon"><MessageCircle size={19} strokeWidth={1.5} /></span><div><span>Сначала — разговор</span><p>Решение начинается с понимания</p></div></div></div>
  </Reveal><div className="about-line"><p>FinStake — независимое агентство кредитного брокерства.</p><span>Личные задачи. Бизнес-планы. Профессиональное сопровождение.</span></div></div></section>;
}

const questions = [
  ['Что означает кредитование под ключ?', 'Мы анализируем вашу ситуацию, подбираем подходящее кредитное решение, помогаем получить и подготовить документы, проходим вместе с вами этапы оформления и сопровождаем до получения средств. У вас есть понятный план и поддержка на всём пути.'],
  ['Поможете ли вы получить большую сумму?', 'Мы ищем возможность получить большую сумму с учётом вашей ситуации: анализируем документы, цели и доступные варианты финансирования. Итог зависит от требований и решения банка — заранее гарантировать увеличение суммы нельзя.'],
  ['Какие документы могут потребоваться?', 'Перечень зависит от задачи, вида финансирования и требований конкретного кредитора. На консультации уточним ситуацию и поможем определить необходимые материалы. Для первого обращения паспорт, СНИЛС и другие чувствительные документы не нужны.'],
  ['Когда и на каких условиях оплачиваются услуги?', 'Мы работаем без предоплаты. Вознаграждение за нашу работу вы оплачиваете после фактического получения кредита. Размер и детали оплаты уточняем на личной консультации. Такой подход связывает наш интерес с вашим результатом.'],
  ['Кто определяет окончательные условия?', 'Решение по кредиту, сумму, ставку и срок определяет банк после оценки заявки. Мы тщательно готовим документы и подбираем подходящее решение, чтобы раскрыть возможности вашей ситуации.'],
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const reduced = useReducedMotion();
  return <section className="section faq-section" id="faq" aria-labelledby="faq-title">
    <div className="container faq-layout">
      <Reveal><p className="eyebrow">Вопросы и ответы</p><h2 id="faq-title">Давайте проясним<br />важное</h2><p className="faq-intro">О нашей роли, документах <br />и процессе сопровождения.</p></Reveal>
      <Reveal className="faq-list">
        {questions.map(([question, answer], index) => <div className={`faq-item${open === index ? ' is-open' : ''}`} key={question}>
          <h3><button onClick={() => setOpen(open === index ? null : index)} aria-expanded={open === index} aria-controls={`faq-answer-${index}`} id={`faq-question-${index}`}>{question}<Plus size={20} strokeWidth={1.5} aria-hidden="true" /></button></h3>
          <div id={`faq-answer-${index}`} role="region" aria-labelledby={`faq-question-${index}`} aria-hidden={open !== index}>
            <AnimatePresence initial={false}>{open === index && <motion.div key={index} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: reduced ? 0 : 0.24 }} className="faq-answer"><p>{answer}</p></motion.div>}</AnimatePresence>
          </div>
        </div>)}
      </Reveal>
    </div>
  </section>;
}

function Footer({ onApply, onPrivacy }: { onApply: () => void; onPrivacy: () => void }) {
  return <footer className="site-footer"><div className="container">
    <div className="footer-main">
      <div className="footer-brand"><Brand /><p>На вашей стороне.<br />До получения кредита.</p></div>
      <nav className="footer-links" aria-label="Навигация в подвале"><a href="#services">Направления</a><a href="#calculator">Расчёт кредита</a><a href="#process">Как мы работаем</a><a href="#payment">Без предоплаты</a><a href="#about">О компании</a><a href="#faq">Вопросы и ответы</a></nav>
      <div className="footer-contact"><span>Начнём с вашей задачи</span><button onClick={onApply}>Обсудить финансирование <ArrowUpRight size={19} /></button></div>
    </div>
    <div className="footer-legal"><p>FinStake оказывает брокерские и консультационные услуги и не является кредитором. Решение о предоставлении финансирования принимает кредитор.</p><button onClick={onPrivacy}>Персональные данные <ArrowUpRight size={13} /></button></div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} FinStake</span><span>Ваш результат — наш общий интерес.</span><a href="#top">Наверх <ArrowUpRight size={14} /></a></div>
  </div></footer>;
}

export default function App() {
  const [leadService, setLeadService] = useState<ServiceType | null>(null);
  const [leadPrefill, setLeadPrefill] = useState<CalculationPrefill | undefined>();
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const leadDialog = useRef<HTMLDialogElement>(null);
  const privacyDialog = useRef<HTMLDialogElement>(null);
  const leadReturnFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (leadService && !leadDialog.current?.open) leadDialog.current?.showModal();
  }, [leadService]);
  useEffect(() => { if (privacyOpen && !privacyDialog.current?.open) privacyDialog.current?.showModal(); }, [privacyOpen]);
  useEffect(() => {
    if (!leadService && !privacyOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [leadService, privacyOpen]);
  const handleLeadClose = () => { setLeadService(null); requestAnimationFrame(() => leadReturnFocus.current?.focus({ preventScroll: true })); };
  const closeLead = () => leadDialog.current?.close();
  const closePrivacy = () => { privacyDialog.current?.close(); setPrivacyOpen(false); };
  const openLead = (service: ServiceType = 'personal', values?: CalculationPrefill) => { leadReturnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; setLeadPrefill(values); setLeadService(service); };
  return <><a href="#main" className="skip-link">Перейти к содержимому</a><div id="top" /><Header onApply={() => openLead()} /><main id="main"><Hero onApply={() => openLead()} /><ValueProposition /><CreditCalculator onDiscuss={values => openLead('personal', values)} /><ServiceCards onApply={openLead} /><SuccessFee onApply={() => openLead()} /><ProcessTimeline /><Consultation onApply={() => openLead()} /><FAQ /></main><Footer onApply={() => openLead()} onPrivacy={() => setPrivacyOpen(true)} />
    <QuickHelp onConsult={() => openLead()} hidden={Boolean(leadService || privacyOpen)} />
    {leadService && <dialog ref={leadDialog} className="lead-dialog" aria-labelledby="lead-form-title" onKeyDown={containDialogFocus} onClose={handleLeadClose}><LeadForm initialService={leadService} initialValues={leadPrefill} onClose={closeLead} onPrivacy={() => setPrivacyOpen(true)} /></dialog>}
    {privacyOpen && <dialog ref={privacyDialog} className="privacy-dialog" aria-labelledby="privacy-title" onKeyDown={containDialogFocus} onClose={() => setPrivacyOpen(false)}><div className="privacy-content"><button className="icon-button privacy-close" onClick={closePrivacy} aria-label="Закрыть информацию о персональных данных"><X size={22} /></button><span className="privacy-icon"><ShieldCheck size={27} strokeWidth={1.5} /></span><p className="eyebrow">Персональные данные</p>{leadConfig.mode === 'live' ? <><h2 id="privacy-title">Обработка данных<br />вашего обращения</h2><p>Перед отправкой ознакомьтесь с опубликованной политикой обработки персональных данных. В ней указаны оператор и условия обработки.</p><a className="button" href={leadConfig.privacyPolicyUrl} target="_blank" rel="noopener noreferrer">Открыть политику <ArrowUpRight size={17} /></a></> : <><h2 id="privacy-title">Ваши данные остаются<br />в этом браузере</h2><p>Приём реальных заявок отключён. Данные не отправляются на сервер, не передаются кредиторам и не сохраняются после закрытия формы.</p><p>Для подключения отправки необходимы оператор, контакты и утверждённая политика обработки персональных данных.</p><p className="privacy-small">Этот текст поясняет работу демоверсии и не заменяет юридическую политику.</p><button className="button" onClick={closePrivacy}>Понятно <Check size={17} /></button></>}</div></dialog>}
  </>;
}
