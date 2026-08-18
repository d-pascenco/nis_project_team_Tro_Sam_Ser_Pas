/**
 * RoadmapPDFLayout — компонент для захвата через html2canvas.
 * Рендерит полный роудмап (всё раскрыто) в тёмном стиле интерфейса.
 * Использует только inline-стили — CSS-переменные html2canvas не поддерживает.
 */
import React from "react";
import type { RoadmapData, RoadmapStage, RoadmapResource } from "@/types";
import { getResourceUrl } from "@/lib/constants";

// Helpers

const PROFESSION_LABELS: Record<string, string> = {
  frontend: "Frontend Developer", backend: "Backend Developer", fullstack: "Fullstack Developer",
  "data-scientist": "Data Scientist", "ml-engineer": "ML Engineer", devops: "DevOps Engineer",
  product: "Product Manager", designer: "UX/UI Designer", analyst: "Business Analyst", qa: "QA Engineer",
};

const RESOURCE_TYPE_ICON: Record<string, string> = {
  course: "📚", book: "📖", video: "🎬", practice: "⚙️", tool: "🛠️", article: "📄",
};

const isResourceObj = (r: string | RoadmapResource): r is RoadmapResource =>
  typeof r === "object";

const resName = (r: string | RoadmapResource) => isResourceObj(r) ? r.name : r;
const resMeta = (r: string | RoadmapResource) =>
  isResourceObj(r) ? [r.platform, r.time].filter(Boolean).join(" · ") : "";
const resIcon = (r: string | RoadmapResource) =>
  isResourceObj(r) ? (RESOURCE_TYPE_ICON[r.type] || "🔗") : "🔗";

// Palette

const PALETTE = [
  { border: "#c0623e", bg: "rgba(192,98,62,0.12)",  text: "#e8855a", num: "rgba(192,98,62,0.3)" },
  { border: "#6384c7", bg: "rgba(99,132,199,0.12)", text: "#8aaae8", num: "rgba(99,132,199,0.3)" },
  { border: "#8263c7", bg: "rgba(130,99,199,0.12)", text: "#a88ae8", num: "rgba(130,99,199,0.3)" },
  { border: "#c7a328", bg: "rgba(199,163,40,0.12)", text: "#dfc050", num: "rgba(199,163,40,0.3)" },
  { border: "#3ea262", bg: "rgba(62,162,98,0.12)",  text: "#5abf80", num: "rgba(62,162,98,0.3)" },
];

// Sub-components

const Label = ({ text, color }: { text: string; color: string }) => (
  <div style={{
    fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px",
    color, marginBottom: 8,
  }}>
    {text}
  </div>
);

const Chip = ({ text, style }: { text: string; style?: React.CSSProperties }) => (
  <span style={{
    display: "inline-block", fontSize: 11, padding: "3px 10px",
    borderRadius: 20, margin: "2px 4px 2px 0", ...style,
  }}>
    {text}
  </span>
);

const Divider = () => (
  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "14px 0" }} />
);

const Connector = ({ color }: { color: string }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", height: 40 }}>
    <div style={{ width: 2, flex: 1, background: `${color}55` }} />
    <div style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: `7px solid ${color}55` }} />
  </div>
);

// Stage block

const StageBlock = ({ stage, idx, completed }: {
  stage: RoadmapStage; idx: number; completed: boolean;
}) => {
  const p = PALETTE[idx % PALETTE.length];
  return (
    <div style={{
      borderRadius: 16,
      border: `1.5px solid ${completed ? p.border + "33" : p.border}`,
      background: completed ? "rgba(255,255,255,0.02)" : p.bg,
      padding: "20px 22px",
      opacity: completed ? 0.6 : 1,
      pageBreakInside: "avoid",
    }}>
      {/* Stage header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
        <div style={{
          width: 46, height: 46, borderRadius: "50%", flexShrink: 0,
          border: `2.5px solid ${p.border}`, background: p.num,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 15, fontWeight: 800, color: p.text,
        }}>
          {completed ? "✓" : String(idx + 1).padStart(2, "0")}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: "#ffffff" }}>{stage.title}</span>
            {completed && (
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
                Выполнено
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: p.text, marginTop: 4 }}>⏱ {stage.duration}</div>
          {stage.goal && (
            <div style={{
              marginTop: 10, padding: "10px 14px", borderRadius: 10,
              background: `${p.border}20`, border: `1px solid ${p.border}44`,
              fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.6,
            }}>
              🎯 {stage.goal}
            </div>
          )}
        </div>
      </div>

      {/* Skills + Tools */}
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <Label text="Навыки" color={p.text} />
          <div>{stage.skills.map((s) => (
            <Chip key={s} text={s} style={{ background: `${p.border}22`, color: p.text, border: `1px solid ${p.border}44` }} />
          ))}</div>
        </div>
        {stage.tools && stage.tools.length > 0 && (
          <div style={{ flex: 1, minWidth: 200 }}>
            <Label text="Инструменты" color={p.text} />
            <div>{stage.tools.map((t) => (
              <Chip key={t} text={t} style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }} />
            ))}</div>
          </div>
        )}
      </div>

      <Divider />

      {/* Weekly plan */}
      {stage.weekly_plan && stage.weekly_plan.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <Label text="Недельный план" color={p.text} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {stage.weekly_plan.map((w) => (
              <div key={w.week} style={{ borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ padding: "7px 14px", background: `${p.border}22`, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: p.text }}>Неделя {w.week}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>— {w.focus}</span>
                </div>
                <div style={{ padding: "8px 14px 10px", background: "rgba(0,0,0,0.25)" }}>
                  {w.tasks.map((task, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, padding: "3px 0", fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
                      <span style={{ color: p.text, flexShrink: 0 }}>{i + 1}.</span>
                      <span>{task}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {stage.projects && stage.projects.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <Label text="Практические проекты" color={p.text} />
          {stage.projects.map((proj, i) => (
            <div key={i} style={{
              marginBottom: 8, padding: "12px 14px", borderRadius: 10,
              background: `${p.border}18`, border: `1px solid ${p.border}33`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>🗂 {proj.title}</span>
                {proj.duration && <span style={{ fontSize: 11, color: p.text }}>{proj.duration}</span>}
              </div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", margin: 0, lineHeight: 1.5 }}>{proj.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Deliverables + Checkpoint side by side */}
      {(stage.deliverables?.length || stage.checkpoint) && (
        <div style={{ display: "flex", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
          {stage.deliverables && stage.deliverables.length > 0 && (
            <div style={{ flex: 1, minWidth: 180 }}>
              <Label text="Результаты" color={p.text} />
              {stage.deliverables.map((d, i) => (
                <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.6)", padding: "3px 0", lineHeight: 1.5 }}>
                  <span style={{ color: p.text }}>✓</span><span>{d}</span>
                </div>
              ))}
            </div>
          )}
          {stage.checkpoint && (
            <div style={{
              flex: 1, minWidth: 180, padding: "10px 12px", borderRadius: 10,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
            }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Критерий завершения</div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.5 }}>✓ {stage.checkpoint}</p>
            </div>
          )}
        </div>
      )}

      {/* Resources */}
      <div style={{ marginBottom: 10 }}>
        <Label text="Ресурсы" color={p.text} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {stage.resources.map((r, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 12px",
              borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{resIcon(r)}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 500, wordBreak: "break-word" }}>{resName(r)}</div>
                {resMeta(r) && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{resMeta(r)}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Job relevance */}
      {stage.job_relevance && (
        <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", marginTop: 10 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 }}>Ценность для карьеры</div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.5 }}>💼 {stage.job_relevance}</p>
        </div>
      )}
    </div>
  );
};

// Main layout

interface RoadmapPDFLayoutProps {
  roadmapData: RoadmapData;
  userName: string;
  targetProfession: string;
  currentRole?: string;
  technicalSkills?: string[];
  completedStages?: number[];
}

export const RoadmapPDFLayout = React.forwardRef<HTMLDivElement, RoadmapPDFLayoutProps>(
  ({ roadmapData, userName, targetProfession, currentRole, technicalSkills, completedStages = [] }, ref) => {
    const profession = PROFESSION_LABELS[targetProfession] || targetProfession || "Цель";
    const fg = roadmapData.final_goal;

    return (
      <div
        ref={ref}
        style={{
          width: 840,
          background: "#0d0704",
          padding: "40px 44px",
          fontFamily: "Arial, Helvetica, sans-serif",
          color: "#fff",
          boxSizing: "border-box",
        }}
      >
        {/* ── Header ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          paddingBottom: 20, borderBottom: "2px solid rgba(192,98,62,0.5)", marginBottom: 32,
        }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#c0623e", letterSpacing: -0.5 }}>NextPath</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>Персональный план развития</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>nextpath.su</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>
              {new Date().toLocaleDateString("ru-RU")}
            </div>
          </div>
        </div>

        {/* ── Start / User ── */}
        <div style={{
          padding: "16px 20px", borderRadius: 14, marginBottom: 8,
          background: "rgba(255,255,255,0.03)", border: "1.5px solid rgba(255,255,255,0.1)",
          display: "flex", alignItems: "center", gap: 16,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.07)",
            border: "2px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 22, flexShrink: 0,
          }}>👤</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "rgba(255,255,255,0.8)" }}>
              {userName || "Пользователь"}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>
              {currentRole || "Текущий уровень"}
              {technicalSkills && technicalSkills.length > 0 && (
                <span style={{ marginLeft: 10, color: "rgba(255,255,255,0.2)" }}>
                  {technicalSkills.slice(0, 5).join(" · ")}
                </span>
              )}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: 1 }}>Стартовая точка</div>
          </div>
        </div>

        <Connector color="rgba(255,255,255,0.15)" />

        {/* ── Stages ── */}
        {roadmapData.stages.map((stage, idx) => {
          const p = PALETTE[idx % PALETTE.length];
          const done = completedStages.includes(stage.id);
          return (
            <React.Fragment key={stage.id}>
              <StageBlock stage={stage} idx={idx} completed={done} />
              {idx < roadmapData.stages.length - 1 && <Connector color={p.border} />}
            </React.Fragment>
          );
        })}

        {/* ── Goal / Final ── */}
        <Connector color="rgba(192,98,62,0.5)" />
        <div style={{
          borderRadius: 16, padding: "24px 26px",
          background: "linear-gradient(135deg, rgba(192,98,62,0.2), rgba(192,98,62,0.06))",
          border: "2px solid rgba(192,98,62,0.55)",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
            <div style={{
              width: 50, height: 50, borderRadius: "50%", flexShrink: 0,
              background: "rgba(192,98,62,0.25)", border: "2.5px solid rgba(192,98,62,0.7)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
            }}>🏆</div>
            <div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>Цель</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{profession}</div>
              {roadmapData.total_duration && (
                <div style={{
                  display: "inline-block", marginTop: 8, fontSize: 12, padding: "4px 12px", borderRadius: 20,
                  background: "rgba(192,98,62,0.2)", border: "1px solid rgba(192,98,62,0.4)", color: "#e8855a",
                }}>⏱ {roadmapData.total_duration}</div>
              )}
            </div>
          </div>

          {roadmapData.summary && (
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: "0 0 16px" }}>
              {roadmapData.summary}
            </p>
          )}

          {fg && (
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {fg.requirements && fg.requirements.length > 0 && (
                <div style={{ flex: 1, minWidth: 220 }}>
                  <Label text="Требования работодателей" color="#e8855a" />
                  {fg.requirements.map((r, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.6)", padding: "3px 0", lineHeight: 1.5 }}>
                      <span style={{ color: "#e8855a" }}>▸</span><span>{r}</span>
                    </div>
                  ))}
                </div>
              )}
              {fg.portfolio && fg.portfolio.length > 0 && (
                <div style={{ flex: 1, minWidth: 220 }}>
                  <Label text="Портфолио" color="#e8855a" />
                  {fg.portfolio.map((p, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.6)", padding: "3px 0", lineHeight: 1.5 }}>
                      <span>🗂</span><span>{p}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 32, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
            NextPath — AI-система персонального карьерного сопровождения
          </span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>nextpath.su</span>
        </div>
      </div>
    );
  }
);
RoadmapPDFLayout.displayName = "RoadmapPDFLayout";
