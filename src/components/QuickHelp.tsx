import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, ChevronLeft, MessageCircle, X } from 'lucide-react';

const questions = [
  { title: 'Как вы помогаете?', answer: 'Анализируем вашу ситуацию, подбираем подходящие решения, помогаем собрать и оформить документы и сопровождаем до получения кредита. FinStake — независимый кредитный брокер.' },
  { title: 'Нужна ли предоплата?', answer: 'Предоплаты нет. Вы оплачиваете нашу работу после получения кредита. Размер вознаграждения и условия сопровождения согласовываем до начала работы.' },
  { title: 'Можно получить больше?', answer: 'Мы изучаем вашу задачу и возможности, чтобы найти варианты получения нужной суммы. Окончательную сумму, ставку и решение определяет кредитор; гарантировать одобрение нельзя.' },
  { title: 'Какие нужны документы?', answer: 'Состав зависит от задачи и выбранной программы. Могут понадобиться документы о личности, доходе, бизнесе или обеспечении. На первой консультации уточним список; здесь документы загружать не нужно.' },
  { title: 'Как работает калькулятор?', answer: 'Укажите сумму, срок до 30 лет и ставку для расчёта. Можно сравнить равные и убывающие платежи. Расчёт предварительный, без страховки, комиссий и вознаграждения брокера; это не предложение банка.' },
];

export default function QuickHelp({ onConsult, hidden }: { onConsult: () => void; hidden: boolean }) {
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const answerTitle = useRef<HTMLHeadingElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => { if (open && !hidden) closeButton.current?.focus(); }, [open, hidden]);
  useEffect(() => { if (selected !== null) answerTitle.current?.focus({ preventScroll: true }); }, [selected]);
  function close() { setOpen(false); trigger.current?.focus(); }
  if (hidden) return null;
  return <aside className="quick-help" aria-label="Помощь по сайту">
    <AnimatePresence>
      {open && <motion.section key="panel" id="quick-help-panel" className="help-panel" role="region" aria-labelledby="help-title" initial={{ opacity: 0, y: reduced ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : 8 }} transition={{ duration: .22 }} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); close(); } }}>
        <header className="help-header"><span className="help-symbol"><MessageCircle size={20} /></span><div><h2 id="help-title">Помощник FinStake</h2><p>Коротко о важном</p></div><button ref={closeButton} className="help-icon-button" aria-label="Закрыть помощника" onClick={close}><X size={19} /></button></header>
        <div className="help-body"><p className="help-intro">Помогу разобраться, с чего начать.<br />Выберите интересующий вопрос.</p>
          {selected === null ? <div className="help-questions">{questions.map((question, index) => <button key={question.title} onClick={() => setSelected(index)}>{question.title}<ArrowUpRight size={15} /></button>)}</div> : <><button className="help-back" onClick={() => setSelected(null)}><ChevronLeft size={15} /> Все вопросы</button><AnimatePresence mode="wait"><motion.div key={selected} initial={{ opacity: 0, y: reduced ? 0 : 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .18 }} className="help-answer" role="status"><h3 ref={answerTitle} tabIndex={-1}>{questions[selected].title}</h3><p>{questions[selected].answer}</p></motion.div></AnimatePresence></>}
          <button className="button help-consult" onClick={() => { setOpen(false); onConsult(); }}>Обсудить мою задачу <ArrowUpRight size={17} /></button><p className="help-disclosure">Автоматические ответы о сервисе.<br />Индивидуальные вопросы разберём на консультации.</p>
        </div>
      </motion.section>}
    </AnimatePresence>
    {!open && hint && <div className="help-hint"><button onClick={() => { setOpen(true); setHint(false); }}>Есть вопрос?<span>Подскажу, с чего начать</span></button><button className="help-hint-close" aria-label="Скрыть подсказку" onClick={() => setHint(false)}><X size={13} /></button></div>}
    <button ref={trigger} className="help-trigger" aria-label={open ? 'Закрыть помощника' : 'Открыть помощника FinStake'} aria-expanded={open} aria-controls="quick-help-panel" onClick={() => { if (open) close(); else { setOpen(true); setHint(false); } }}>{open ? <X size={23} /> : <MessageCircle size={24} />}</button>
  </aside>;
}
