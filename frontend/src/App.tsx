import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { Loader2, Sparkles } from "lucide-react";
import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import Shared from "./pages/Shared";
import NotFound from "./pages/NotFound";
import { Logo } from "./components/Logo";
import { IS_CABINET_DOMAIN, IS_DEV, CABINET_ORIGIN } from "./lib/urls";
import { isAuthenticated, setToken, setUser } from "./lib/auth";

// Авторизация между поддоменами
// nextpath.su и my.nextpath.su имеют разные localStorage.
// Токен передаётся во фрагменте URL, который не отправляется серверу.
if (IS_CABINET_DOMAIN) {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const urlToken = params.get("token");
  if (urlToken) {
    setToken(urlToken);
    window.history.replaceState({}, "", window.location.pathname);
  }
}

const queryClient = new QueryClient();
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

// Страница входа для my.nextpath.su
// Показывается когда пользователь открывает кабинет без авторизации.
// Авторизация происходит прямо здесь, без редиректов.
const CabinetLoginPage = ({ onAuth }: { onAuth: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = async (resp: { credential?: string }) => {
    if (!resp.credential) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: resp.credential }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.detail || `Ошибка ${res.status}`);
      setToken(body.token);
      setUser(body.user);
      onAuth();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex justify-center">
          <Logo size="lg" />
        </div>
        <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-6">
          <div>
            <h1 className="text-2xl font-serif text-foreground mb-2">Личный кабинет</h1>
            <p className="text-sm text-muted-foreground">
              Войдите через Google чтобы увидеть свой план развития
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 text-muted-foreground py-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span>Входим...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <GoogleLogin
                onSuccess={handleSuccess}
                onError={() => setError("Не удалось войти через Google")}
                locale="ru"
                text="signin_with"
                shape="rectangular"
                size="large"
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )}

          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              Нет аккаунта?{" "}
              <a
                href={IS_DEV ? "/onboarding" : (import.meta.env.VITE_MAIN_URL || "https://nextpath.su") + "/onboarding"}
                className="text-primary hover:underline"
              >
                Создать план развития
              </a>
            </p>
          </div>
        </div>

        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            NextPath — AI-система карьерного сопровождения
          </div>
        </div>
      </div>
    </div>
  );
};

// Проверка авторизации в кабинете
// Вместо редиректа показывает страницу входа прямо на my.nextpath.su.
const CabinetGuard = ({ children }: { children: React.ReactNode }) => {
  const [authed, setAuthed] = useState(isAuthenticated());
  if (!authed) {
    return <CabinetLoginPage onAuth={() => setAuthed(true)} />;
  }
  return <>{children}</>;
};

// Перенаправление /profile на поддомен кабинета
const ProfileRedirect = () => {
  if (!IS_DEV) {
    window.location.replace(CABINET_ORIGIN + "/profile");
    return null;
  }
  return <Profile />;
};

// Маршруты my.nextpath.su
const CabinetRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/profile" replace />} />
    <Route path="/profile" element={<CabinetGuard><Profile /></CabinetGuard>} />
    <Route path="/shared/:id" element={<Shared />} />
    <Route path="*" element={<Navigate to="/profile" replace />} />
  </Routes>
);

// Маршруты nextpath.su
const MainRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/onboarding" element={<Onboarding />} />
    <Route path="/shared/:id" element={<Shared />} />
    <Route path="/profile" element={<ProfileRedirect />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {IS_CABINET_DOMAIN ? <CabinetRoutes /> : <MainRoutes />}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </GoogleOAuthProvider>
);

export default App;
