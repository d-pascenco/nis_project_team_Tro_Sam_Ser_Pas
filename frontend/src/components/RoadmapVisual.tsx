import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { RoadmapData, RoadmapStage, RoadmapResource } from "@/types";
import { PROFESSION_LABELS, getResourceUrl } from "@/lib/constants";
import {
  X, ExternalLink, Clock, CheckCircle2, Target, User,
  ChevronDown, ChevronUp, GitBranch, BookOpen, Wrench,
  Calendar, FolderOpen, ListChecks, Briefcase, Award, Sparkles,
} from "lucide-react";

// Helpers

const isResourceObj = (r: unknown): r is RoadmapResource =>
  typeof r === "object" && r !== null;

const resourceUrl = (r: unknown): string => {
  if (!r) return "#";
  if (isResourceObj(r)) return getResourceUrl((r as RoadmapResource).platform || (r as RoadmapResource).name || "");
  return getResourceUrl(typeof r === "string" ? r : "");
};

const resourceName = (r: unknown): string => {
  if (!r) return "—";
  if (isResourceObj(r)) return (r as RoadmapResource).name || "—";
  return typeof r === "string" ? r : "—";
};

const resourceMeta = (r: string | RoadmapResource): string | null =>
  isResourceObj(r) ? [r.platform, r.type !== "article" ? r.time : null].filter(Boolean).join(" · ") : null;

const RESOURCE_TYPE_ICON: Record<string, string> = {
  course: "📚", book: "📖", video: "🎬", practice: "⚙️", tool: "🛠", article: "📄",
};

// Color palette

const PALETTE = [
  { border: "#c0623e", glow: "rgba(192,98,62,0.35)",  bg: "rgba(192,98,62,0.1)",  text: "#e8855a" },
  { border: "#6384c7", glow: "rgba(99,132,199,0.35)",  bg: "rgba(99,132,199,0.1)",  text: "#8aaae8" },
  { border: "#8263c7", glow: "rgba(130,99,199,0.35)", bg: "rgba(130,99,199,0.1)", text: "#a88ae8" },
  { border: "#c7a328", glow: "rgba(199,163,40,0.35)",  bg: "rgba(199,163,40,0.1)",  text: "#dfc050" },
  { border: "#3ea262", glow: "rgba(62,162,98,0.35)",   bg: "rgba(62,162,98,0.1)",   text: "#5abf80" },
];

// Sub-components

const SectionLabel = ({ icon: Icon, label, color }: { icon: React.ElementType; label: string; color: string }) => (
  <div className="flex items-center gap-1.5 mb-2">
    <Icon className="w-3.5 h-3.5" style={{ color }} />
    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: `${color}99` }}>
      {label}
    </span>
  </div>
);

const Chip = ({ label, style }: { label: string; style?: React.CSSProperties }) => (
  <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-full" style={style}>
    {label}
  </span>
);

const Connector = ({ color, completed }: { color: string; completed?: boolean }) => (
  <div className="flex flex-col items-center" style={{ height: 44 }}>
    <div style={{
      width: 2, flex: 1,
      background: completed ? `linear-gradient(${color}, ${color}88)` : `${color}33`,
      boxShadow: completed ? `0 0 6px ${color}` : "none",
    }} />
    <svg width="10" height="8" viewBox="0 0 10 8">
      <path d="M5 8L0 0H10Z" fill={completed ? color : `${color}33`}
        style={{ filter: completed ? `drop-shadow(0 0 3px ${color})` : "none" }} />
    </svg>
  </div>
);

// Stage node

const StageNode = ({
  stage, palette, completed, isCurrent, isFirst,
}: {
  stage: RoadmapStage;
  palette: typeof PALETTE[0];
  completed: boolean;
  isCurrent: boolean;
  isFirst: boolean;
}) => {
  const [tab, setTab] = useState<"overview" | "schedule" | "weeks" | "practice" | "resources" | "life">("overview");
  const [open, setOpen] = useState(isFirst || isCurrent);

  const tabStyle = (t: string) => ({
    fontSize: 11, padding: "3px 10px", borderRadius: 20, cursor: "pointer", fontWeight: 500,
    background: tab === t ? palette.bg : "transparent",
    color: tab === t ? palette.text : "rgba(255,255,255,0.35)",
    border: `1px solid ${tab === t ? palette.border + "88" : "transparent"}`,
    transition: "all 0.15s",
  } as React.CSSProperties);

  return (
    <div
      style={{
        background: completed ? "rgba(255,255,255,0.03)" : palette.bg,
        border: `1.5px solid ${completed ? palette.border + "33" : palette.border}`,
        boxShadow: !completed ? `0 0 20px ${palette.glow}, inset 0 1px 0 rgba(255,255,255,0.05)` : "none",
        borderRadius: 16, opacity: completed ? 0.65 : 1, transition: "all 0.3s",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={() => setOpen((p) => !p)}
      >
        <div style={{
          width: 40, height: 40, borderRadius: "50%", border: `2px solid ${palette.border}`,
          background: completed ? "rgba(255,255,255,0.06)" : palette.bg,
          color: palette.text, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: 700, flexShrink: 0,
          boxShadow: !completed ? `0 0 12px ${palette.glow}` : "none",
        }}>
          {completed ? <CheckCircle2 size={18} /> : stage.id}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 600, color: "#fff", fontSize: 14 }}>{stage.title}</span>
            {isCurrent && !completed && (
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 600,
                background: palette.bg, color: palette.text, border: `1px solid ${palette.border}66` }}>
                СЕЙЧАС
              </span>
            )}
            {completed && (
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20,
                background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
                Выполнено
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
            <Clock size={11} style={{ color: palette.text }} />
            <span style={{ fontSize: 11, color: palette.text }}>{stage.duration}</span>
          </div>
        </div>

        <div style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Expanded */}
      {open && (
        <div style={{ padding: "0 16px 16px" }} onClick={(e) => e.stopPropagation()}>
          {/* Goal */}
          {stage.goal && (
            <div style={{
              padding: "10px 14px", borderRadius: 10, marginBottom: 12,
              background: `${palette.border}18`, border: `1px solid ${palette.border}44`,
            }}>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.5, margin: 0 }}>
                🎯 {stage.goal}
              </p>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 14, flexWrap: "wrap" }}>
            {[
              { id: "overview", label: "📋 Обзор" },
              { id: "schedule", label: "🗓 Расписание" },
              { id: "weeks", label: `📅 Недели (${stage.weekly_plan?.length || 0})` },
              { id: "practice", label: `🛠 Практика` },
              { id: "resources", label: `📚 Ресурсы (${stage.resources.length})` },
              { id: "life", label: "🌿 Жизнь" },
            ].map((t) => (
              <button key={t.id} style={tabStyle(t.id)} onClick={() => setTab(t.id as typeof tab)}>
                {t.label}
              </button>
            ))}
          </div>

          {/* === OVERVIEW === */}
          {tab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Skills */}
              <div>
                <SectionLabel icon={BookOpen} label="Навыки" color={palette.text} />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {stage.skills.map((s) => (
                    <Chip key={s} label={s} style={{
                      background: `${palette.border}20`, color: palette.text,
                      border: `1px solid ${palette.border}44`,
                    }} />
                  ))}
                </div>
              </div>

              {/* Tools */}
              {stage.tools && stage.tools.length > 0 && (
                <div>
                  <SectionLabel icon={Wrench} label="Инструменты" color={palette.text} />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {stage.tools.map((t) => (
                      <Chip key={t} label={t} style={{
                        background: "rgba(255,255,255,0.06)",
                        color: "rgba(255,255,255,0.55)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Job relevance */}
              {stage.job_relevance && (
                <div>
                  <SectionLabel icon={Briefcase} label="Ценность для найма" color={palette.text} />
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: 0 }}>
                    {stage.job_relevance}
                  </p>
                </div>
              )}

              {/* Checkpoint */}
              {stage.checkpoint && (
                <div style={{
                  padding: "10px 14px", borderRadius: 10,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                }}>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 1 }}>
                    Критерий завершения
                  </p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", margin: 0, lineHeight: 1.5 }}>
                    ✓ {stage.checkpoint}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* === WEEKS === */}
          {tab === "weeks" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {stage.weekly_plan && stage.weekly_plan.length > 0 ? (
                stage.weekly_plan.map((w) => (
                  <div key={w.week} style={{
                    borderRadius: 10, overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}>
                    <div style={{
                      padding: "8px 14px",
                      background: `${palette.border}22`,
                      display: "flex", alignItems: "center", gap: 8,
                    }}>
                      <Calendar size={12} style={{ color: palette.text }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: palette.text }}>
                        Неделя {w.week}
                      </span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>— {w.focus}</span>
                    </div>
                    <div style={{ padding: "10px 14px", background: "rgba(0,0,0,0.2)" }}>
                      {w.tasks.map((task, i) => (
                        <div key={i} style={{
                          display: "flex", gap: 10, padding: "4px 0",
                          borderBottom: i < w.tasks.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                        }}>
                          <span style={{ color: palette.text, fontSize: 12, flexShrink: 0, marginTop: 1 }}>
                            {i + 1}.
                          </span>
                          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
                            {task}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "20px 0" }}>
                  Недельный план не указан
                </p>
              )}
            </div>
          )}

          {/* === PRACTICE === */}
          {tab === "practice" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Projects */}
              {stage.projects && stage.projects.length > 0 && (
                <div>
                  <SectionLabel icon={FolderOpen} label="Практические проекты" color={palette.text} />
                  {stage.projects.map((p, i) => (
                    <div key={i} style={{
                      padding: "12px 14px", borderRadius: 10, marginBottom: 8,
                      background: `${palette.border}18`, border: `1px solid ${palette.border}33`,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>
                          🗂 {p.title}
                        </span>
                        {p.duration && (
                          <span style={{ fontSize: 11, color: palette.text }}>{p.duration}</span>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", margin: 0, lineHeight: 1.5 }}>
                        {p.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Deliverables */}
              {stage.deliverables && stage.deliverables.length > 0 && (
                <div>
                  <SectionLabel icon={ListChecks} label="Что получите в итоге" color={palette.text} />
                  {stage.deliverables.map((d, i) => (
                    <div key={i} style={{
                      display: "flex", gap: 10, padding: "6px 0",
                      borderBottom: i < stage.deliverables!.length - 1
                        ? "1px solid rgba(255,255,255,0.05)" : "none",
                    }}>
                      <span style={{ color: palette.text, fontSize: 13 }}>✓</span>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
                        {d}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* === SCHEDULE === */}
          {tab === "schedule" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {stage.daily_schedule ? (
                <>
                  <div>
                    <SectionLabel icon={Calendar} label="Утро" color={palette.text} />
                    <div style={{ padding: "10px 14px", borderRadius: 10, background: `${palette.border}15`, border: `1px solid ${palette.border}33`, fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
                      {stage.daily_schedule.morning}
                    </div>
                  </div>
                  <div>
                    <SectionLabel icon={Clock} label="Учебные блоки" color={palette.text} />
                    {stage.daily_schedule.study_blocks.map((b, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, padding: "6px 12px", marginBottom: 6, borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                        <span style={{ color: palette.text }}>⏱</span><span>{b}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <SectionLabel icon={Clock} label="Вечер и перерывы" color={palette.text} />
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
                      <div>🌙 {stage.daily_schedule.evening}</div>
                      <div style={{ marginTop: 6 }}>☕ {stage.daily_schedule.breaks}</div>
                    </div>
                  </div>
                  {stage.daily_schedule.tip && (
                    <div style={{ padding: "10px 14px", borderRadius: 10, background: `${palette.border}12`, border: `1px solid ${palette.border}33`, fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>
                      💡 {stage.daily_schedule.tip}
                    </div>
                  )}
                  {stage.weekly_rhythm && (
                    <div>
                      <SectionLabel icon={Calendar} label="Ритм недели" color={palette.text} />
                      {Object.entries(stage.weekly_rhythm).map(([day, plan]) => {
                        const DAYS: Record<string, string> = { monday: "Пн", tuesday: "Вт", wednesday: "Ср", thursday: "Чт", friday: "Пт", saturday: "Сб", sunday: "Вс" };
                        return (
                          <div key={day} style={{ display: "flex", gap: 12, padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 12 }}>
                            <span style={{ color: palette.text, fontWeight: 700, minWidth: 24 }}>{DAYS[day]}</span>
                            <span style={{ color: "rgba(255,255,255,0.6)" }}>{plan}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "20px 0" }}>
                  Обновите план чтобы получить детальное расписание
                </p>
              )}
            </div>
          )}

          {/* === LIFE === */}
          {tab === "life" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {stage.lifestyle ? (
                <>
                  {[
                    { icon: "😴", label: "Сон", text: stage.lifestyle.sleep },
                    { icon: "🏃", label: "Тренировки", text: stage.lifestyle.exercise },
                    { icon: "🥗", label: "Питание", text: stage.lifestyle.nutrition },
                    { icon: "🧠", label: "Глубокая работа", text: stage.lifestyle.deep_work },
                    { icon: "🔥", label: "Защита от выгорания", text: stage.lifestyle.no_burnout },
                  ].map(({ icon, label, text }) => (
                    <div key={label} style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 }}>{icon} {label}</div>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", margin: 0, lineHeight: 1.6 }}>{text}</p>
                    </div>
                  ))}
                </>
              ) : null}
              {stage.motivation_tips && stage.motivation_tips.length > 0 && (
                <div>
                  <SectionLabel icon={Sparkles} label="Мотивация" color={palette.text} />
                  {stage.motivation_tips.map((t, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, padding: "5px 0", fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
                      <span style={{ color: palette.text }}>✦</span><span>{t}</span>
                    </div>
                  ))}
                </div>
              )}
              {stage.common_mistakes && stage.common_mistakes.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <SectionLabel icon={Wrench} label="Частые ошибки" color="#e8855a" />
                  {stage.common_mistakes.map((m, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, padding: "5px 0", fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
                      <span style={{ color: "#e8855a" }}>⚠</span><span>{m}</span>
                    </div>
                  ))}
                </div>
              )}
              {!stage.lifestyle && !stage.motivation_tips?.length && (
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "20px 0" }}>
                  Обновите план чтобы получить лайфстайл-рекомендации
                </p>
              )}
            </div>
          )}

          {/* === RESOURCES === */}
          {tab === "resources" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(stage.resources || []).filter(Boolean).map((r, i) => {
                const name = resourceName(r);
                const url = resourceUrl(r);
                const meta = resourceMeta(r);
                const typeIcon = isResourceObj(r) ? (RESOURCE_TYPE_ICON[r.type] || "📌") : "🔗";
                return (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 14px",
                      borderRadius: 10, textDecoration: "none",
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = `${palette.border}18`;
                      (e.currentTarget as HTMLElement).style.borderColor = `${palette.border}55`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
                    }}
                  >
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{typeIcon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 500,
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {name}
                      </div>
                      {meta && (
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                          {meta}
                        </div>
                      )}
                    </div>
                    <ExternalLink size={13} style={{ color: "rgba(255,255,255,0.25)", flexShrink: 0, marginTop: 2 }} />
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Goal node

const GoalNode = ({ roadmapData, profession }: { roadmapData: RoadmapData; profession: string }) => {
  const [open, setOpen] = useState(false);
  const fg = roadmapData.final_goal;
  return (
    <div style={{
      borderRadius: 16, marginBottom: 4,
      background: "linear-gradient(135deg, rgba(192,98,62,0.22), rgba(192,98,62,0.06))",
      border: "2px solid rgba(192,98,62,0.55)",
      boxShadow: "0 0 40px rgba(192,98,62,0.18), 0 0 80px rgba(192,98,62,0.06), inset 0 1px 0 rgba(255,255,255,0.06)",
    }}>
      <div className="p-5">
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
            background: "rgba(192,98,62,0.25)", border: "2px solid rgba(192,98,62,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Target size={20} style={{ color: "#e8855a" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>
              Цель
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>{profession}</h2>
            {roadmapData.total_duration && (
              <span style={{
                fontSize: 12, padding: "3px 10px", borderRadius: 20,
                background: "rgba(192,98,62,0.2)", border: "1px solid rgba(192,98,62,0.4)",
                color: "#e8855a",
              }}>
                ⏱ {roadmapData.total_duration}
              </span>
            )}
          </div>
          {fg && (
            <button onClick={() => setOpen((p) => !p)} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>
              {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </div>

        {roadmapData.summary && (
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "12px 0 0", lineHeight: 1.6 }}>
            {roadmapData.summary}
          </p>
        )}

        {/* Life system */}
        {roadmapData.life_system && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(192,98,62,0.2)" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Система жизни</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {Object.entries(roadmapData.life_system).map(([key, val]) => {
                const icons: Record<string, string> = { time_management: "⏰", daily_ritual: "🌅", weekly_review: "📊", energy_management: "⚡", tracking: "📈" };
                const names: Record<string, string> = { time_management: "Тайм-менеджмент", daily_ritual: "Ритуалы", weekly_review: "Ревью недели", energy_management: "Энергия", tracking: "Трекинг" };
                return (
                  <div key={key} style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>{icons[key] || "•"} {names[key] || key}</div>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", margin: 0, lineHeight: 1.5 }}>{val}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Final goal details */}
        {open && fg && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(192,98,62,0.2)" }}>
            {fg.requirements && fg.requirements.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>
                  Требования работодателей
                </div>
                {fg.requirements.map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "4px 0", borderBottom: i < fg.requirements.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <span style={{ color: "#e8855a", fontSize: 12 }}>▸</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>{r}</span>
                  </div>
                ))}
              </div>
            )}
            {fg.portfolio && fg.portfolio.length > 0 && (
              <div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>
                  Портфолио
                </div>
                {fg.portfolio.map((p, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "4px 0" }}>
                    <span style={{ color: "#e8855a", fontSize: 12 }}>🗂</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>{p}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Start node

const StartNode = ({ userName, currentRole, skills, scheduleItems }: {
  userName: string;
  currentRole?: string;
  skills?: string[];
  scheduleItems?: import("@/types").ScheduleItem[];
}) => (
  <div style={{
    borderRadius: 16, padding: 20,
    background: "rgba(255,255,255,0.03)", border: "1.5px solid rgba(255,255,255,0.1)",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
        background: "rgba(255,255,255,0.06)", border: "2px solid rgba(255,255,255,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <User size={18} style={{ color: "rgba(255,255,255,0.4)" }} />
      </div>
      <div>
        <div style={{ fontWeight: 600, color: "rgba(255,255,255,0.75)", fontSize: 14 }}>
          {userName || "Вы сейчас"}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
          {currentRole || "Текущий уровень"}
        </div>
      </div>
    </div>

    {skills && skills.length > 0 && (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: scheduleItems?.length ? 12 : 0 }}>
        {skills.slice(0, 6).map((s) => (
          <span key={s} style={{
            fontSize: 11, padding: "2px 8px", borderRadius: 20,
            background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.35)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}>{s}</span>
        ))}
        {skills.length > 6 && (
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>+{skills.length - 6}</span>
        )}
      </div>
    )}

    {scheduleItems && scheduleItems.length > 0 && (
      <div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>
          📅 Текущая занятость
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {scheduleItems.map((item) => (
            <div key={item.id} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "5px 10px", borderRadius: 8,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
              fontSize: 12,
            }}>
              <span style={{ color: "rgba(255,255,255,0.6)", flex: 1 }}>{item.activity}</span>
              <span style={{ color: "rgba(255,255,255,0.35)", fontVariantNumeric: "tabular-nums" }}>
                {item.from}–{item.to}
              </span>
              <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 10 }}>{item.days}</span>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

// Main dialog

interface RoadmapVisualProps {
  roadmapData: RoadmapData;
  userName: string;
  targetProfession: string;
  currentRole?: string;
  technicalSkills?: string[];
  scheduleItems?: import("@/types").ScheduleItem[];
  completedStages?: number[];
  open: boolean;
  onClose: () => void;
}

export const RoadmapVisual = ({
  roadmapData, userName, targetProfession, currentRole,
  technicalSkills, scheduleItems, completedStages = [], open, onClose,
}: RoadmapVisualProps) => {
  const profession = PROFESSION_LABELS[targetProfession] || targetProfession || "Цель";
  const stages = [...roadmapData.stages];
  const firstIncomplete = stages.findIndex((s) => !completedStages.includes(s.id));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-none w-screen h-screen p-0 border-0 bg-transparent overflow-hidden">
        {/* Background */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 50% 20%, rgba(40,15,5,1) 0%, rgba(8,4,2,1) 70%)",
        }} />
        <div style={{
          position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
          width: 600, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(192,98,62,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 16, right: 16, zIndex: 50,
            padding: 8, borderRadius: 10, background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)",
            cursor: "pointer", transition: "all 0.15s",
          }}
        >
          <X size={18} />
        </button>

        {/* Header bar */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, zIndex: 40,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "12px 60px",
          background: "linear-gradient(to bottom, rgba(8,4,2,0.95), transparent)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <GitBranch size={14} style={{ color: "#c0623e" }} />
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
              Дорожная карта развития
            </span>
            <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>{profession}</span>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ position: "absolute", inset: 0, overflowY: "auto", paddingTop: 56, paddingBottom: 60 }}>
          <div style={{ maxWidth: 600, margin: "0 auto", padding: "16px 16px" }}>

            <GoalNode roadmapData={roadmapData} profession={profession} />

            {stages.map((stage, idx) => {
              const palette = PALETTE[idx % PALETTE.length];
              const done = completedStages.includes(stage.id);
              const isCurrent = idx === firstIncomplete;
              return (
                <div key={stage.id}>
                  <Connector color={palette.border} completed={done} />
                  <StageNode
                    stage={stage}
                    palette={palette}
                    completed={done}
                    isCurrent={isCurrent}
                    isFirst={idx === 0}
                  />
                </div>
              );
            })}

            <Connector color="rgba(255,255,255,0.12)" />
            <StartNode
              userName={userName}
              currentRole={currentRole}
              skills={technicalSkills}
              scheduleItems={scheduleItems}
            />

            <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.15)", marginTop: 24 }}>
              Нажмите на этап чтобы открыть детальный план · Переключайте вкладки внутри
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Trigger button

export const RoadmapVisualButton = ({ onClick, size = "default" }: {
  onClick: () => void;
  size?: "default" | "lg" | "sm";
}) => (
  <Button
    variant="outline"
    size={size}
    onClick={onClick}
    className="border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/60"
  >
    <GitBranch className="w-4 h-4" />
    Карта развития
  </Button>
);
