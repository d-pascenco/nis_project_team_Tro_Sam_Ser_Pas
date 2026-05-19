import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormCard } from "@/components/FormCard";
import { Plus, X, Clock } from "lucide-react";
import type { ScheduleItem } from "@/types";

interface ScheduleStepProps {
  data: { scheduleItems: ScheduleItem[] };
  onChange: (data: { scheduleItems: ScheduleItem[] }) => void;
}

const PRESETS: Array<Omit<ScheduleItem, "id"> & { label: string }> = [
  { label: "Работа",         activity: "Работа",         from: "09:00", to: "18:00", days: "Пн-Пт" },
  { label: "Учёба/вуз",      activity: "Учёба/вуз",      from: "09:00", to: "15:00", days: "Пн-Пт" },
  { label: "Сон",            activity: "Сон",            from: "23:00", to: "07:00", days: "Ежедневно" },
  { label: "Тренировки",     activity: "Тренировки",     from: "07:00", to: "08:00", days: "Вт/Чт/Сб" },
  { label: "Дети/семья",     activity: "Дети/семья",     from: "17:00", to: "21:00", days: "Ежедневно" },
  { label: "Обед",           activity: "Обед",           from: "13:00", to: "14:00", days: "Пн-Пт" },
  { label: "Дорога",         activity: "Дорога",         from: "08:00", to: "09:00", days: "Пн-Пт" },
  { label: "Домашние дела",  activity: "Домашние дела",  from: "20:00", to: "22:00", days: "Ежедневно" },
];

const DAYS_OPTIONS = [
  "Ежедневно",
  "Пн-Пт",
  "Пн/Ср/Пт",
  "Вт/Чт",
  "Вт/Чт/Сб",
  "Только выходные",
  "Сб-Вс",
  "Только суббота",
  "Только воскресенье",
];

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

const DAYS_COUNT: Record<string, number> = {
  "Ежедневно": 7,
  "Пн-Пт": 5,
  "Пн/Ср/Пт": 3,
  "Вт/Чт": 2,
  "Вт/Чт/Сб": 3,
  "Только выходные": 2,
  "Сб-Вс": 2,
  "Только суббота": 1,
  "Только воскресенье": 1,
};

const toMinutes = (t: string): number => {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

const calcBusyHours = (items: ScheduleItem[]): number => {
  let total = 0;
  for (const item of items) {
    const from = toMinutes(item.from);
    const to = toMinutes(item.to);
    const duration = to > from ? to - from : 24 * 60 - from + to;
    total += duration * (DAYS_COUNT[item.days] ?? 7);
  }
  return Math.round(total / 60);
};

export const ScheduleStep = ({ data, onChange }: ScheduleStepProps) => {
  const items = data.scheduleItems || [];

  const addPreset = (preset: typeof PRESETS[0]) => {
    if (items.some((i) => i.activity === preset.activity)) return;
    onChange({
      scheduleItems: [...items, { id: newId(), activity: preset.activity, from: preset.from, to: preset.to, days: preset.days }],
    });
  };

  const addEmpty = () => {
    onChange({
      scheduleItems: [...items, { id: newId(), activity: "", from: "09:00", to: "18:00", days: "Пн-Пт" }],
    });
  };

  const remove = (id: string) => {
    onChange({ scheduleItems: items.filter((i) => i.id !== id) });
  };

  const update = (id: string, field: keyof ScheduleItem, value: string) => {
    onChange({ scheduleItems: items.map((i) => (i.id === id ? { ...i, [field]: value } : i)) });
  };

  return (
    <FormCard title="Ваше текущее расписание">
      <div className="space-y-6">

        {/* Explanation */}
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/15">
          <p className="text-sm text-foreground font-medium mb-1">
            Зачем заполнять?
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            AI подстроит расписание обучения только под ваши свободные окна — без конфликтов с работой, сном и другими делами. Без этого блока план будет типовым.
          </p>
        </div>

        {/* Quick add presets */}
        <div>
          <Label className="text-xs text-muted-foreground block mb-2">Быстро добавить:</Label>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button
                key={p.label}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addPreset(p)}
                disabled={items.some((i) => i.activity === p.activity)}
                className="text-xs h-8"
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Items list */}
        {items.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Ваша занятость:</Label>
            {items.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-border bg-secondary/20 space-y-2"
              >
                {/* Row 1: название + кнопка удаления */}
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Название активности (Работа, Сон, Тренировка...)"
                    value={item.activity}
                    onChange={(e) => update(item.id, "activity", e.target.value)}
                    className={`h-9 flex-1 ${!item.activity.trim() ? "border-destructive/50" : ""}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => remove(item.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Row 2: время + дни */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Time range */}
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="time"
                      value={item.from}
                      onChange={(e) => update(item.id, "from", e.target.value)}
                      className="h-8 text-sm"
                      style={{ minWidth: 120 }}
                    />
                    <span className="text-muted-foreground text-sm">—</span>
                    <Input
                      type="time"
                      value={item.to}
                      onChange={(e) => update(item.id, "to", e.target.value)}
                      className="h-8 text-sm"
                      style={{ minWidth: 120 }}
                    />
                  </div>

                  {/* Days */}
                  <Select value={item.days} onValueChange={(v) => update(item.id, "days", v)}>
                    <SelectTrigger className="h-8 w-36 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OPTIONS.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add button */}
        <Button
          type="button"
          variant="outline"
          onClick={addEmpty}
          className="w-full border-dashed"
        >
          <Plus className="w-4 h-4" />
          Добавить свою занятость
        </Button>

        {/* Free hours summary */}
        {items.length > 0 && (() => {
          const busy = calcBusyHours(items);
          const free = Math.max(0, 168 - busy);
          return (
            <div className="p-4 rounded-xl border border-border bg-secondary/30 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> Всего в неделе
                </span>
                <span className="font-medium text-foreground">168 ч</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Занято по расписанию</span>
                <span className="font-medium text-foreground">−{busy} ч</span>
              </div>
              <div className="border-t border-border/60 pt-3 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Свободно для учёбы</span>
                <span className={`text-lg font-bold ${free >= 10 ? "text-emerald-500" : free >= 5 ? "text-amber-500" : "text-destructive"}`}>
                  {free} ч/нед
                </span>
              </div>
            </div>
          );
        })()}

        {/* Empty hint */}
        {items.length === 0 && (
          <div className="text-center py-2 text-sm text-muted-foreground">
            <Clock className="w-7 h-7 mx-auto mb-2 opacity-25" />
            Добавьте хотя бы 2-3 блока занятости для точного расписания
          </div>
        )}
      </div>
    </FormCard>
  );
};
