import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare, Share2, Plus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PageHeader, SectionCard, StatusPill } from "@/components/detective/shared";
import { teamMembers, activity } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/team")({
  component: TeamPage,
  head: () => ({ meta: [{ title: "Team — Data Detective AI" }] }),
});

function TeamPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Team"
        subtitle="Collaborators, permissions, and recent activity."
        actions={<Button><Plus className="h-4 w-4" /> Invite member</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <SectionCard title="Members" description={`${teamMembers.length} collaborators`}>
          <ul className="divide-y divide-border">
            {teamMembers.map((m) => (
              <li key={m.email} className="flex items-center gap-3 py-3">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{m.initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{m.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{m.role} · {m.email}</div>
                </div>
                <StatusPill status={m.perm} />
              </li>
            ))}
          </ul>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="Recent activity">
            <ul className="space-y-3 text-sm">
              {activity.map((a, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate"><span className="font-medium">{a.who}</span> {a.what} <span className="font-medium">{a.target}</span></div>
                    <div className="text-xs text-muted-foreground">{a.when}</div>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Shared datasets">
            <ul className="space-y-2 text-sm">
              {["sales_q3_2025.csv", "marketing_spend.csv", "web_traffic_sept.xlsx"].map((f) => (
                <li key={f} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <span className="truncate">{f}</span>
                  <Share2 className="h-4 w-4 text-muted-foreground" />
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
