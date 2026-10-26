import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Check, Plus, ShieldCheck, FileCheck2, Handshake } from 'lucide-react';
import type { ServiceType } from '../lib/lead';

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;
const services: { id: ServiceType; title: string; description: string; alt: string; label: string; tasks: string[]; approach: string; clarify: string }[] = [
  { id: 'personal', title: 'Частным клиентам', description: 'Личные планы с понятным финансовым решением.', alt: 'Пара обсуждает домашние планы за ноутбуком и документами', label: 'Для ваших планов', tasks: ['Крупные покупки, ремонт и другие личные цели', 'Поиск возможностей получить нужную сумму', 'Сравнение условий с учётом текущих обязательств'], approach: 'Разбираем доходы, действующие обязательства и вашу цель. Подбираем подходящие варианты, помогаем с документами и оформлением.', clarify: 'Желаемую сумму, срок, подтверждение дохода и комфортный платёж.' },
  { id: 'business', title: 'Для бизнеса', description: 'Финансирование с учётом задач и возможностей бизнеса.', alt: 'Участники деловой встречи обсуждают документы в светлом офисе', label: 'Для роста и развития', tasks: ['Оборотные средства и сезонные расходы', 'Оборудование, развитие и инвестиционные задачи', 'Подготовка бизнеса к обращению за финансированием'], approach: 'Анализируем задачу и финансовую ситуацию бизнеса. Выстраиваем план, помогаем подготовить материалы и сопровождаем оформление.', clarify: 'Цель, срок работы бизнеса, обороты, обязательства и документы.' },
  { id: 'secured', title: 'Под залог', description: 'Возможности финансирования с обеспечением.', alt: 'Жилой загородный дом с садом и освещёнными окнами', label: 'С опорой на активы', tasks: ['Рассмотрение финансирования под обеспечение', 'Оценка вариантов с учётом объекта и задачи', 'Подготовка документов по выбранной программе'], approach: 'Разбираем вашу ситуацию и характеристики обеспечения. Объясняем этапы, помогаем с документами и сопровождаем процесс оформления.', clarify: 'Вид объекта, право собственности, обременения и условия залога. Важно оценить риск утраты имущества при невыполнении обязательств.' },
  { id: 'refinancing', title: 'Рефинансирование', description: 'Посмотрим на текущие обязательства по-новому.', alt: 'Совместный разбор финансовых документов за столом', label: 'Для новых условий', tasks: ['Сравнение текущих и возможных новых условий', 'Оценка объединения нескольких обязательств', 'Проверка полной стоимости изменения кредита'], approach: 'Сравниваем платежи, оставшийся срок и общие расходы. Помогаем понять, есть ли смысл менять условия, и сопровождаем выбранный путь.', clarify: 'Остаток долга, ставку, график платежей, комиссии и дополнительные расходы. Снижение платежа не всегда означает меньшую переплату.' },
];

export default function ServiceCards({ onApply }: { onApply: (service: ServiceType) => void }) {
  const [expanded, setExpanded] = useState<Set<ServiceType>>(new Set());
  const reduced = useReducedMotion();
  function toggle(id: ServiceType) { setExpanded(previous => { const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next; }); }
  return <section className="section services-section" id="services" aria-labelledby="services-title"><div className="container">
    <div className="section-heading"><div><p className="eyebrow">Направления финансирования</p><h2 id="services-title">Сначала — разберёмся.<br />Затем — выберем решение.</h2></div><p className="section-intro">Раскройте подходящее направление.<br />Расскажем, с чем и как помогаем.</p></div>
    <div className="services-grid service-accordion-grid">{services.map(service => { const open = expanded.has(service.id); return <article key={service.id} className={`service-card service-expandable${open ? ' service-expanded' : ''}`} id={service.id}>
      <h3 className="service-card-heading"><button className="service-summary" onClick={() => toggle(service.id)} aria-expanded={open} aria-controls={`service-details-${service.id}`} id={`service-toggle-${service.id}`} aria-label={`${service.title} — ${open ? 'свернуть' : 'подробнее'}`}>
        <span className={`service-image service-image-${service.id}`}><img src={asset(`images/${service.id}-v5-800.webp`)} srcSet={`${asset(`images/${service.id}-v5-480.webp`)} 480w, ${asset(`images/${service.id}-v5-800.webp`)} 800w`} sizes="(max-width: 700px) 100vw, (max-width: 1000px) 50vw, 25vw" alt={service.alt} width="800" height="600" loading="lazy" /><span className="image-label">{service.label}</span></span>
        <span className="service-summary-copy"><span className="service-summary-title">{service.title}<Plus size={19} className="service-expand-icon" aria-hidden="true" /></span><span className="service-summary-description">{service.description}</span><span className="service-summary-more">{open ? 'Свернуть описание' : 'Подробнее о решении'}<span aria-hidden="true">{open ? '−' : '+'}</span></span></span>
      </button></h3>
      <div id={`service-details-${service.id}`} role="region" aria-labelledby={`service-toggle-${service.id}`} aria-hidden={!open} inert={!open}>
        <AnimatePresence initial={false}>{open && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: reduced ? 0 : .24 }} className="service-reveal"><div className="service-details-inner">
          <h4>С какими задачами помогаем</h4><ul>{service.tasks.map(task => <li key={task}><Check size={14} aria-hidden="true" /><span>{task}</span></li>)}</ul>
          <h4>Как подходим к решению</h4><p>{service.approach}</p><div className="service-clarify"><h4>Что уточним на консультации</h4><p>{service.clarify}</p></div>
          <p className="service-terms-note">Без предоплаты. Условия сопровождения согласуем заранее. Окончательные условия финансирования определяет кредитор.</p>
          <button className="button service-contact" onClick={() => onApply(service.id)}>Обсудить мою задачу<ArrowUpRight size={17} aria-hidden="true" /></button>
        </div></motion.div>}</AnimatePresence>
      </div>
    </article>; })}</div>
    <div className="trust-explainer"><div className="trust-heading"><p className="eyebrow">Понятно до начала работы</p><h3>Доверие начинается<br />с ясных условий.</h3></div><div className="trust-items">
      <div><FileCheck2 size={22} strokeWidth={1.5} /><h4>Понимаете план</h4><p>Объясняем, какие документы понадобятся и что происходит на каждом этапе.</p></div>
      <div><Handshake size={22} strokeWidth={1.5} /><h4>Знаете условия</h4><p>Согласуем объём работы и вознаграждение заранее. Оплата — после получения кредита.</p></div>
      <div><ShieldCheck size={22} strokeWidth={1.5} /><h4>Принимаете решение</h4><p>Разбираем условия и расходы. Вы выбираете подходящий вариант без обещаний гарантированного одобрения.</p></div>
    </div></div>
    <p className="service-photo-note">Фотографии иллюстрируют жизненные ситуации и направления работы.</p>
  </div></section>;
}
