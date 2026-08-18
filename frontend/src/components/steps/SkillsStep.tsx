import { useState } from "react";
import { Label } from "@/components/ui/label";
import { FormCard } from "@/components/FormCard";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Autocomplete } from "@/components/Autocomplete";
import { LANGUAGES } from "@/lib/suggestions";
import { Plus, X, BookOpen } from "lucide-react";
import { Slider as SliderUI } from "@/components/ui/slider";

interface SkillsStepProps {
  data: {
    technicalSkills: string[];
    softSkills: string[];
    targetHardSkills: string[];
    targetSoftSkills: string[];
    languages: { name: string; level: number }[];
    learningStyle: string;
  };
  onChange: (data: Partial<SkillsStepProps["data"]>) => void;
}

type SkillField = "technicalSkills" | "softSkills" | "targetHardSkills" | "targetSoftSkills";

const CURRENT_HARD = ["JavaScript", "TypeScript", "Python", "React", "Vue.js", "Node.js", "SQL", "Git", "HTML/CSS", "Docker", "AWS", "Java", "C#", "Go", "PostgreSQL"];
const CURRENT_SOFT = ["Коммуникация", "Командная работа", "Тайм-менеджмент", "Критическое мышление", "Адаптивность", "Лидерство", "Самоорганизация"];
const TARGET_HARD  = ["Machine Learning", "Deep Learning", "Kubernetes", "GraphQL", "TypeScript", "React Native", "Flutter", "Rust", "Scala", "Spark", "Airflow", "Terraform", "Redis", "MongoDB"];
const TARGET_SOFT  = ["Публичные выступления", "Переговоры", "Управление командой", "Системное мышление", "Эмпатия", "Стрессоустойчивость", "Наставничество"];

const LEVEL_MAP: Record<number, string> = { 0: "Начальный", 25: "Базовый", 50: "Средний", 75: "Продвинутый", 100: "Свободный" };
const level = (n: number) => LEVEL_MAP[Math.round(n / 25) * 25] ?? "Средний";


// Reusable skill block

function SkillBlock({
  title, color, bgColor, items, suggestions, placeholder, field, onChange,
}: {
  title: string;
  color: string;
  bgColor: string;
  items: string[];
  suggestions: string[];
  placeholder: string;
  field: SkillField;
  onChange: SkillsStepProps["onChange"];
}) {
  const [input, setInput] = useState("");

  const add = (val: string) => {
    const v = val.trim();
    if (v && !items.includes(v)) onChange({ [field]: [...items, v] });
    setInput("");
  };

  const remove = (s: string) => onChange({ [field]: items.filter((x) => x !== s) });

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const parts = e.clipboardData.getData("text").split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
    if (parts.length > 1) {
      e.preventDefault();
      const unique = parts.filter((p) => !items.includes(p));
      onChange({ [field]: [...items, ...unique] });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
        <span className="text-sm font-medium text-foreground">{title}</span>
        {items.length > 0 && (
          <span className="text-xs text-muted-foreground ml-auto">{items.length}</span>
        )}
      </div>

      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((s) => (
            <Badge key={s} variant="secondary" style={{ background: bgColor, color }}>
              {s}
              <X className="w-3 h-3 ml-1.5 cursor-pointer" onClick={() => remove(s)} />
            </Badge>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add(input)}
          onPaste={handlePaste}
          className="h-9"
        />
        <Button type="button" size="icon" variant="secondary" className="h-9 w-9" onClick={() => add(input)}>
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {suggestions.filter((s) => !items.includes(s)).slice(0, 6).map((s) => (
          <Badge
            key={s}
            variant="outline"
            className="cursor-pointer hover:bg-secondary text-xs transition-colors"
            onClick={() => add(s)}
          >
            + {s}
          </Badge>
        ))}
      </div>
    </div>
  );
}

// Main component

export const SkillsStep = ({ data, onChange }: SkillsStepProps) => {
  const [newLang, setNewLang] = useState("");

  const addLang = () => {
    const v = newLang.trim();
    if (v && !data.languages.find((l) => l.name === v)) {
      onChange({ languages: [...data.languages, { name: v, level: 50 }] });
    }
    setNewLang("");
  };

  const removeLang = (name: string) =>
    onChange({ languages: data.languages.filter((l) => l.name !== name) });

  const updateLangLevel = (name: string, lv: number) =>
    onChange({ languages: data.languages.map((l) => l.name === name ? { ...l, level: lv } : l) });

  return (
    <div className="space-y-4">

      {/* Текущие навыки */}
      <FormCard title="Мои текущие навыки">
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Укажите навыки, которыми владеете уже сейчас.
          </p>
          <SkillBlock
            title="Технические (Hard Skills)"
            color="#c0623e"
            bgColor="rgba(192,98,62,0.1)"
            items={data.technicalSkills}
            suggestions={CURRENT_HARD}
            placeholder="Добавить навык или вставить список..."
            field="technicalSkills"
            onChange={onChange}
          />
          <div className="border-t border-border/50" />
          <SkillBlock
            title="Гибкие (Soft Skills)"
            color="#6384c7"
            bgColor="rgba(99,132,199,0.1)"
            items={data.softSkills}
            suggestions={CURRENT_SOFT}
            placeholder="Добавить навык..."
            field="softSkills"
            onChange={onChange}
          />
        </div>
      </FormCard>

      {/* Хочу освоить */}
      <FormCard title="Хочу освоить">
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Навыки, которые хотите приобрести в процессе обучения.
          </p>
          <SkillBlock
            title="Технические (Hard Skills)"
            color="#8263c7"
            bgColor="rgba(130,99,199,0.1)"
            items={data.targetHardSkills}
            suggestions={TARGET_HARD}
            placeholder="Добавить цель..."
            field="targetHardSkills"
            onChange={onChange}
          />
          <div className="border-t border-border/50" />
          <SkillBlock
            title="Гибкие (Soft Skills)"
            color="#3ea262"
            bgColor="rgba(62,162,98,0.1)"
            items={data.targetSoftSkills}
            suggestions={TARGET_SOFT}
            placeholder="Добавить цель..."
            field="targetSoftSkills"
            onChange={onChange}
          />
        </div>
      </FormCard>

      {/* Языки */}
      <FormCard title="Языки">
        <div className="space-y-4">
          {data.languages.map((lang) => (
            <div key={lang.name} className="p-4 rounded-lg border border-border bg-secondary/30">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-sm">{lang.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{level(lang.level)}</span>
                  <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeLang(lang.name)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <SliderUI
                value={[lang.level]}
                onValueChange={([v]) => updateLangLevel(lang.name, v)}
                max={100} step={25} className="w-full"
              />
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>Начальный</span><span>Свободный</span>
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <Autocomplete
              value={newLang}
              onChange={setNewLang}
              suggestions={LANGUAGES.filter((l) => !data.languages.find((d) => d.name === l))}
              placeholder="Добавить язык..."
            />
            <Button type="button" size="icon" variant="secondary" onClick={addLang} disabled={!newLang.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </FormCard>

      {/* Стиль обучения */}
      <FormCard title="Стиль обучения">
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm">
            <BookOpen className="w-4 h-4 text-primary" />
            Как вам лучше всего усваивается материал?
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "video",    label: "Видео-курсы" },
              { value: "projects", label: "Практические проекты" },
              { value: "books",    label: "Книги и статьи" },
              { value: "mixed",    label: "Смешанный формат" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ learningStyle: opt.value })}
                className={`p-3 rounded-xl border text-sm font-medium transition-all text-left ${
                  data.learningStyle === opt.value
                    ? "border-primary/60 bg-primary/8 text-primary"
                    : "border-border bg-secondary/20 hover:bg-secondary/40 text-muted-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {!data.learningStyle && (
            <p className="text-xs text-muted-foreground">
              Поможет AI подобрать ресурсы в вашем формате
            </p>
          )}
        </div>
      </FormCard>

    </div>
  );
};
