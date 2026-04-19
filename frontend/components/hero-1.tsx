"use client"

import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { motion } from "framer-motion"

interface HeroProps {
  eyebrow?: string
  title: string
  subtitle: string
  ctaLabel?: string
  ctaHref?: string
}

export function Hero({
  eyebrow = "AgentMesh Ecosystem",
  title,
  subtitle,
  ctaLabel = "Explore Now",
  ctaHref = "#",
}: HeroProps) {
  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.15,
        duration: 0.8,
        ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number],
      },
    }),
  }

  return (
    <section
      id="hero"
      className="relative mx-auto w-full pt-32 px-6 text-center md:px-8 
      min-h-[100dvh] overflow-hidden 
      bg-[linear-gradient(to_bottom,#0a0a0c,#04060E)]  
      rounded-b-xl flex flex-col items-center justify-center"
    >
      {/* Grid BG */}
      <div
        className="absolute -z-10 inset-0 h-full w-full 
        bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] 
        bg-[size:4rem_4rem] 
        [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]"
      />

      {/* Radial Accent */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute left-1/2 top-[calc(100%-120px)] lg:top-[calc(100%-150px)] 
        h-[500px] w-[700px] md:h-[500px] md:w-[1100px] lg:h-[750px] lg:w-[140%] 
        -translate-x-1/2 rounded-[100%] border-t border-[#8b5cf6]/30 bg-black 
        bg-[radial-gradient(closest-side,#000_82%,#1e1b4b)]"
      />

      <div className="relative z-10 flex flex-col items-center max-w-5xl">
        {/* Eyebrow */}
        {eyebrow && (
          <motion.a
            custom={0}
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants}
            href="#"
            className="group mb-6"
          >
            <span
              className="text-sm text-neutral-400 font-medium px-5 py-2 
              bg-white/5 border border-white/10 
              rounded-full w-fit tracking-tight flex items-center justify-center
              hover:bg-white/10 transition-colors backdrop-blur-md"
            >
              {eyebrow}
              <ChevronRight className="inline w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </motion.a>
        )}

        {/* Title */}
        <motion.h1
          custom={1}
          initial="hidden"
          animate="visible"
          variants={fadeUpVariants}
          className="text-balance bg-gradient-to-br from-white from-30% to-white/40 
          bg-clip-text py-2 text-5xl font-semibold leading-tight tracking-tighter 
          text-transparent sm:text-6xl md:text-7xl lg:text-8xl"
        >
          {title}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          custom={2}
          initial="hidden"
          animate="visible"
          variants={fadeUpVariants}
          className="mb-10 text-balance max-w-3xl
          text-lg tracking-tight text-neutral-400 md:text-xl leading-relaxed mt-6"
        >
          {subtitle}
        </motion.p>

        {/* CTA */}
        {ctaLabel && (
          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants}
            className="flex justify-center mt-2"
          >
            <Button asChild className="w-fit min-w-48 z-20 font-medium tracking-wide text-center text-md h-12 bg-white text-black hover:bg-neutral-200 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]">
              <a href={ctaHref}>{ctaLabel}</a>
            </Button>
          </motion.div>
        )}
      </div>

      {/* Bottom Fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-40 z-20
        bg-gradient-to-t from-[#04060E] to-transparent pointer-events-none"
      />
    </section>
  )
}
