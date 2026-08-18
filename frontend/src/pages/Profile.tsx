import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { goToMainSite } from "@/lib/urls";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { authHeaders, clearToken, getUser, isAuthenticated, setUser, AuthUser } from "@/lib/auth";
import type { RoadmapData, OnboardingFormData, RoadmapResource } from "@/types";
import { STAGE_COLORS, getResourceUrl } from "@/lib/constants";
import { ProfileEditForm } from "@/components/ProfileEditForm";
import { RoadmapVisual, RoadmapVisualButton } from "@/components/RoadmapVisual";
import {
  LogOut, User, Map, Settings, LayoutDashboard, Clock, CheckCircle2,
  ExternalLink, ChevronRight, Pencil, Check, X, RefreshCw,
  BookOpen, Award, Target, Sparkles, Download,
} from "lucide-react";

// Types

interface UserData extends AuthUser {
  roadmap: RoadmapData | null;
  form_data: Partial<OnboardingFormData> | null;
  completed_stages: number[];
}

const downloadProfileHTML = (userData: UserData) => {
  if (!userData.roadmap) return;
  import("@/lib/generate-html").then(({ downloadRoadmapHTML }) => {
    downloadRoadmapHTML({
      roadmapData: userData.roadmap!,
      userName: userData.name || "",
      targetProfession: userData.form_data?.targetProfession || "",
      currentRole: userData.form_data?.currentRole,
      technicalSkills: userData.form_data?.technicalSkills,
      scheduleItems: userData.form_data?.scheduleItems,
    });
  });
};

type Section = "overview" | "roadmap" | "profile" | "settings";

// Helpers


// Main component

const Profile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<Section>("overview");
  const [completedStages, setCompletedStages] = useState<number[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [visualOpen, setVisualOpen] = useState(false);
  const [directRecalculating, setDirectRecalculating] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const progressSaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load user

  useEffect(() => {
    if (!isAuthenticated()) { navigate("/"); return; }
    fetch("/api/me", { headers: authHeaders() })
      .then((r) => {
        if (r.status === 401 || r.status === 403) {
          clearToken();
          navigate("/");
          return null;
        }
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setUserData(data);
        setCompletedStages(data.completed_stages || []);
        setNameInput(data.name || "");
      })
      .catch((e) => {
        console.error("[profile] load error:", e);
        setLoadError("Не удалось загрузить профиль. Проверьте соединение и попробуйте снова.");
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  // Progress save (debounced)

  const toggleStage = (stageId: number) => {
    const updated = completedStages.includes(stageId)
      ? completedStages.filter((id) => id !== stageId)
      : [...completedStages, stageId];
    setCompletedStages(updated);
    if (progressSaveTimeout.current) clearTimeout(progressSaveTimeout.current);
    progressSaveTimeout.current = setTimeout(() => {
      fetch("/api/me/progress", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ completed_stages: updated }),
      }).catch(console.error);
    }, 600);
  };

  // Name edit

  const saveName = async () => {
    if (!nameInput.trim()) return;
    setSavingName(true);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ name: nameInput }),
      });
      if (res.ok) {
        const localUser = getUser();
        if (localUser) {
          const updated = { ...localUser, name: nameInput };
          setUser(updated);
          setUserData((prev) => prev ? { ...prev, name: nameInput } : prev);
        }
        setEditingName(false);
      }
    } catch (e) { console.error(e); }
    finally { setSavingName(false); }
  };

  const handleDirectRecalculate = async () => {
    if (!userData?.form_data) return;
    setDirectRecalculating(true);
    try {
      const res = await fetch("/api/me/recalculate", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ form_data: userData.form_data }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.detail || "Ошибка");
      setUserData((prev) => prev ? { ...prev, roadmap: body } : prev);
      setCompletedStages([]);
      setSection("roadmap");
    } catch (e) {
      console.error("Recalculate error:", e);
    } finally {
      setDirectRecalculating(false);
    }
  };

  const handleLogout = () => { clearToken(); goToMainSite(); };

  // Guards

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        <Sparkles className="w-5 h-5 animate-pulse text-primary mr-2" /> Загрузка кабинета...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center gap-4">
        <p className="text-muted-foreground">{loadError}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Обновить</Button>
      </div>
    );
  }

  if (!userData) return null;

  const stages = userData.roadmap?.stages ?? [];
  const totalStages = stages.length;
  const doneCount = completedStages.length;
  const progressPct = totalStages > 0 ? Math.round((doneCount / totalStages) * 100) : 0;
  const currentStage = stages.find((s) => !completedStages.includes(s.id));

  // Sidebar nav

  const navItems: { id: Section; icon: React.ElementType; label: string }[] = [
    { id: "overview", icon: LayoutDashboard, label: "Обзор" },
    { id: "roadmap", icon: Map, label: "Мой план" },
    { id: "profile", icon: User, label: "Профиль" },
    { id: "settings", icon: Settings, label: "Настройки" },
  ];

  // Render sections

  const renderOverview = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif text-foreground">
          Добро пожаловать, {userData.name?.split(" ")[0] || "пользователь"}!
        </h2>
        <p className="text-muted-foreground mt-1">Ваш карьерный путь в одном месте.</p>
      </div>

      {/* Stats row */}
      {/* Quick action buttons */}
      {userData.roadmap && (
        <div className="flex flex-wrap gap-3">
          <RoadmapVisualButton onClick={() => setVisualOpen(true)} />
          <Button
            variant="outline"
            size="default"
            onClick={() => downloadProfileHTML(userData)}
          >
            <Download className="w-4 h-4" />
            Скачать план
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: BookOpen, label: "Всего этапов", value: totalStages || "—" },
          { icon: CheckCircle2, label: "Выполнено", value: doneCount },
          { icon: Award, label: "Прогресс", value: `${progressPct}%` },
          { icon: Target, label: "Осталось", value: totalStages - doneCount },
        ].map((s) => (
          <div key={s.label} className="p-5 rounded-xl bg-card border border-border text-center">
            <s.icon className="w-5 h-5 mx-auto mb-2 text-primary" />
            <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
            <div className="font-semibold text-foreground">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {totalStages > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">Общий прогресс</span>
            <span className="text-sm text-muted-foreground">{doneCount} / {totalStages} этапов</span>
          </div>
          <Progress value={progressPct} className="h-3" />
          {progressPct === 100 && (
            <p className="text-sm text-primary font-medium">🎉 Все этапы выполнены!</p>
          )}
        </div>
      )}

      {/* Current stage */}
      {currentStage && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-xs text-primary font-medium uppercase tracking-wide mb-1">Текущий этап</p>
              <h3 className="text-lg font-semibold text-foreground">{currentStage.title}</h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Clock className="w-3.5 h-3.5" /> {currentStage.duration}
              </div>
            </div>
            <Button size="sm" onClick={() => setSection("roadmap")}>
              К плану <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {currentStage.skills.map((s) => (
              <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
            ))}
          </div>
        </div>
      )}

      {!userData.roadmap && (
        <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-4">
          <p className="text-muted-foreground">У вас пока нет дорожной карты.</p>
          <Button variant="hero" onClick={() => goToMainSite("/onboarding")}>
            <Sparkles className="w-4 h-4" /> Создать план развития
          </Button>
        </div>
      )}
    </div>
  );

  const renderRoadmap = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-serif text-foreground">Мой план</h2>
        <div className="flex items-center gap-2">
          {totalStages > 0 && (
            <span className="text-sm text-muted-foreground">{doneCount}/{totalStages} выполнено</span>
          )}
          {userData.roadmap && (
            <RoadmapVisualButton onClick={() => setVisualOpen(true)} size="sm" />
          )}
        </div>
      </div>

      {totalStages > 0 && <Progress value={progressPct} className="h-2" />}

      {stages.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Map className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Дорожная карта ещё не создана.</p>
          <Button className="mt-4" variant="hero" onClick={() => goToMainSite("/onboarding")}>
            Создать план
          </Button>
        </div>
      ) : (
        <div className="space-y-0">
          {stages.map((stage, idx) => {
            const done = completedStages.includes(stage.id);
            const color = STAGE_COLORS[idx % STAGE_COLORS.length];
            return (
              <div key={stage.id}>
                <div className={`rounded-2xl border-2 p-5 transition-all ${
                  done ? "bg-secondary/30 border-border/40 opacity-75" : "bg-card border-border"
                }`}>
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleStage(stage.id)}
                      className={`shrink-0 mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        done ? "bg-primary border-primary" : "border-border hover:border-primary"
                      }`}
                    >
                      {done && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold ${color}`}>
                          {String(idx + 1).padStart(2, "0")}
                        </div>
                        <h3 className={`font-semibold ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                          {stage.title}
                        </h3>
                        {done && <Badge variant="secondary" className="text-xs">Выполнено</Badge>}
                      </div>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                        <Clock className="w-3 h-3" /> {stage.duration}
                      </div>

                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1.5">
                          {stage.skills.map((s) => (
                            <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {stage.resources.filter(Boolean).map((r, i) => {
                            const name = typeof r === "string" ? r : (r as RoadmapResource).name ?? "";
                            if (!name) return null;
                            return (
                              <a key={i} href={getResourceUrl(name)} target="_blank" rel="noopener noreferrer">
                                <Badge variant="outline" className="text-xs gap-1 hover:border-primary hover:text-primary transition-colors cursor-pointer">
                                  {name} <ExternalLink className="w-2.5 h-2.5" />
                                </Badge>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {idx < stages.length - 1 && (
                  <div className="flex justify-center py-1">
                    <div className="flex flex-col items-center">
                      <div className="w-px h-4 bg-border" />
                      <div className="w-0 h-0" style={{
                        borderLeft: "4px solid transparent",
                        borderRight: "4px solid transparent",
                        borderTop: "5px solid hsl(var(--border))",
                      }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderProfileSection = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-serif text-foreground">Профиль</h2>

      {/* Avatar + name card */}
      <div className="bg-card border border-border rounded-2xl p-6 flex items-center gap-5">
        {userData.picture ? (
          <img src={userData.picture} alt={userData.name} className="w-16 h-16 rounded-full ring-2 ring-primary/20" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
        )}
        <div className="flex-1">
          {editingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="h-9 max-w-xs"
                onKeyDown={(e) => e.key === "Enter" && saveName()}
                autoFocus
              />
              <Button size="icon" variant="default" className="h-9 w-9" onClick={saveName} disabled={savingName}>
                <Check className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => { setEditingName(false); setNameInput(userData.name || ""); }}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-foreground">{userData.name}</span>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingName(true)}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
          <p className="text-sm text-muted-foreground mt-0.5">{userData.email}</p>
        </div>
      </div>

      {/* Career info */}
      {userData.roadmap && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h3 className="font-semibold text-foreground">Карьерная цель</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Срок достижения", value: userData.roadmap.total_duration },
              { label: "Всего этапов", value: `${totalStages} этапа` },
              { label: "Прогресс", value: `${doneCount} из ${totalStages} выполнено` },
            ].filter((r) => r.value).map((row) => (
              <div key={row.label} className="space-y-1">
                <p className="text-xs text-muted-foreground">{row.label}</p>
                <p className="text-sm font-medium text-foreground">{row.value}</p>
              </div>
            ))}
          </div>
          {userData.roadmap.summary && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Описание плана</p>
              <p className="text-sm text-foreground leading-relaxed">{userData.roadmap.summary}</p>
            </div>
          )}
        </div>
      )}

      {/* Account info */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Учётные данные</h3>
        <div className="space-y-3">
          {[
            { label: "Email", value: userData.email },
            { label: "Аутентификация", value: "Google" },
            { label: "ID пользователя", value: `#${userData.id}` },
          ].map((row) => (
            <div key={row.label} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
              <span className="text-sm text-muted-foreground">{row.label}</span>
              <span className="text-sm font-medium text-foreground">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-serif text-foreground">Настройки</h2>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Имя отображения</h3>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Label htmlFor="name-setting" className="text-xs text-muted-foreground mb-1.5 block">Имя</Label>
            <Input
              id="name-setting"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Ваше имя"
              className="max-w-xs"
            />
          </div>
          <Button onClick={saveName} disabled={savingName} className="mt-5">
            {savingName ? "Сохраняем..." : "Сохранить"}
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Дорожная карта</h3>
        <p className="text-sm text-muted-foreground">
          Отредактируйте данные профиля и пересчитайте план прямо здесь.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => setEditFormOpen(true)}>
            <Pencil className="w-4 h-4" /> Редактировать профиль
          </Button>
          <Button
            variant="hero"
            onClick={handleDirectRecalculate}
            disabled={directRecalculating || !userData?.form_data}
          >
            {directRecalculating
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Пересчитываем...</>
              : <><RefreshCw className="w-4 h-4" /> Обновить план</>
            }
          </Button>
        </div>
      </div>

      <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6 space-y-3">
        <h3 className="font-semibold text-foreground">Выход из аккаунта</h3>
        <p className="text-sm text-muted-foreground">Ваши данные и прогресс сохранятся.</p>
        <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/5" onClick={handleLogout}>
          <LogOut className="w-4 h-4" /> Выйти
        </Button>
      </div>
    </div>
  );

  // Layout

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            {userData.picture && (
              <img src={userData.picture} alt={userData.name} className="w-8 h-8 rounded-full ring-2 ring-primary/20" />
            )}
            <span className="text-sm text-muted-foreground hidden sm:block">{userData.name}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex gap-6">

          {/* Sidebar */}
          <aside className="hidden md:flex flex-col w-56 shrink-0">
            <nav className="space-y-1 sticky top-24">
              {navItems.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setSection(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    section === id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Mobile tabs */}
          <div className="md:hidden w-full mb-6">
            <div className="flex overflow-x-auto gap-1 pb-1 scrollbar-hide">
              {navItems.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setSection(id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
                    section === id ? "bg-primary/10 text-primary" : "text-muted-foreground bg-secondary"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {section === "overview" && renderOverview()}
            {section === "roadmap" && renderRoadmap()}
            {section === "profile" && renderProfileSection()}
            {section === "settings" && renderSettings()}
          </main>
        </div>
      </div>

      {/* Форма редактирования профиля */}
      <ProfileEditForm
        open={editFormOpen}
        onClose={() => setEditFormOpen(false)}
        initialData={userData.form_data ?? {}}
        onRoadmapUpdated={(newRoadmap) => {
          setUserData((prev) => prev ? { ...prev, roadmap: newRoadmap } : prev);
          setCompletedStages([]);
          setSection("roadmap");
        }}
      />

      {/* Визуальный роудмап */}
      {userData.roadmap && (
        <RoadmapVisual
          open={visualOpen}
          onClose={() => setVisualOpen(false)}
          roadmapData={userData.roadmap}
          userName={userData.name || ""}
          targetProfession={userData.form_data?.targetProfession || ""}
          currentRole={userData.form_data?.currentRole || ""}
          technicalSkills={userData.form_data?.technicalSkills}
          scheduleItems={userData.form_data?.scheduleItems}
          completedStages={completedStages}
        />
      )}
    </div>
  );
};

export default Profile;
