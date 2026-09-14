"use client";

import { useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SCENES } from "@/lib/scenes";
import StoryNet from "./StoryNet";

export default function StoryWalk() {
  const router = useRouter();
  const params = useSearchParams();
  const raw = Number(params.get("step") ?? "0");
  const step = Number.isFinite(raw) ? Math.min(Math.max(raw, 0), SCENES.length - 1) : 0;
  const scene = SCENES[step];

  const go = useCallback(
    (next: number) => {
      const clamped = Math.min(Math.max(next, 0), SCENES.length - 1);
      router.replace(`/story?step=${clamped}`, { scroll: false });
    },
    [router]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "l") go(step + 1);
      if (e.key === "ArrowLeft" || e.key === "h") go(step - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, step]);

  return (
    <div className="story-page">
      <div className="story-progress" aria-hidden>
        <div
          className="story-progress-bar"
          style={{ width: `${((step + 1) / SCENES.length) * 100}%` }}
        />
      </div>

      <div className="story-layout">
        <div className="story-copy">
          <div className="story-kicker">
            {scene.kicker}
            <span className="story-stepn">
              {step + 1} / {SCENES.length}
            </span>
          </div>
          <h1>{scene.title}</h1>
          <p className="story-lede">{scene.lede}</p>
          {scene.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <div className="story-takeaway">{scene.takeaway}</div>

          <div className="story-nav">
            <button
              className="story-btn"
              onClick={() => go(step - 1)}
              disabled={step === 0}
            >
              Previous
            </button>
            {step < SCENES.length - 1 ? (
              <button className="story-btn primary" onClick={() => go(step + 1)}>
                Next
              </button>
            ) : (
              <Link href="/explorer?cluster=C00052" className="story-btn primary">
                Open Explorer
              </Link>
            )}
            {scene.explorerHref && step < SCENES.length - 1 && (
              <Link href={scene.explorerHref} className="story-btn ghost">
                {scene.explorerLabel ?? "Open in Explorer"}
              </Link>
            )}
          </div>
        </div>

        <div className="story-visual">
          <StoryNet scene={scene} />
        </div>
      </div>

      <ol className="story-dots">
        {SCENES.map((s, i) => (
          <li key={s.id}>
            <button
              className={i === step ? "active" : ""}
              onClick={() => go(i)}
              aria-label={`${s.kicker}: ${s.title}`}
              aria-current={i === step ? "step" : undefined}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}
