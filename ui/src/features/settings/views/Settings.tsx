import { Shield, Server, Palette, Trash2, Key, Database, Sun, Moon, Zap, Eye, RotateCcw } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useOnboardingTour } from '@/components/shared/OnboardingTour';

export function Settings() {
  const { theme, setTheme } = useTheme();
  const { resetTour, startTour } = useOnboardingTour();

  const handleRestartTour = () => {
    resetTour();
    // Small delay to allow state to update
    setTimeout(() => startTour(), 100);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      <header>
        <h2 className="text-3xl font-extrabold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your workspace, API keys, and system appearance.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Appearance Section */}
        <SettingsCard
          title="Appearance"
          description="Customize the visual experience of your workspace."
          icon={Palette}
        >
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
              <span className="text-sm font-medium">Theme Mode</span>
              <div className="flex bg-black/20 rounded-lg p-1">
                <button
                  onClick={() => setTheme('light')}
                  className={cn("p-1.5 rounded-md transition-all", theme === 'light' ? "bg-white shadow-sm text-black" : "text-muted-foreground hover:text-foreground")}
                >
                  <Sun className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={cn("p-1.5 rounded-md transition-all", theme === 'dark' ? "bg-[var(--primary)] text-white" : "text-muted-foreground hover:text-foreground")}
                >
                  <Moon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setTheme('midnight')}
                  className={cn("p-1.5 rounded-md transition-all", theme === 'midnight' ? "bg-slate-700 text-white" : "text-muted-foreground hover:text-foreground")}
                >
                  <Zap className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
              <div className="flex flex-col">
                <span className="text-sm font-medium">Product Tour</span>
                <span className="text-[10px] text-muted-foreground">Replay the onboarding walkthrough</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRestartTour}
                className="rounded-xl border-white/10 hover:bg-white/5"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Restart
              </Button>
            </div>
          </div>
        </SettingsCard>

        {/* API Credentials */}
        <SettingsCard 
          title="API Configuration" 
          description="Configure keys for Claude, OpenAI, and GitHub integrations."
          icon={Key}
        >
          <div className="space-y-3 pt-2">
            <ApiInputField label="OpenClaw API Key" placeholder="sk-oc-••••••••••••••••" />
            <ApiInputField label="GitHub Personal Token" placeholder="ghp_••••••••••••••••" />
            <ApiInputField label="Ollama Endpoint" placeholder="http://localhost:11434" />
          </div>
        </SettingsCard>

        {/* Database & Storage */}
        <SettingsCard 
          title="Storage & Data" 
          description="Manage your local SQLite database and sync options."
          icon={Database}
        >
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5">
              <div className="flex flex-col">
                <span className="text-sm font-bold">Local SQLite</span>
                <span className="text-[10px] text-muted-foreground">/data/glinr.db (1.2 MB)</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">CONNECTED</span>
            </div>
            <Button variant="outline" className="w-full rounded-xl border-white/5 hover:bg-white/5 flex items-center gap-2">
              <Server className="h-4 w-4" />
              Connect to Turso Cloud
            </Button>
          </div>
        </SettingsCard>

        {/* Security / System */}
        <SettingsCard 
          title="System Security" 
          description="Manage permissions and experimental features."
          icon={Shield}
        >
          <div className="space-y-3 pt-2">
            <ToggleOption label="Autonomous Execution" description="Allow agents to run without approval" />
            <ToggleOption label="Telemetry" description="Send anonymous usage data to improve GLINR" defaultChecked />
          </div>
        </SettingsCard>

        {/* Danger Zone */}
        <div className="col-span-full mt-4">
          <div className="glass-heavy rounded-[24px] p-6 border-red-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-500">Danger Zone</h3>
                <p className="text-xs text-muted-foreground">Permanent actions that cannot be undone.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button variant="destructive" className="rounded-xl px-6 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                Clear Task History
              </Button>
              <Button variant="destructive" className="rounded-xl px-6">
                Reset All Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsCard({ title, description, icon: Icon, children }: { title: string, description: string, icon: any, children: React.ReactNode }) {
  return (
    <div className="glass rounded-[24px] p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl glass-heavy flex items-center justify-center border-white/10">
          <Icon className="h-5 w-5 text-[var(--primary)]" />
        </div>
        <div>
          <h3 className="text-lg font-bold leading-tight">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}

function ApiInputField({ label, placeholder }: { label: string, placeholder: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">{label}</label>
      <div className="relative group">
        <input 
          type="password" 
          placeholder={placeholder}
          className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all group-hover:bg-white/10"
        />
        <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          <Eye className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ToggleOption({ label, description, defaultChecked }: { label: string, description: string, defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between p-1">
      <div className="flex flex-col">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-[10px] text-muted-foreground">{description}</span>
      </div>
      <button className={cn(
        "w-10 h-6 rounded-full transition-all relative p-1",
        defaultChecked ? "bg-[var(--primary)]" : "bg-white/10"
      )}>
        <div className={cn(
          "h-4 w-4 rounded-full bg-white transition-all shadow-sm",
          defaultChecked ? "translate-x-4" : "translate-x-0"
        )} />
      </button>
    </div>
  );
}
