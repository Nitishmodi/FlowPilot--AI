"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { HeroDemo } from "./hero-demo";
import { STAGES } from "@/lib/toolbox";

type Live = {
  active: string;
  held: boolean;
  setPaused: (value: boolean) => void;
  choose: (id: string) => void;
  toggle: () => void;
};

const StageContext = createContext<Live | null>(null);

export function useStage() {
  return useContext(StageContext);
}

const commandFor: Record<string, string> = {
  onboard: "flowpilot doctor",
  understand: "flowpilot explain src",
  check: "flowpilot pr-check",
  ship: "flowpilot pr",
  diagnose: "flowpilot debug",
};

export function StageProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(STAGES[0]?.id ?? "onboard");
  const [held, setHeld] = useState(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    if (held || hovering) return;
    const timer = window.setInterval(() => {
      setActive((current) => {
        const index = STAGES.findIndex((stage) => stage.id === current);
        return STAGES[(index + 1) % STAGES.length]?.id ?? current;
      });
    }, 4200);
    return () => window.clearInterval(timer);
  }, [held, hovering]);

  return (
    <StageContext.Provider
      value={{
        active,
        held,
        setPaused: setHovering,
        choose: (id) => {
          setActive(id);
          setHeld(true);
        },
        toggle: () => setHeld((value) => !value),
      }}
    >
      {children}
    </StageContext.Provider>
  );
}

export function CycleControl() {
  const live = useStage();
  if (!live) return null;
  return (
    <button type="button" className="btn btn-ghost text-sm" onClick={live.toggle}>
      {live.held ? "Play cycle" : "Pause cycle"}
    </button>
  );
}

export function HomeHero() {
  const live = useStage();
  const active = STAGES.find((stage) => stage.id === live?.active) ?? STAGES[0];
  const command = commandFor[active?.id ?? ""] ?? "flowpilot";

  return (
    <section className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-16 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
      <div className="rise space-y-8">
        <p className="kicker">
          <span className="pulse-dot" />
          The toolbox moves with the stage you are in.
        </p>
        <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
          Your entire development workflow, one command away.
        </h1>
        <p className="max-w-xl text-lg leading-8 text-muted sm:text-xl">
          FlowPilot AI connects your existing development tools into workflows that help you understand code, catch problems earlier, debug failures, and ship changes with confidence.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/docs" className="btn btn-primary px-5 py-3">
            Read the docs
          </Link>
          <Link href="/commands" className="btn btn-ghost px-5 py-3">
            Explore commands
          </Link>
        </div>
        <div className="space-y-3" onMouseEnter={() => live?.setPaused(true)} onMouseLeave={() => live?.setPaused(false)}>
          <div className="flex flex-wrap gap-2">
            {STAGES.map((stage) => (
              <button
                key={stage.id}
                type="button"
                className={live?.active === stage.id ? "chip chip-on" : "chip"}
                onClick={() => live?.choose(stage.id)}
              >
                {stage.index} {stage.name}
              </button>
            ))}
          </div>
          <p key={command} className="typed font-mono text-sm text-violet-100">
            $ {command}
            <span className="caret" aria-hidden="true" />
          </p>
          {active ? <p className="text-sm text-muted">{active.summary}</p> : null}
        </div>
      </div>
      <HeroDemo />
    </section>
  );
}
