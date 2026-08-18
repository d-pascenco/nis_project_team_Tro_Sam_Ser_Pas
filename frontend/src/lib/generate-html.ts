import type { RoadmapData, RoadmapStage, RoadmapResource } from "@/types";
import { getResourceUrl } from "@/lib/constants";

const PROFESSION_LABELS: Record<string, string> = {
  frontend: "Frontend Developer", backend: "Backend Developer", fullstack: "Fullstack Developer",
  "data-scientist": "Data Scientist", "ml-engineer": "ML Engineer", devops: "DevOps Engineer",
  product: "Product Manager", designer: "UX/UI Designer", analyst: "Business Analyst", qa: "QA Engineer",
};

const PALETTE = [
  { border: "#c0623e", bg: "rgba(192,98,62,0.12)", text: "#e8855a", glow: "rgba(192,98,62,0.3)" },
  { border: "#6384c7", bg: "rgba(99,132,199,0.12)", text: "#8aaae8", glow: "rgba(99,132,199,0.3)" },
  { border: "#8263c7", bg: "rgba(130,99,199,0.12)", text: "#a88ae8", glow: "rgba(130,99,199,0.3)" },
  { border: "#c7a328", bg: "rgba(199,163,40,0.12)", text: "#dfc050", glow: "rgba(199,163,40,0.3)" },
  { border: "#3ea262", bg: "rgba(62,162,98,0.12)", text: "#5abf80", glow: "rgba(62,162,98,0.3)" },
];

const RESOURCE_ICON: Record<string, string> = {
  course: "📚", book: "📖", video: "🎬", practice: "⚙️", tool: "🛠️", article: "📄",
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const isObj = (r: unknown): r is RoadmapResource => typeof r === "object" && r !== null;
const resName = (r: unknown) => isObj(r) ? ((r as RoadmapResource).name || "—") : (typeof r === "string" ? r : "—");
const resMeta = (r: unknown) => isObj(r) ? [(r as RoadmapResource).platform, (r as RoadmapResource).time].filter(Boolean).join(" · ") : "";
const resIcon = (r: unknown) => isObj(r) ? (RESOURCE_ICON[(r as RoadmapResource).type] || "🔗") : "🔗";
const resUrl  = (r: unknown) => isObj(r) ? getResourceUrl((r as RoadmapResource).platform || (r as RoadmapResource).name || "") : getResourceUrl(typeof r === "string" ? r : "");

// Stage HTML

function stageHTML(stage: RoadmapStage, idx: number, completed: boolean): string {
  const p = PALETTE[idx % PALETTE.length];
  const id = `stage-${stage.id}`;

  const skillsHTML = stage.skills.map((s) =>
    `<span class="chip" style="background:${p.bg};color:${p.text};border:1px solid ${p.border}44">${esc(s)}</span>`
  ).join("");

  const toolsHTML = stage.tools?.map((t) =>
    `<span class="chip" style="background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.5);border:1px solid rgba(255,255,255,0.1)">${esc(t)}</span>`
  ).join("") || "";

  const weeksHTML = stage.weekly_plan?.map((w) => `
    <div class="week-block">
      <div class="week-header" style="background:${p.border}22">
        <span style="color:${p.text};font-weight:700;font-size:12px">Неделя ${w.week}</span>
        <span style="color:rgba(255,255,255,0.4);font-size:12px;margin-left:8px">— ${esc(w.focus)}</span>
      </div>
      <div class="week-body">
        ${w.tasks.map((t, i) => `
          <div class="week-task">
            <span class="task-num" style="color:${p.text}">${i + 1}.</span>
            <span>${esc(t)}</span>
          </div>`).join("")}
      </div>
    </div>`).join("") || "<p class='empty'>Недельный план не указан</p>";

  const projectsHTML = stage.projects?.map((proj) => `
    <div class="project-card" style="background:${p.border}18;border:1px solid ${p.border}33">
      <div class="project-header">
        <span class="project-title">🗂 ${esc(proj.title)}</span>
        ${proj.duration ? `<span style="font-size:11px;color:${p.text}">${esc(proj.duration)}</span>` : ""}
      </div>
      <p class="project-desc">${esc(proj.description)}</p>
    </div>`).join("") || "";

  const deliverablesHTML = stage.deliverables?.map((d) =>
    `<div class="deliverable"><span style="color:${p.text}">✓</span><span>${esc(d)}</span></div>`
  ).join("") || "";

  const resourcesHTML = (stage.resources || []).filter(Boolean).map((r) => `
    <a href="${resUrl(r)}" target="_blank" rel="noopener noreferrer" class="resource-link">
      <span class="resource-icon">${resIcon(r)}</span>
      <div class="resource-info">
        <div class="resource-name">${esc(resName(r))}</div>
        ${resMeta(r) ? `<div class="resource-meta">${esc(resMeta(r))}</div>` : ""}
      </div>
      <span class="resource-ext">↗</span>
    </a>`).join("");

  return `
  <div class="stage-node ${completed ? "completed" : ""}"
    style="border:1.5px solid ${completed ? p.border + "33" : p.border};background:${completed ? "rgba(255,255,255,0.02)" : p.bg};box-shadow:${!completed ? `0 0 20px ${p.glow}` : "none"}"
    id="${id}">

    <!-- Stage header (click to toggle) -->
    <div class="stage-header" onclick="toggleStage('${id}')">
      <div class="stage-num ${completed ? "completed-num" : ""}"
        style="border:2px solid ${p.border};background:${completed ? "rgba(255,255,255,0.08)" : p.bg};color:${p.text};box-shadow:${!completed ? `0 0 12px ${p.glow}` : "none"}">
        ${completed ? "✓" : String(idx + 1).padStart(2, "0")}
      </div>
      <div class="stage-meta">
        <div class="stage-title-row">
          <span class="stage-title">${esc(stage.title)}</span>
          ${completed ? `<span class="badge-done">Выполнено</span>` : ""}
        </div>
        <div class="stage-duration" style="color:${p.text}">⏱ ${esc(stage.duration)}</div>
        ${stage.goal ? `<div class="stage-goal" style="background:${p.border}20;border:1px solid ${p.border}44">🎯 ${esc(stage.goal)}</div>` : ""}
      </div>
      <div class="toggle-icon" id="${id}-icon">▼</div>
    </div>

    <!-- Stage body -->
    <div class="stage-body" id="${id}-body">

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab active" style="--tc:${p.text};--tb:${p.border}" onclick="switchTab('${id}','overview',this)">📋 Обзор</button>
        <button class="tab" style="--tc:${p.text};--tb:${p.border}" onclick="switchTab('${id}','schedule',this)">🗓 Расписание</button>
        <button class="tab" style="--tc:${p.text};--tb:${p.border}" onclick="switchTab('${id}','weeks',this)">📅 Недели (${stage.weekly_plan?.length || 0})</button>
        <button class="tab" style="--tc:${p.text};--tb:${p.border}" onclick="switchTab('${id}','practice',this)">🛠 Практика</button>
        <button class="tab" style="--tc:${p.text};--tb:${p.border}" onclick="switchTab('${id}','resources',this)">📚 Ресурсы (${stage.resources.length})</button>
        <button class="tab" style="--tc:${p.text};--tb:${p.border}" onclick="switchTab('${id}','life',this)">🌿 Жизнь</button>
      </div>

      <!-- Overview -->
      <div class="tab-pane active" id="${id}-overview">
        <div class="section-label" style="color:${p.text}">НАВЫКИ</div>
        <div class="chips">${skillsHTML}</div>
        ${toolsHTML ? `<div class="section-label" style="color:${p.text};margin-top:12px">ИНСТРУМЕНТЫ</div><div class="chips">${toolsHTML}</div>` : ""}
        ${stage.job_relevance ? `
          <div class="section-label" style="color:${p.text};margin-top:12px">ЦЕННОСТЬ ДЛЯ КАРЬЕРЫ</div>
          <p class="body-text">💼 ${esc(stage.job_relevance)}</p>` : ""}
        ${stage.checkpoint ? `
          <div class="checkpoint-box" style="border:1px solid rgba(255,255,255,0.08)">
            <div class="checkpoint-label">Критерий завершения</div>
            <p class="checkpoint-text">✓ ${esc(stage.checkpoint)}</p>
          </div>` : ""}
      </div>

      <!-- Weekly plan -->
      <div class="tab-pane" id="${id}-weeks">
        ${weeksHTML}
      </div>

      <!-- Practice -->
      <div class="tab-pane" id="${id}-practice">
        ${projectsHTML ? `<div class="section-label" style="color:${p.text}">ПРАКТИЧЕСКИЕ ПРОЕКТЫ</div>${projectsHTML}` : ""}
        ${deliverablesHTML ? `<div class="section-label" style="color:${p.text};margin-top:14px">РЕЗУЛЬТАТЫ ЭТАПА</div>${deliverablesHTML}` : ""}
        ${!projectsHTML && !deliverablesHTML ? "<p class='empty'>Практические задания не указаны</p>" : ""}
      </div>

      <!-- Resources -->
      <div class="tab-pane" id="${id}-resources">
        <div class="resources-grid">${resourcesHTML}</div>
      </div>

      <!-- Schedule -->
      <div class="tab-pane" id="${id}-schedule">
        ${stage.daily_schedule ? `
          <div class="section-label" style="color:${p.text}">УТРЕННИЙ БЛОК</div>
          <div style="padding:10px 14px;border-radius:10px;background:${p.border}15;border:1px solid ${p.border}33;font-size:12px;color:rgba(255,255,255,0.7);line-height:1.6;margin-bottom:12px">
            ☀️ ${esc(stage.daily_schedule.morning || "")}
          </div>
          ${(stage.daily_schedule.study_blocks || []).length ? `
          <div class="section-label" style="color:${p.text}">УЧЕБНЫЕ БЛОКИ</div>
          ${(stage.daily_schedule.study_blocks || []).map((b) => `
            <div style="display:flex;gap:10px;padding:6px 12px;margin-bottom:6px;border-radius:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);font-size:12px;color:rgba(255,255,255,0.7);line-height:1.5">
              <span style="color:${p.text}">⏱</span><span>${esc(b || "")}</span>
            </div>`).join("")}` : ""}
          ${(stage.daily_schedule.evening || stage.daily_schedule.breaks) ? `
          <div class="section-label" style="color:${p.text};margin-top:12px">ВЕЧЕР И ПЕРЕРЫВЫ</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.6);line-height:1.8">
            ${stage.daily_schedule.evening ? `🌙 ${esc(stage.daily_schedule.evening)}<br>` : ""}
            ${stage.daily_schedule.breaks ? `☕ ${esc(stage.daily_schedule.breaks)}` : ""}
          </div>` : ""}
          ${stage.daily_schedule.tip ? `
            <div style="margin-top:12px;padding:10px 14px;border-radius:10px;background:${p.border}12;border:1px solid ${p.border}33;font-size:12px;color:rgba(255,255,255,0.65);line-height:1.6">
              💡 ${esc(stage.daily_schedule.tip)}
            </div>` : ""}
          ${stage.weekly_rhythm ? `
            <div class="section-label" style="color:${p.text};margin-top:16px">РИТМ НЕДЕЛИ</div>
            ${Object.entries(stage.weekly_rhythm || {}).map(([day, plan]) => {
              const DAYS: Record<string, string> = { monday: "Пн", tuesday: "Вт", wednesday: "Ср", thursday: "Чт", friday: "Пт", saturday: "Сб", sunday: "Вс" };
              return `<div style="display:flex;gap:12px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:12px">
                <span style="color:${p.text};font-weight:700;min-width:24px">${DAYS[day] || day}</span>
                <span style="color:rgba(255,255,255,0.6)">${esc(String(plan || ""))}</span>
              </div>`;
            }).join("")}` : ""}
        ` : "<p class='empty'>Обновите план чтобы получить детальное расписание</p>"}
      </div>

      <!-- Life -->
      <div class="tab-pane" id="${id}-life">
        ${stage.lifestyle ? `
          ${[
            { icon: "😴", key: "sleep", label: "СОН" },
            { icon: "🏃", key: "exercise", label: "ТРЕНИРОВКИ" },
            { icon: "🥗", key: "nutrition", label: "ПИТАНИЕ" },
            { icon: "🧠", key: "deep_work", label: "ГЛУБОКАЯ РАБОТА" },
            { icon: "🔥", key: "no_burnout", label: "ЗАЩИТА ОТ ВЫГОРАНИЯ" },
          ].map(({ icon, key, label }) => {
            const val = stage.lifestyle ? (stage.lifestyle as Record<string,string>)[key] : "";
            return val ? `
              <div style="padding:12px 14px;border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);margin-bottom:8px">
                <div style="font-size:10px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:1px;margin-bottom:5px">${icon} ${label}</div>
                <p style="font-size:12px;color:rgba(255,255,255,0.65);margin:0;line-height:1.6">${esc(val)}</p>
              </div>` : "";
          }).join("")}
        ` : ""}
        ${(stage.motivation_tips || []).length ? `
          <div class="section-label" style="color:${p.text}">МОТИВАЦИЯ</div>
          ${(stage.motivation_tips || []).map((t) => `
            <div style="display:flex;gap:10px;padding:5px 0;font-size:12px;color:rgba(255,255,255,0.6);line-height:1.5">
              <span style="color:${p.text}">✦</span><span>${esc(t || "")}</span>
            </div>`).join("")}
        ` : ""}
        ${(stage.common_mistakes || []).length ? `
          <div class="section-label" style="color:#e8855a;margin-top:12px">ЧАСТЫЕ ОШИБКИ</div>
          ${(stage.common_mistakes || []).map((m) => `
            <div style="display:flex;gap:10px;padding:5px 0;font-size:12px;color:rgba(255,255,255,0.6);line-height:1.5">
              <span style="color:#e8855a">⚠</span><span>${esc(m || "")}</span>
            </div>`).join("")}
        ` : ""}
        ${!stage.lifestyle && !(stage.motivation_tips || []).length ? "<p class='empty'>Обновите план для лайфстайл-рекомендаций</p>" : ""}
      </div>
    </div>
  </div>`;
}

// Full HTML

interface HTMLOptions {
  roadmapData: RoadmapData;
  userName: string;
  targetProfession: string;
  currentRole?: string;
  technicalSkills?: string[];
  completedStages?: number[];
  scheduleItems?: Array<{ id: string; activity: string; from: string; to: string; days: string }>;
}

export function generateRoadmapHTML(opts: HTMLOptions): string {
  const { roadmapData, userName, targetProfession, currentRole, technicalSkills, completedStages = [], scheduleItems } = opts;
  const profession = PROFESSION_LABELS[targetProfession] || targetProfession || "Цель";
  const fg = roadmapData.final_goal;
  const date = new Date().toLocaleDateString("ru-RU");

  const stagesHTML = roadmapData.stages.map((stage, idx) => {
    const p = PALETTE[idx % PALETTE.length];
    const done = completedStages.includes(stage.id);
    const connector = `<div class="connector"><div class="connector-line" style="background:${done ? p.border : p.border + "44"}"></div><div class="connector-arrow" style="border-top-color:${done ? p.border : p.border + "44"}"></div></div>`;
    return stageHTML(stage, idx, done) + (idx < roadmapData.stages.length - 1 ? connector : "");
  }).join("");

  const requirementsHTML = fg?.requirements?.map((r) =>
    `<div class="req-item"><span class="req-arrow">▸</span><span>${esc(r)}</span></div>`
  ).join("") || "";

  const portfolioHTML = fg?.portfolio?.map((p) =>
    `<div class="req-item"><span>🗂</span><span>${esc(p)}</span></div>`
  ).join("") || "";

  const skillsUserHTML = (technicalSkills || []).slice(0, 7).map((s) =>
    `<span class="chip" style="background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.4);border:1px solid rgba(255,255,255,0.08)">${esc(s)}</span>`
  ).join("");

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NextPath — ${esc(profession)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
    background: #0a0503;
    color: #fff;
    min-height: 100vh;
  }

  /* Ambient glow */
  body::before {
    content: "";
    position: fixed; top: 0; left: 50%; transform: translateX(-50%);
    width: 700px; height: 500px; pointer-events: none; z-index: 0;
    background: radial-gradient(ellipse, rgba(192,98,62,0.09) 0%, transparent 70%);
  }

  .page { max-width: 680px; margin: 0 auto; padding: 40px 20px 80px; position: relative; z-index: 1; }

  /* Header */
  .header {
    display: flex; justify-content: space-between; align-items: flex-start;
    padding-bottom: 24px; margin-bottom: 36px;
    border-bottom: 2px solid rgba(192,98,62,0.45);
  }
  .logo { font-size: 24px; font-weight: 800; color: #c0623e; letter-spacing: -0.5px; }
  .logo span { color: rgba(255,255,255,0.8); }
  .header-meta { text-align: right; font-size: 12px; color: rgba(255,255,255,0.3); line-height: 1.8; }

  /* User / Start */
  .user-node {
    display: flex; align-items: center; gap: 16px;
    padding: 16px 20px; border-radius: 14px;
    background: rgba(255,255,255,0.03); border: 1.5px solid rgba(255,255,255,0.1);
    margin-bottom: 4px;
  }
  .user-avatar {
    width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
    background: rgba(255,255,255,0.07); border: 2px solid rgba(255,255,255,0.15);
    display: flex; align-items: center; justify-content: center; font-size: 22px;
  }
  .user-name { font-size: 15px; font-weight: 600; color: rgba(255,255,255,0.8); }
  .user-sub { font-size: 12px; color: rgba(255,255,255,0.35); margin-top: 3px; }
  .user-tag {
    margin-left: auto; font-size: 10px; color: rgba(255,255,255,0.2);
    text-transform: uppercase; letter-spacing: 1px;
  }

  /* Connector */
  .connector { display: flex; flex-direction: column; align-items: center; height: 44px; }
  .connector-line { width: 2px; flex: 1; }
  .connector-arrow { width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 7px solid; }

  /* Stage node */
  .stage-node { border-radius: 16px; margin-bottom: 4px; transition: all 0.2s; }
  .stage-node.completed { opacity: 0.65; }
  .stage-header {
    display: flex; align-items: flex-start; gap: 14px;
    padding: 18px 20px; cursor: pointer; user-select: none;
    border-radius: 14px; transition: background 0.15s;
  }
  .stage-header:hover { background: rgba(255,255,255,0.03); }
  .stage-num {
    width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 800;
  }
  .stage-meta { flex: 1; }
  .stage-title-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .stage-title { font-size: 16px; font-weight: 700; color: #fff; }
  .badge-done {
    font-size: 10px; padding: 2px 8px; border-radius: 20px;
    background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.4);
  }
  .stage-duration { font-size: 12px; margin-top: 4px; }
  .stage-goal {
    margin-top: 10px; padding: 9px 13px; border-radius: 10px;
    font-size: 12px; color: rgba(255,255,255,0.7); line-height: 1.6;
  }
  .toggle-icon { font-size: 12px; color: rgba(255,255,255,0.3); margin-top: 4px; transition: transform 0.2s; flex-shrink: 0; }
  .toggle-icon.open { transform: rotate(180deg); }

  /* Stage body */
  .stage-body { display: none; padding: 0 20px 20px; }
  .stage-body.open { display: block; animation: fadeIn 0.2s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }

  /* Tabs */
  .tabs { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 16px; }
  .tab {
    font-size: 11px; font-weight: 600; padding: 5px 12px; border-radius: 20px;
    cursor: pointer; border: 1px solid transparent; transition: all 0.15s;
    background: transparent; color: rgba(255,255,255,0.35);
  }
  .tab.active {
    background: color-mix(in srgb, var(--tc) 15%, transparent);
    color: var(--tc); border-color: color-mix(in srgb, var(--tb) 40%, transparent);
  }
  .tab:hover:not(.active) { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.6); }

  .tab-pane { display: none; }
  .tab-pane.active { display: block; animation: fadeIn 0.15s ease; }

  /* Section label */
  .section-label { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 8px; }

  /* Chips */
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip { display: inline-block; font-size: 11px; padding: 3px 10px; border-radius: 20px; }

  /* Weekly plan */
  .week-block { border-radius: 10px; overflow: hidden; border: 1px solid rgba(255,255,255,0.07); margin-bottom: 8px; }
  .week-header { padding: 7px 14px; display: flex; align-items: center; }
  .week-body { padding: 8px 14px 10px; background: rgba(0,0,0,0.25); }
  .week-task { display: flex; gap: 10px; padding: 4px 0; font-size: 12px; color: rgba(255,255,255,0.6); line-height: 1.5; border-bottom: 1px solid rgba(255,255,255,0.04); }
  .week-task:last-child { border-bottom: none; }
  .task-num { flex-shrink: 0; font-weight: 600; }

  /* Projects */
  .project-card { padding: 12px 14px; border-radius: 10px; margin-bottom: 8px; }
  .project-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .project-title { font-size: 13px; font-weight: 600; color: #fff; }
  .project-desc { font-size: 12px; color: rgba(255,255,255,0.55); line-height: 1.5; }

  /* Deliverables */
  .deliverable { display: flex; gap: 10px; font-size: 12px; color: rgba(255,255,255,0.6); padding: 5px 0; line-height: 1.5; border-bottom: 1px solid rgba(255,255,255,0.04); }
  .deliverable:last-child { border-bottom: none; }

  /* Resources */
  .resources-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  @media (max-width: 500px) { .resources-grid { grid-template-columns: 1fr; } }
  .resource-link {
    display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px;
    border-radius: 10px; text-decoration: none;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    transition: all 0.15s; color: inherit;
  }
  .resource-link:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.16); transform: translateY(-1px); }
  .resource-icon { font-size: 18px; flex-shrink: 0; }
  .resource-info { flex: 1; min-width: 0; }
  .resource-name { font-size: 12px; color: rgba(255,255,255,0.8); font-weight: 500; word-break: break-word; }
  .resource-meta { font-size: 10px; color: rgba(255,255,255,0.3); margin-top: 2px; }
  .resource-ext { font-size: 12px; color: rgba(255,255,255,0.2); flex-shrink: 0; margin-top: 2px; }

  /* Misc */
  .body-text { font-size: 12px; color: rgba(255,255,255,0.5); line-height: 1.6; }
  .empty { font-size: 12px; color: rgba(255,255,255,0.25); text-align: center; padding: 20px 0; }
  .checkpoint-box { padding: 10px 14px; border-radius: 10px; background: rgba(255,255,255,0.03); margin-top: 12px; }
  .checkpoint-label { font-size: 10px; color: rgba(255,255,255,0.25); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
  .checkpoint-text { font-size: 12px; color: rgba(255,255,255,0.6); line-height: 1.5; }

  /* Goal node */
  .goal-node {
    border-radius: 16px; padding: 24px 26px;
    background: linear-gradient(135deg, rgba(192,98,62,0.2), rgba(192,98,62,0.05));
    border: 2px solid rgba(192,98,62,0.55);
    box-shadow: 0 0 40px rgba(192,98,62,0.15);
    margin-top: 4px;
  }
  .goal-header { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 14px; }
  .goal-icon {
    width: 50px; height: 50px; border-radius: 50%; flex-shrink: 0;
    background: rgba(192,98,62,0.25); border: 2.5px solid rgba(192,98,62,0.7);
    display: flex; align-items: center; justify-content: center; font-size: 24px;
  }
  .goal-label { font-size: 10px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px; }
  .goal-title { font-size: 22px; font-weight: 800; color: #fff; }
  .goal-dur {
    display: inline-block; margin-top: 8px; font-size: 12px; padding: 4px 12px;
    border-radius: 20px; background: rgba(192,98,62,0.2); border: 1px solid rgba(192,98,62,0.4); color: #e8855a;
  }
  .goal-summary { font-size: 13px; color: rgba(255,255,255,0.45); line-height: 1.7; margin-bottom: 16px; }
  .goal-sections { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  @media (max-width: 500px) { .goal-sections { grid-template-columns: 1fr; } }
  .req-item { display: flex; gap: 10px; font-size: 12px; color: rgba(255,255,255,0.6); padding: 4px 0; line-height: 1.5; border-bottom: 1px solid rgba(255,255,255,0.05); }
  .req-item:last-child { border-bottom: none; }
  .req-arrow { color: #e8855a; flex-shrink: 0; }

  /* Footer */
  .footer {
    margin-top: 40px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.06);
    display: flex; justify-content: space-between; align-items: center;
    font-size: 11px; color: rgba(255,255,255,0.18);
  }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div>
      <div class="logo">Next<span>Path</span></div>
      <div style="font-size:12px;color:rgba(255,255,255,0.3);margin-top:4px">Персональный план развития</div>
    </div>
    <div class="header-meta">
      nextpath.su<br>
      Создан: ${date}
    </div>
  </div>

  <!-- Goal summary at top -->
  <div class="goal-node" style="margin-bottom:8px">
    <div class="goal-header">
      <div class="goal-icon">🏆</div>
      <div>
        <div class="goal-label">Цель</div>
        <div class="goal-title">${esc(profession)}</div>
        ${roadmapData.total_duration ? `<div class="goal-dur">⏱ ${esc(roadmapData.total_duration)}</div>` : ""}
      </div>
    </div>
    ${roadmapData.summary ? `<p class="goal-summary">${esc(roadmapData.summary)}</p>` : ""}
    ${(fg?.requirements?.length || fg?.portfolio?.length) ? `
    <div class="goal-sections">
      ${fg?.requirements?.length ? `<div>
        <div class="section-label" style="color:#e8855a">Требования работодателей</div>
        ${requirementsHTML}
      </div>` : ""}
      ${fg?.portfolio?.length ? `<div>
        <div class="section-label" style="color:#e8855a">Портфолио</div>
        ${portfolioHTML}
      </div>` : ""}
    </div>` : ""}
  </div>

  <!-- Life system block -->
  ${roadmapData.life_system ? `
  <div style="margin:12px 0 8px;padding:18px 20px;border-radius:14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08)">
    <div style="font-size:10px;color:rgba(255,255,255,0.25);text-transform:uppercase;letter-spacing:2px;margin-bottom:12px">🎯 Система жизни на весь путь</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      ${Object.entries(roadmapData.life_system).map(([key, val]) => {
        const icons: Record<string, string> = { time_management: "⏰", daily_ritual: "🌅", weekly_review: "📊", energy_management: "⚡", tracking: "📈" };
        const names: Record<string, string> = { time_management: "Тайм-менеджмент", daily_ritual: "Ритуалы дня", weekly_review: "Ревью недели", energy_management: "Управление энергией", tracking: "Трекинг прогресса" };
        return `<div style="padding:10px 12px;border-radius:10px;background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.06)">
          <div style="font-size:10px;color:rgba(255,255,255,0.25);margin-bottom:4px">${icons[key] || "•"} ${names[key] || key}</div>
          <p style="font-size:11px;color:rgba(255,255,255,0.5);margin:0;line-height:1.5">${esc(String(val))}</p>
        </div>`;
      }).join("")}
    </div>
  </div>` : ""}

  <div class="connector"><div class="connector-line" style="background:rgba(192,98,62,0.4)"></div><div class="connector-arrow" style="border-top-color:rgba(192,98,62,0.4)"></div></div>

  <!-- Stages -->
  ${stagesHTML}

  <div class="connector"><div class="connector-line" style="background:rgba(255,255,255,0.1)"></div><div class="connector-arrow" style="border-top-color:rgba(255,255,255,0.1)"></div></div>

  <!-- User start node -->
  <div class="user-node" style="flex-direction:column;align-items:flex-start;gap:12px">
    <div style="display:flex;align-items:center;gap:16px;width:100%">
      <div class="user-avatar">👤</div>
      <div style="flex:1">
        <div class="user-name">${esc(userName || "Вы сейчас")}</div>
        <div class="user-sub">${esc(currentRole || "Текущий уровень")}
          ${skillsUserHTML ? `<span style="color:rgba(255,255,255,0.2)"> · </span>${skillsUserHTML}` : ""}
        </div>
      </div>
      <div class="user-tag">Старт</div>
    </div>
    ${scheduleItems && scheduleItems.length > 0 ? `
    <div style="width:100%">
      <div style="font-size:10px;color:rgba(255,255,255,0.25);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px">
        📅 Текущая занятость
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:6px">
        ${scheduleItems.map((item) => `
          <div style="display:flex;align-items:center;gap:10px;padding:5px 10px;border-radius:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);font-size:12px">
            <span style="color:rgba(255,255,255,0.65);flex:1">${esc(item.activity)}</span>
            <span style="color:rgba(255,255,255,0.35);font-variant-numeric:tabular-nums">${esc(item.from)}–${esc(item.to)}</span>
            <span style="color:rgba(255,255,255,0.2);font-size:10px">${esc(item.days)}</span>
          </div>`).join("")}
      </div>
    </div>` : ""}
  </div>

  <!-- Footer -->
  <div class="footer">
    <span>NextPath — AI-система персонального карьерного сопровождения</span>
    <span>nextpath.su</span>
  </div>
</div>

<script>
  // Toggle stage expand/collapse
  function toggleStage(id) {
    const body = document.getElementById(id + '-body');
    const icon = document.getElementById(id + '-icon');
    const isOpen = body.classList.toggle('open');
    icon.classList.toggle('open', isOpen);
  }

  // Switch tabs inside a stage
  function switchTab(stageId, tabName, btn) {
    // Deactivate all tabs and panes in this stage
    const stage = document.getElementById(stageId);
    stage.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    stage.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    // Activate selected
    btn.classList.add('active');
    document.getElementById(stageId + '-' + tabName).classList.add('active');
  }

  // Auto-open first incomplete stage
  document.addEventListener('DOMContentLoaded', function() {
    const stages = document.querySelectorAll('.stage-node:not(.completed)');
    if (stages.length > 0) {
      const firstId = stages[0].id;
      const body = document.getElementById(firstId + '-body');
      const icon = document.getElementById(firstId + '-icon');
      if (body) { body.classList.add('open'); icon.classList.add('open'); }
    } else {
      // All completed — open last
      const all = document.querySelectorAll('.stage-node');
      if (all.length > 0) {
        const lastId = all[all.length - 1].id;
        const body = document.getElementById(lastId + '-body');
        const icon = document.getElementById(lastId + '-icon');
        if (body) { body.classList.add('open'); icon.classList.add('open'); }
      }
    }
  });
</script>
</body>
</html>`;
}

// Download

interface DownloadOptions {
  roadmapData: RoadmapData;
  userName: string;
  targetProfession: string;
  currentRole?: string;
  technicalSkills?: string[];
  completedStages?: number[];
}

export function downloadRoadmapHTML(opts: DownloadOptions): void {
  const html = generateRoadmapHTML(opts);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nextpath-${opts.targetProfession || "roadmap"}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
