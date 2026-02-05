/**
 * Skills Section - Settings UI
 *
 * View and manage the skills system: browse loaded skills,
 * check eligibility, toggle enable/disable, reload from disk.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Puzzle,
  RefreshCw,
  Check,
  X,
  ChevronRight,
  Loader2,
  Plug,
  Cpu,
  Download,
  ToggleLeft,
  ToggleRight,
  Info,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { API_BASE } from "../constants";

interface SkillItem {
  name: string;
  source: string;
  enabled: boolean;
  eligible: boolean;
  errors: string[];
  emoji?: string;
  description: string;
  userInvocable: boolean;
  modelInvocable: boolean;
  toolCategories: string[];
}

interface SkillsResponse {
  skills: SkillItem[];
  stats: {
    total: number;
    eligible: number;
    enabled: number;
    bySource: Record<string, number>;
    mcpServers: number;
    estimatedTokens: number;
  };
}

interface SkillDetail {
  name: string;
  description: string;
  source: string;
  dirPath: string;
  eligible: boolean;
  eligibilityErrors: string[];
  enabled: boolean;
  invocation: { userInvocable: boolean; modelInvocable: boolean };
  metadata?: {
    emoji?: string;
    homepage?: string;
    primaryEnv?: string;
    toolCategories?: string[];
    install?: Array<{ kind: string; label?: string; id?: string }>;
  };
  command?: { name: string; description: string };
  instructions: string;
}

const SOURCE_COLORS: Record<string, string> = {
  bundled: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  managed: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  workspace: "bg-green-500/10 text-green-400 border-green-500/20",
  plugin: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

export function SkillsSection() {
  const queryClient = useQueryClient();
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  // Fetch skills list
  const { data, isLoading, error } = useQuery<SkillsResponse>({
    queryKey: ["skills"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/skills`);
      if (!res.ok) throw new Error("Failed to fetch skills");
      return res.json();
    },
  });

  // Fetch skill detail
  const { data: detail, isLoading: detailLoading } = useQuery<SkillDetail>({
    queryKey: ["skills", selectedSkill],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/skills/${selectedSkill}`);
      if (!res.ok) throw new Error("Failed to fetch skill detail");
      return res.json();
    },
    enabled: !!selectedSkill,
  });

  // Reload mutation
  const reloadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/api/skills/reload`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to reload skills");
      return res.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      toast.success(
        `Skills reloaded: ${result.stats.totalSkills} loaded`
      );
    },
    onError: () => toast.error("Failed to reload skills"),
  });

  // Toggle mutation
  const toggleMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(`${API_BASE}/api/skills/${name}/toggle`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to toggle skill");
      return res.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      toast.success(
        `${result.name} ${result.enabled ? "enabled" : "disabled"}`
      );
    },
  });

  // Install mutation
  const installMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(`${API_BASE}/api/skills/${name}/install`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to install dependencies");
      return res.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      if (result.allSucceeded) {
        toast.success(`Dependencies installed for ${result.skill}`);
      } else {
        toast.error("Some dependencies failed to install");
      }
    },
    onError: () => toast.error("Failed to install dependencies"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive">
        <AlertTriangle className="mb-2 h-5 w-5" />
        <p className="text-sm">
          Failed to load skills. Make sure the backend is running.
        </p>
      </div>
    );
  }

  const stats = data?.stats;
  const skills = data?.skills ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Skills</h2>
          <p className="text-sm text-muted-foreground">
            Modular capabilities that extend AI knowledge. Skills teach the AI
            about tools, workflows, and best practices.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => reloadMutation.mutate()}
          disabled={reloadMutation.isPending}
        >
          <RefreshCw
            className={cn(
              "mr-2 h-4 w-4",
              reloadMutation.isPending && "animate-spin"
            )}
          />
          Reload
        </Button>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total" value={stats.total} icon={Puzzle} />
          <StatCard label="Eligible" value={stats.eligible} icon={Check} />
          <StatCard label="Enabled" value={stats.enabled} icon={ToggleRight} />
          <StatCard
            label="~Tokens"
            value={stats.estimatedTokens.toLocaleString()}
            icon={Cpu}
          />
        </div>
      )}

      {/* Source breakdown */}
      {stats && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.bySource)
            .filter(([, count]) => count > 0)
            .map(([source, count]) => (
              <Badge
                key={source}
                variant="outline"
                className={cn("text-xs", SOURCE_COLORS[source])}
              >
                {source}: {count}
              </Badge>
            ))}
          {stats.mcpServers > 0 && (
            <Badge
              variant="outline"
              className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-xs"
            >
              <Plug className="mr-1 h-3 w-3" />
              MCP: {stats.mcpServers}
            </Badge>
          )}
        </div>
      )}

      {/* Skills List */}
      <div className="space-y-2">
        {skills.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            <Puzzle className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">No skills loaded</p>
            <p className="mt-1 text-xs">
              Add SKILL.md files to the <code>skills/</code> directory
            </p>
          </div>
        ) : (
          skills.map((skill) => (
            <div
              key={skill.name}
              className={cn(
                "group flex items-center gap-3 rounded-lg border p-3 transition-colors cursor-pointer",
                "hover:bg-accent/50",
                !skill.eligible && "opacity-60"
              )}
              onClick={() => setSelectedSkill(skill.name)}
            >
              {/* Emoji / Icon */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-lg">
                {skill.emoji || <Puzzle className="h-4 w-4" />}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{skill.name}</span>
                  <Badge
                    variant="outline"
                    className={cn("text-[10px]", SOURCE_COLORS[skill.source])}
                  >
                    {skill.source}
                  </Badge>
                  {!skill.eligible && (
                    <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/20">
                      ineligible
                    </Badge>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {skill.description}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {skill.userInvocable && (
                  <Badge variant="secondary" className="text-[10px]">
                    /{skill.name}
                  </Badge>
                )}
                <button
                  className="p-1 rounded hover:bg-accent"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMutation.mutate(skill.name);
                  }}
                  title={skill.enabled ? "Disable" : "Enable"}
                >
                  {skill.enabled ? (
                    <ToggleRight className="h-4 w-4 text-green-400" />
                  ) : (
                    <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Skill Detail Dialog */}
      <Dialog
        open={!!selectedSkill}
        onOpenChange={(open) => !open && setSelectedSkill(null)}
      >
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {detail?.metadata?.emoji && (
                <span className="text-xl">{detail.metadata.emoji}</span>
              )}
              {detail?.name || selectedSkill}
            </DialogTitle>
            <DialogDescription>{detail?.description}</DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : detail ? (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className={cn(SOURCE_COLORS[detail.source])}
                >
                  {detail.source}
                </Badge>
                <Badge
                  variant={detail.eligible ? "default" : "destructive"}
                  className="text-xs"
                >
                  {detail.eligible ? "Eligible" : "Ineligible"}
                </Badge>
                <Badge
                  variant={detail.enabled ? "default" : "secondary"}
                  className="text-xs"
                >
                  {detail.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>

              {/* Errors */}
              {detail.eligibilityErrors.length > 0 && (
                <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3">
                  <p className="text-xs font-medium text-amber-400 mb-1">
                    Missing Requirements
                  </p>
                  <ul className="space-y-1 text-xs text-amber-300/80">
                    {detail.eligibilityErrors.map((err, idx) => (
                      <li key={idx} className="flex items-center gap-1">
                        <X className="h-3 w-3 shrink-0" />
                        {err}
                      </li>
                    ))}
                  </ul>
                  {detail.metadata?.install &&
                    detail.metadata.install.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => installMutation.mutate(detail.name)}
                        disabled={installMutation.isPending}
                      >
                        <Download className="mr-1 h-3 w-3" />
                        {installMutation.isPending
                          ? "Installing..."
                          : "Install Dependencies"}
                      </Button>
                    )}
                </div>
              )}

              {/* Invocation */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Invocation
                </p>
                <div className="flex gap-3 text-xs">
                  <span className="flex items-center gap-1">
                    {detail.invocation.userInvocable ? (
                      <Check className="h-3 w-3 text-green-400" />
                    ) : (
                      <X className="h-3 w-3 text-muted-foreground" />
                    )}
                    User (/{detail.command?.name || detail.name})
                  </span>
                  <span className="flex items-center gap-1">
                    {detail.invocation.modelInvocable ? (
                      <Check className="h-3 w-3 text-green-400" />
                    ) : (
                      <X className="h-3 w-3 text-muted-foreground" />
                    )}
                    AI Auto-invoke
                  </span>
                </div>
              </div>

              {/* Tools */}
              {detail.metadata?.toolCategories &&
                detail.metadata.toolCategories.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Tools
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {detail.metadata.toolCategories.map((tool) => (
                        <Badge
                          key={tool}
                          variant="secondary"
                          className="text-[10px]"
                        >
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

              {/* Path */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Location
                </p>
                <code className="block rounded bg-muted px-2 py-1 text-[11px] break-all">
                  {detail.dirPath}
                </code>
              </div>

              {/* Links */}
              {detail.metadata?.homepage && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Documentation
                  </p>
                  <a
                    href={detail.metadata.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline"
                  >
                    {detail.metadata.homepage}
                  </a>
                </div>
              )}

              {/* Instructions preview */}
              {detail.instructions && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Instructions Preview
                  </p>
                  <div className="max-h-48 overflow-y-auto rounded-md border bg-muted/50 p-3">
                    <pre className="whitespace-pre-wrap text-[11px] text-muted-foreground">
                      {detail.instructions.slice(0, 2000)}
                      {detail.instructions.length > 2000 && "\n\n... (truncated)"}
                    </pre>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  variant={detail.enabled ? "destructive" : "default"}
                  onClick={() => {
                    toggleMutation.mutate(detail.name);
                    setSelectedSkill(null);
                  }}
                >
                  {detail.enabled ? "Disable" : "Enable"}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Info Footer */}
      <div className="flex items-start gap-2 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          <p>
            Skills are loaded from <code>skills/</code> (bundled),{" "}
            <code>~/.glinr/skills/</code> (managed), and project{" "}
            <code>skills/</code> (workspace). Each skill is a folder with a{" "}
            <code>SKILL.md</code> file.
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Helper Components ---

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[11px]">{label}</span>
      </div>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
