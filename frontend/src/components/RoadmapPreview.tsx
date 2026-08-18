import React, { useState } from "react";
import { generateRoadmapHTML } from "@/lib/generate-html";
import { GoogleLogin } from "@react-oauth/google";
import { RoadmapVisual } from "@/components/RoadmapVisual";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Clock, Download, Share2, Sparkles, Loader2, ExternalLink, ChevronRight, GitBranch,
} from "lucide-react";
import type { RoadmapData, RoadmapStage } from "@/types";
import { PROFESSION_LABELS, TIMELINE_LABELS, STATUS_LABELS, STAGE_COLORS, getResourceUrl } from "@/lib/constants";
import { setToken, setUser, isAuthenticated, authHeaders } from "@/lib/auth";
import { goToCabinet } from "@/lib/urls";

// Types

interface FormSnapshot {
  fullName?: string;
  age?: string;
  location?: string;
  currentStatus?: string;
  education?: string;
  university?: string;
  specialization?: string;
  yearsExperience?: string;
  currentRole?: string;
  cvSummary?: string;
  targetProfession?: string;
  targetIndustry?: string;
  timeline?: string;
  motivation?: string;
  priorities?: string[];
  technicalSkills?: string[];
  softSkills?: string[];
  languages?: { name: string; level: number }[];
  learningStyle?: string;
  hoursPerWeek?: number;
  budget?: string;
  healthConsiderations?: string;
  preferOnline?: boolean;
  preferRussian?: boolean;
  needMentorship?: boolean;
  additionalInfo?: string;
  scheduleItems?: import("@/types").ScheduleItem[];
  country?: string;
  targetHardSkills?: string[];
  targetSoftSkills?: string[];
}

interface RoadmapPreviewProps {
  userData: { fullName: string; targetProfession: string; timeline: string };
  roadmapData?: RoadmapData | null;
  isLoading?: boolean;
  hideActions?: boolean;
  formSnapshot?: FormSnapshot;
}

// Print layout uses a portal because print styles hide the application root.

const PrintLayout = React.forwardRef<HTMLDivElement, {
  userData: RoadmapPreviewProps["userData"];
  formSnapshot?: FormSnapshot;
  roadmapData?: RoadmapData | null;
  stages: RoadmapStage[];
}>(({ userData, formSnapshot, roadmapData, stages }, ref) => (
  <div
    ref={ref}
    className="nextpath-print-root"
    style={{ position: "absolute", left: "-9999px", top: 0, width: "800px", visibility: "hidden" }}
  >
    <style>{`
      .nextpath-print-root {
        font-family: Arial, Helvetica, sans-serif;
        color: #1a1208;
        background: #fdf8f4;
        padding: 0;
        margin: 0;
      }
      .np-page { padding: 40px 48px; max-width: 780px; margin: 0 auto; }
      /* Header */
      .np-header {
        display: flex; align-items: center; justify-content: space-between;
        padding-bottom: 20px; border-bottom: 2px solid #c0623e; margin-bottom: 28px;
      }
      .np-logo { font-size: 26px; font-weight: 600; color: #c0623e; letter-spacing: -0.5px; }
      .np-logo span { color: #1a1208; }
      .np-meta { font-size: 11px; color: #888; text-align: right; line-height: 1.6; }
      /* Sections */
      .np-section { margin-bottom: 28px; }
      .np-section-title {
        font-size: 13px; font-weight: 600; color: #c0623e;
        text-transform: uppercase; letter-spacing: 0.8px;
        margin-bottom: 12px; padding-bottom: 6px;
        border-bottom: 1px solid #f0e8df;
      }
      /* Info grid */
      .np-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 24px; }
      .np-field { }
      .np-field-label { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
      .np-field-value { font-size: 13px; color: #1a1208; font-weight: 500; }
      /* Summary */
      .np-summary {
        background: #fff8f5; border-left: 3px solid #c0623e;
        padding: 12px 16px; border-radius: 0 8px 8px 0;
        font-size: 13px; color: #444; line-height: 1.6;
      }
      /* Stages */
      .np-stage {
        background: #fff; border: 1px solid #ede5dc;
        border-radius: 10px; padding: 16px 20px; margin-bottom: 4px;
      }
      .np-stage-header { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
      .np-stage-num {
        width: 28px; height: 28px; border-radius: 50%;
        background: #c0623e; color: #fff;
        font-size: 12px; font-weight: 700;
        display: flex; align-items: center; justify-content: center; shrink: 0;
        flex-shrink: 0;
      }
      .np-stage-title { font-size: 14px; font-weight: 600; color: #1a1208; }
      .np-stage-dur { font-size: 11px; color: #999; margin-left: auto; }
      .np-chips { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 8px; }
      .np-chip {
        font-size: 11px; padding: 2px 8px; border-radius: 20px;
        background: #f5ede6; color: #7a3a1e; font-weight: 500;
      }
      .np-chip-res {
        font-size: 11px; padding: 2px 8px; border-radius: 20px;
        border: 1px solid #ddd; color: #555;
      }
      .np-label { font-size: 10px; color: #aaa; margin-bottom: 4px; }
      .np-arrow { text-align: center; color: #c0623e; font-size: 16px; margin: 2px 0; }
      /* Footer */
      .np-footer {
        margin-top: 32px; padding-top: 16px; border-top: 1px solid #ede5dc;
        display: flex; justify-content: space-between;
        font-size: 11px; color: #aaa;
      }
    `}</style>

    <div className="np-page">
      {/* Header */}
      <div className="np-header">
        <div className="np-logo">Next<span>Path</span></div>
        <div className="np-meta">
          Персональный план развития<br />
          Создан: {new Date().toLocaleDateString("ru-RU")}<br />
          nextpath.su
        </div>
      </div>

      {/* Profile */}
      <div className="np-section">
        <div className="np-section-title">Профиль</div>
        <div className="np-grid">
          {[
            ["Имя", formSnapshot?.fullName || userData.fullName],
            ["Возраст", formSnapshot?.age ? `${formSnapshot.age} лет` : "—"],
            ["Город", formSnapshot?.location || "—"],
            ["Статус", STATUS_LABELS[formSnapshot?.currentStatus || ""] || "—"],
            ["Образование", formSnapshot?.university || "—"],
            ["Специальность", formSnapshot?.specialization || "—"],
            ["Опыт работы", formSnapshot?.yearsExperience ? `${formSnapshot.yearsExperience} лет` : "—"],
            ["Текущая роль", formSnapshot?.currentRole || "—"],
          ].map(([label, value]) => (
            <div key={label} className="np-field">
              <div className="np-field-label">{label}</div>
              <div className="np-field-value">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Goal */}
      <div className="np-section">
        <div className="np-section-title">Карьерная цель</div>
        <div className="np-grid">
          {[
            ["Целевая профессия", PROFESSION_LABELS[formSnapshot?.targetProfession || ""] || formSnapshot?.targetProfession || "—"],
            ["Индустрия", formSnapshot?.targetIndustry || "—"],
            ["Срок", TIMELINE_LABELS[formSnapshot?.timeline || ""] || roadmapData?.total_duration || "—"],
            ["Часов в неделю", formSnapshot?.hoursPerWeek ? `${formSnapshot.hoursPerWeek} ч/нед` : "—"],
            ["Навыки", formSnapshot?.technicalSkills?.join(", ") || "—"],
            ["Бюджет", formSnapshot?.budget || "—"],
          ].map(([label, value]) => (
            <div key={label} className="np-field">
              <div className="np-field-label">{label}</div>
              <div className="np-field-value">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      {roadmapData?.summary && (
        <div className="np-section">
          <div className="np-section-title">О плане</div>
          <div className="np-summary">{roadmapData.summary}</div>
        </div>
      )}

      {/* Roadmap */}
      <div className="np-section">
        <div className="np-section-title">Дорожная карта</div>
        {stages.map((stage, i) => (
          <div key={stage.id}>
            <div className="np-stage">
              <div className="np-stage-header">
                <div className="np-stage-num">{String(i + 1).padStart(2, "0")}</div>
                <div className="np-stage-title">{stage.title}</div>
                <div className="np-stage-dur">⏱ {stage.duration}</div>
              </div>
              <div className="np-label">Навыки:</div>
              <div className="np-chips">
                {stage.skills.map((s) => <span key={s} className="np-chip">{s}</span>)}
              </div>
              <div className="np-label">Ресурсы:</div>
              <div className="np-chips">
                {stage.resources.map((r) => <span key={r} className="np-chip-res">{r}</span>)}
              </div>
            </div>
            {i < stages.length - 1 && <div className="np-arrow">↓</div>}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="np-footer">
        <span>NextPath — AI-система персонального карьерного сопровождения</span>
        <span>nextpath.su</span>
      </div>
    </div>
  </div>
));
PrintLayout.displayName = "PrintLayout";

// Main component

export const RoadmapPreview = ({
  userData, roadmapData, isLoading, hideActions, formSnapshot,
}: RoadmapPreviewProps) => {

  const [showResources, setShowResources] = useState<number | null>(null);
  const [savingRoadmap, setSavingRoadmap] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [visualOpen, setVisualOpen] = useState(false);

  const stages = roadmapData?.stages ?? [];
  const profession = PROFESSION_LABELS[userData.targetProfession] || userData.targetProfession || "цели";
  const timeline = TIMELINE_LABELS[userData.timeline] || roadmapData?.total_duration || "6 месяцев";

  const handleDownload = () => {
    try {
      // Используем полный профессиональный генератор из generate-html.ts
      const html = generateRoadmapHTML({
        roadmapData: roadmapData ?? { stages, total_duration: timeline, summary: "" },
        userName: userData.fullName || "",
        targetProfession: userData.targetProfession || "",
        currentRole: formSnapshot?.currentRole,
        technicalSkills: formSnapshot?.technicalSkills,
        scheduleItems: formSnapshot?.scheduleItems,
      });

      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nextpath-${(userData.targetProfession || "plan").replace(/\s+/g, "-")}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      setShareMsg("Файл скачан!");
      setTimeout(() => setShareMsg(null), 2500);
    } catch (err) {
      console.error("[download]", err);
      setShareMsg("Ошибка — " + (err instanceof Error ? err.message : "неизвестная"));
      setTimeout(() => setShareMsg(null), 4000);
    }
  };

  const handleShare = async () => {
    if (!roadmapData) {
      setShareMsg("Дождитесь генерации плана перед отправкой ссылки");
      setTimeout(() => setShareMsg(null), 3000);
      return;
    }

    setShareMsg("Создаём уникальную ссылку...");
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roadmap: roadmapData }),
      });

      let body: Record<string, unknown> = {};
      try { body = await res.json(); } catch { /* ignore */ }

      if (!res.ok) {
        const detail = (body.detail as string) || `HTTP ${res.status}`;
        throw new Error(detail);
      }

      const shareId = body.id as string | undefined;
      if (!shareId) throw new Error("Сервер не вернул ID ссылки");

      // Всегда строим ссылку на nextpath.su (не my.nextpath.su)
      const origin = import.meta.env.VITE_MAIN_URL || "https://nextpath.su";
      const shareUrl = `${origin}/shared/${shareId}`;

      if (navigator.share) {
        await navigator.share({ title: "Мой план развития — NextPath", url: shareUrl });
        setShareMsg(null);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setShareMsg("Ссылка скопирована!");
        setTimeout(() => setShareMsg(null), 4000);
      }
    } catch (err) {
      console.error("[share]", err);
      const msg = err instanceof Error ? err.message : String(err);
      setShareMsg(`Ошибка: ${msg}`);
      setTimeout(() => setShareMsg(null), 6000);
    }
  };

  const handleGoogleSuccess = async (resp: { credential?: string }) => {
    if (!resp.credential) return;
    setSavingRoadmap(true);
    setAuthError(null);
    try {
      const authRes = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: resp.credential }),
      });
      const body = await authRes.json().catch(() => ({}));
      if (!authRes.ok) throw new Error(body.detail || `Ошибка ${authRes.status}`);
      setToken(body.token);
      setUser(body.user);
      // Сохраняем данные формы
      if (formSnapshot) {
        await fetch("/api/me/save-form", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ form_data: formSnapshot }),
        }).catch((e) => console.warn("save-form failed:", e));
      }
      // Сохраняем роудмап
      if (roadmapData) {
        await fetch("/api/me/roadmap", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ roadmap: roadmapData }),
        }).catch((e) => console.warn("save-roadmap failed:", e));
      }
      goToCabinet("/profile", body.token);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ошибка авторизации";
      setAuthError(msg);
      console.error("Sign-in error:", err);
    } finally {
      setSavingRoadmap(false);
    }
  };

  return (
    <>
      <div className="space-y-10 animate-fade-in">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Ваша дорожная карта готова
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-foreground">
            Путь к <span className="text-primary">{profession}</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {userData.fullName}, персональный план на {timeline}
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Срок", value: timeline },
            { label: "Этапов", value: String(stages.length) },
            { label: "Навыков", value: `${stages.reduce((n, s) => n + s.skills.length, 0)}+` },
            { label: "Ресурсов", value: `${stages.reduce((n, s) => n + s.resources.length, 0)}+` },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-xl bg-card border border-border text-center">
              <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
              <div className="font-medium text-foreground">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Roadmap flowchart */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm">Генерируем персональный план...</p>
          </div>
        ) : (
          <div className="space-y-0">
            {roadmapData?.summary && (
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed text-center">{roadmapData.summary}</p>
            )}

            {stages.map((stage, idx) => {
              const color = STAGE_COLORS[idx % STAGE_COLORS.length];
              const isCurrent = idx === 0;
              return (
                <div key={stage.id}>
                  {/* Stage block */}
                  <div className={`relative rounded-2xl border-2 p-6 transition-all ${
                    isCurrent
                      ? "bg-primary/5 border-primary shadow-sm"
                      : "bg-card border-border/60 hover:border-border"
                  }`}>
                    {/* Number badge + title */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center font-serif text-lg font-bold ${color}`}>
                        {String(idx + 1).padStart(2, "0")}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-foreground text-lg">{stage.title}</h3>
                          {isCurrent && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">Старт</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                          <Clock className="w-3.5 h-3.5" />
                          {stage.duration}
                        </div>
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="mb-3">
                      <div className="text-xs text-muted-foreground mb-1.5">Навыки:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {stage.skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                        ))}
                      </div>
                    </div>

                    {/* Resources */}
                    <div className="mb-4">
                      <div className="text-xs text-muted-foreground mb-1.5">Ресурсы:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {(stage.resources || []).filter(Boolean).map((r) => (
                          <a key={String(r)} href={getResourceUrl(typeof r === "string" ? r : (r as {name?:string}).name || "")} target="_blank" rel="noopener noreferrer">
                            <Badge variant="outline" className="text-xs gap-1 hover:border-primary hover:text-primary transition-colors cursor-pointer">
                              {typeof r === "string" ? r : (r as {name?:string}).name || "—"} <ExternalLink className="w-2.5 h-2.5" />
                            </Badge>
                          </a>
                        ))}
                      </div>
                    </div>

                    {/* Start button for stage 1 */}
                    {isCurrent && (
                      <Button size="sm" variant="default" onClick={() => setShowResources(stage.id)}>
                        Начать обучение <ChevronRight className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Arrow connector */}
                  {idx < stages.length - 1 && (
                    <div className="flex justify-center py-2">
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="w-px h-4 bg-border" />
                        <div className="w-0 h-0 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent border-t-border"
                          style={{ borderTopWidth: 6, borderTopColor: 'hsl(var(--border))' }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Action buttons */}
        {!hideActions && !isLoading && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
              {roadmapData && (
                <Button
                  variant="hero"
                  size="lg"
                  onClick={() => setVisualOpen(true)}
                  className="bg-gradient-to-r from-primary to-primary/80 shadow-lg"
                >
                  <GitBranch className="w-4 h-4" /> Карта развития
                </Button>
              )}
              <Button variant="outline" size="lg" onClick={handleDownload}>
                <Download className="w-4 h-4" /> Скачать план
              </Button>
              <Button variant="outline" size="lg" onClick={handleShare}>
                <Share2 className="w-4 h-4" /> Поделиться
              </Button>
            </div>
            {/* Уведомление для обеих кнопок */}
            {shareMsg && (
              <p className="text-center text-sm text-primary animate-pulse">{shareMsg}</p>
            )}
          </div>
        )}

        {/* CTA: always visible after roadmap */}
        {!hideActions && !isLoading && (
          <div className="border border-primary/20 rounded-2xl p-6 bg-primary/5 text-center space-y-4">
            {isAuthenticated() ? (
              // Уже залогинен — ведём в кабинет
              <>
                <p className="font-medium text-foreground">Ваш план готов!</p>
                <p className="text-sm text-muted-foreground">Откройте личный кабинет чтобы отслеживать прогресс</p>
                <Button variant="hero" size="lg" onClick={() => goToCabinet()}>
                  <Sparkles className="w-4 h-4" /> Открыть мой кабинет
                </Button>
              </>
            ) : savingRoadmap ? (
              <div className="flex items-center justify-center gap-2 text-muted-foreground py-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm">Сохраняем план...</span>
              </div>
            ) : (
              // Не залогинен — Google sign-in
              <>
                <p className="font-medium text-foreground">Сохраните план и отслеживайте прогресс</p>
                <p className="text-sm text-muted-foreground">Войдите через Google — займёт 10 секунд</p>
                <div className="flex flex-col items-center gap-2">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setAuthError("Не удалось войти через Google. Попробуйте ещё раз.")}
                    locale="ru"
                    text="signin_with"
                    shape="rectangular"
                    size="large"
                  />
                  {authError && <p className="text-sm text-destructive mt-1">{authError}</p>}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Resources modal */}
      <Dialog open={showResources !== null} onOpenChange={() => setShowResources(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ресурсы для старта</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {(stages.find((s) => s.id === showResources)?.resources || []).filter(Boolean).map((r, i) => {
              const name = typeof r === "string" ? r : (r as {name?:string}).name || "—";
              return (
                <a key={i} href={getResourceUrl(name)} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all group">
                  <span className="font-medium text-sm">{name}</span>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                </a>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Visual roadmap modal */}
      {roadmapData && (
        <RoadmapVisual
          open={visualOpen}
          onClose={() => setVisualOpen(false)}
          roadmapData={roadmapData}
          userName={userData.fullName}
          targetProfession={userData.targetProfession}
          currentRole={formSnapshot?.currentRole}
          technicalSkills={formSnapshot?.technicalSkills}
          scheduleItems={formSnapshot?.scheduleItems}
        />
      )}
    </>
  );
};
