import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { StepIndicator } from "@/components/StepIndicator";
import { BasicInfoStep } from "@/components/steps/BasicInfoStep";
import { EducationStep } from "@/components/steps/EducationStep";
import { GoalsStep } from "@/components/steps/GoalsStep";
import { SkillsStep } from "@/components/steps/SkillsStep";
import { ConstraintsStep } from "@/components/steps/ConstraintsStep";
import { ScheduleStep } from "@/components/steps/ScheduleStep";
import { RoadmapPreview } from "@/components/RoadmapPreview";
import { RoadmapGenerating } from "@/components/RoadmapGenerating";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { RoadmapData, OnboardingFormData } from "@/types";

const steps = [
  "О вас",
  "Образование",
  "Цели",
  "Навыки",
  "Ограничения",
  "Расписание",
];

const initialFormData: OnboardingFormData = {
  fullName: "",
  age: "",
  location: "",
  currentStatus: "",
  education: "",
  university: "",
  specialization: "",
  yearsExperience: "",
  currentRole: "",
  cvSummary: "",
  targetProfession: "",
  targetIndustry: "",
  timeline: "",
  motivation: "",
  priorities: [],
  technicalSkills: [],
  softSkills: [],
  targetHardSkills: [],
  targetSoftSkills: [],
  languages: [],
  learningStyle: "",
  hoursPerWeek: 15,
  budget: "",
  healthConsiderations: "",
  preferOnline: true,
  preferRussian: true,
  needMentorship: false,
  additionalInfo: "",
  country: "",
  scheduleItems: [],
  privacyAccepted: false,
};

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<OnboardingFormData>(initialFormData);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [showGenerating, setShowGenerating] = useState(false);
  const generatingStart = useRef<number>(0);

  const updateFormData = (data: Partial<OnboardingFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setValidationError(null);
  };

  const getStepError = (): string | null => {
    switch (currentStep) {
      case 0:
        if (!formData.fullName.trim()) return "Введите полное имя";
        if (!formData.age) return "Укажите возраст";
        if (!formData.country.trim()) return "Укажите страну";
        if (!formData.location.trim()) return "Укажите город";
        if (!formData.currentStatus) return "Выберите текущий статус";
        return null;
      case 1:
        if (!formData.education) return "Выберите уровень образования";
        if (!formData.university.trim()) return "Укажите учебное заведение";
        if (!formData.specialization.trim()) return "Укажите специальность";
        if (!formData.yearsExperience) return "Укажите опыт работы";
        if (formData.cvSummary.trim().length < 300)
          return `Краткое описание CV: минимум 300 символов (сейчас ${formData.cvSummary.trim().length})`;
        return null;
      case 2:
        if (!formData.targetProfession) return "Выберите желаемую профессию";
        if (!formData.targetIndustry) return "Выберите целевую индустрию";
        if (!formData.timeline) return "Выберите желаемый срок";
        if (formData.priorities.length === 0) return "Выберите хотя бы один приоритет в карьере";
        if (formData.motivation.trim().length < 50)
          return `Опишите мотивацию: минимум 50 символов (сейчас ${formData.motivation.trim().length})`;
        return null;
      default:
        return null;
    }
  };

  // Переход к роудмапу — управляется здесь, не внутри RoadmapGenerating
  // Когда API завершён, ждём MIN_MS с момента старта генерации, потом показываем роудмап
  useEffect(() => {
    if (!showGenerating || roadmapLoading) return;         // ещё не готово
    const elapsed = Date.now() - generatingStart.current;
    const MIN_MS = 4500;
    const wait = Math.max(0, MIN_MS - elapsed) + 500;     // мин. 4.5с + fade 0.5с

    const t = setTimeout(() => {
      setShowGenerating(false);
      setShowRoadmap(true);
    }, wait);
    return () => clearTimeout(t);
  }, [showGenerating, roadmapLoading]);

  const submitForm = async () => {
    generatingStart.current = Date.now();
    setRoadmapLoading(true);
    setShowGenerating(true);

    // Фильтруем незаполненные блоки расписания перед отправкой
    const cleanedFormData = {
      ...formData,
      scheduleItems: formData.scheduleItems.filter((s) => s.activity.trim()),
    };

    // Сохранение анкеты не блокирует генерацию плана.
    fetch("/api/forms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cleanedFormData),
    }).catch(() => {});

    try {
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedFormData),
      });
      if (res.ok) {
        const data = await res.json();
        setRoadmapData(data);
      } else {
        const body = await res.json().catch(() => ({}));
        const detail = body.detail || "Не удалось создать план. Попробуйте ещё раз.";
        setValidationError(detail);
        setShowGenerating(false);
        return;
      }
    } catch {
      setValidationError("Не удалось связаться с сервисом генерации. Проверьте соединение и попробуйте ещё раз.");
      setShowGenerating(false);
      return;
    } finally {
      setRoadmapLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const error = getStepError();
      if (error) {
        setValidationError(error);
        return;
      }
      setValidationError(null);
      setCurrentStep((prev) => prev + 1);
    } else {
      submitForm();
    }
  };

  const handleBack = () => {
    setValidationError(null);
    if (showGenerating) return;
    if (showRoadmap) {
      setShowRoadmap(false);
    } else if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      navigate("/");
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <BasicInfoStep
            data={{
              fullName: formData.fullName,
              age: formData.age,
              location: formData.location,
              currentStatus: formData.currentStatus,
              country: formData.country || "",
            }}
            onChange={updateFormData}
          />
        );
      case 1:
        return (
          <EducationStep
            data={{
              education: formData.education,
              university: formData.university,
              specialization: formData.specialization,
              yearsExperience: formData.yearsExperience,
              currentRole: formData.currentRole,
              cvSummary: formData.cvSummary,
            }}
            onChange={updateFormData}
          />
        );
      case 2:
        return (
          <GoalsStep
            data={{
              targetProfession: formData.targetProfession,
              targetIndustry: formData.targetIndustry,
              timeline: formData.timeline,
              motivation: formData.motivation,
              priorities: formData.priorities,
            }}
            onChange={updateFormData}
          />
        );
      case 3:
        return (
          <SkillsStep
            data={{
              technicalSkills: formData.technicalSkills,
              softSkills: formData.softSkills,
              targetHardSkills: formData.targetHardSkills,
              targetSoftSkills: formData.targetSoftSkills,
              languages: formData.languages,
              learningStyle: formData.learningStyle,
            }}
            onChange={updateFormData}
          />
        );
      case 4:
        return (
          <ConstraintsStep
            data={{
              hoursPerWeek: formData.hoursPerWeek,
              budget: formData.budget,
              healthConsiderations: formData.healthConsiderations,
              preferOnline: formData.preferOnline,
              preferRussian: formData.preferRussian,
              needMentorship: formData.needMentorship,
              additionalInfo: formData.additionalInfo,
            }}
            onChange={updateFormData}
          />
        );
      case 5:
        return (
          <ScheduleStep
            data={{ scheduleItems: formData.scheduleItems }}
            onChange={updateFormData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Logo size="sm" />
            {!showRoadmap && (
              <div className="text-sm text-muted-foreground">
                Шаг {currentStep + 1} из {steps.length}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Экран генерации — полноэкранный overlay */}
      {showGenerating && (
        <RoadmapGenerating
          targetProfession={
            { frontend: "Frontend Developer", backend: "Backend Developer", fullstack: "Fullstack Developer",
              "data-scientist": "Data Scientist", "ml-engineer": "ML Engineer", devops: "DevOps Engineer",
              product: "Product Manager", designer: "UX/UI Designer", analyst: "Business Analyst", qa: "QA Engineer",
            }[formData.targetProfession] || formData.targetProfession
          }
          isLoadingDone={!roadmapLoading}
        />
      )}

      <main className="container mx-auto px-6 py-12 max-w-2xl">
        {!showRoadmap ? (
          <>
            {/* Step indicator */}
            <div className="mb-10">
              <StepIndicator steps={steps} currentStep={currentStep} />
            </div>

            {/* Form content */}
            <div className="mb-10">{renderStep()}</div>

            {/* Validation error */}
            {validationError && (
              <p className="text-sm text-destructive text-center mb-4">
                {validationError}
              </p>
            )}

            {/* Privacy consent — only on last step */}
            {currentStep === steps.length - 1 && (
              <label className="flex items-start gap-3 cursor-pointer mb-4 p-4 rounded-xl bg-secondary/30 border border-border">
                <input
                  type="checkbox"
                  checked={formData.privacyAccepted}
                  onChange={(e) => updateFormData({ privacyAccepted: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded border-border accent-primary shrink-0"
                />
                <span className="text-sm text-muted-foreground leading-relaxed">
                  Нажимая «Создать карту», я соглашаюсь с{" "}
                  <a href="/privacy" target="_blank" className="text-primary underline underline-offset-2 hover:no-underline">
                    политикой обработки персональных данных
                  </a>{" "}
                  и даю согласие на обработку введённых данных в целях формирования персонального плана развития.
                </span>
              </label>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4" />
                Назад
              </Button>
              <Button
                variant="hero"
                onClick={handleNext}
                disabled={currentStep === steps.length - 1 && !formData.privacyAccepted}
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Создать карту
                  </>
                ) : (
                  <>
                    Далее
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <ErrorBoundary>
            <RoadmapPreview
              userData={{
                fullName: formData.fullName || "Пользователь",
                targetProfession: formData.targetProfession,
                timeline: formData.timeline,
              }}
              roadmapData={roadmapData}
              isLoading={false}
              formSnapshot={formData}
            />
            <div className="mt-10 text-center">
              <Button variant="ghost" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4" />
                Вернуться к редактированию
              </Button>
            </div>
          </ErrorBoundary>
        )}
      </main>
    </div>
  );
};

export default Onboarding;
