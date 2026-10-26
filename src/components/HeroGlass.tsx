import { motion, useMotionValue, useSpring, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Check, FileCheck2, ScanLine } from 'lucide-react';

export default function HeroGlass() {
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateY = useSpring(x, { stiffness: 90, damping: 24 });
  const rotateX = useSpring(y, { stiffness: 90, damping: 24 });
  return <motion.div className="hero-sculpture" initial={reduced ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65, delay: .1 }} onPointerMove={event => {
    if (reduced || event.pointerType !== 'mouse') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - bounds.left - bounds.width / 2) / bounds.width * 9);
    y.set(-(event.clientY - bounds.top - bounds.height / 2) / bounds.height * 6);
  }} onPointerLeave={() => { x.set(0); y.set(0); }}>
    <div className="sculpture-ground" aria-hidden="true" />
    <motion.div className="sculpture-tilt" style={{ rotateY, rotateX }}>
      <div className="crystal-layer crystal-back" aria-hidden="true"><span className="crystal-line" /></div>
      <div className="crystal-layer crystal-middle" aria-hidden="true"><span className="crystal-line" /></div>
      <div className="crystal-layer crystal-front">
        <div className="crystal-brand"><span className="status-dot" /> FINSTAKE / НА ВАШЕЙ СТОРОНЕ <ArrowUpRight size={16} /></div>
        <div className="crystal-heading"><span className="crystal-check"><Check size={24} strokeWidth={1.5} /></span><p>Ваши планы.<br /><strong>Больше возможностей.</strong></p></div>
        <div className="crystal-route"><div><ScanLine size={17} /><span>Анализируем ситуацию</span></div><div><FileCheck2 size={17} /><span>Готовим документы</span></div><div><Check size={17} /><span>Сопровождаем до результата</span></div></div>
        <div className="crystal-caption"><span>Индивидуальное решение</span><span>01 — 03</span></div>
      </div>
      <div className="crystal-fee"><span className="fee-bars" aria-hidden="true"><i /><i /><i /><i /></span><p>Без предоплаты<strong>Оплата после<br />получения кредита</strong></p></div>
    </motion.div>
  </motion.div>;
}
