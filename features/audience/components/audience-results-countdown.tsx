"use client";



import { AnimatePresence, motion } from "framer-motion";

import { getAudienceResultsCountdownLabel } from "@/features/audience/audience-results-countdown";



interface AudienceResultsCountdownProps {

  remaining: number;

  progress: number;

  eyebrow?: string;

  title?: string;

  subtitle?: string;

}



export function AudienceResultsCountdown({

  remaining,

  progress,

  eyebrow = "النتائج قادمة",

  title = "استعدوا للنتائج",

  subtitle = "سيُعرض ترتيب الفرق خلال لحظات",

}: AudienceResultsCountdownProps) {

  const label = getAudienceResultsCountdownLabel(remaining);

  const ringDegrees = Math.min(360, Math.max(0, progress * 360));



  return (

    <section className="audience-results-countdown competition-stage-screen competition-stage-screen--animated">

      <motion.div

        className="audience-results-countdown__card glass-card-white"

        initial={{ opacity: 0, y: 24, scale: 0.96 }}

        animate={{ opacity: 1, y: 0, scale: 1 }}

        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}

      >

        <motion.span

          className="audience-results-countdown__eyebrow"

          initial={{ opacity: 0, y: 8 }}

          animate={{ opacity: 1, y: 0 }}

          transition={{ delay: 0.08, duration: 0.32 }}

        >

          {eyebrow}

        </motion.span>



        <motion.h2

          className="audience-results-countdown__title"

          initial={{ opacity: 0, y: 10 }}

          animate={{ opacity: 1, y: 0 }}

          transition={{ delay: 0.14, duration: 0.36 }}

        >

          {title}

        </motion.h2>



        <motion.p

          className="audience-results-countdown__subtitle"

          initial={{ opacity: 0, y: 8 }}

          animate={{ opacity: 1, y: 0 }}

          transition={{ delay: 0.2, duration: 0.32 }}

        >

          {subtitle}

        </motion.p>



        <div className="audience-results-countdown__ring-wrap" aria-live="polite" aria-atomic="true">

          <div

            className="audience-results-countdown__ring"

            style={{

              background: `conic-gradient(#4f8a10 ${ringDegrees}deg, rgba(35, 136, 196, 0.14) 0deg)`,

            }}

            aria-hidden

          />

          <div className="audience-results-countdown__ring-hole" aria-hidden />



          <motion.div

            className="audience-results-countdown__pulse"

            animate={{ scale: [1, 1.08, 1], opacity: [0.45, 0.15, 0.45] }}

            transition={{ duration: 1.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}

            aria-hidden

          />



          <AnimatePresence mode="popLayout">

            <motion.span

              key={label}

              className="audience-results-countdown__value"

              initial={{ opacity: 0, scale: 0.72, y: 8 }}

              animate={{ opacity: 1, scale: 1, y: 0 }}

              exit={{ opacity: 0, scale: 1.12, y: -10 }}

              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}

            >

              {label}

            </motion.span>

          </AnimatePresence>

        </div>

      </motion.div>

    </section>

  );

}

