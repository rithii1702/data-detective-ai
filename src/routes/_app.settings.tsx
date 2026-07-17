import { createFileRoute } from "@tanstack/react-router";
import { KeyRound, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader, SectionCard, EmptyState } from "@/components/detective/shared";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings — Data Detective AI" }] }),
});

function SettingsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="Settings" subtitle="Manage your profile, preferences, and workspace." />

      <SectionCard title="Profile">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">AM</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            <div><Label>Full name</Label><Input defaultValue="Alex Morgan" className="mt-1.5" /></div>
            <div><Label>Email</Label><Input defaultValue="alex@detective.ai" className="mt-1.5" /></div>
            <div><Label>Role</Label><Input defaultValue="Owner" className="mt-1.5" /></div>
            <div><Label>Company</Label><Input defaultValue="Detective Labs Inc." className="mt-1.5" /></div>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Appearance" description="Theme and display preferences">
          <div className="space-y-4">
            <Row label="Dark mode" hint="Use the toggle in the top bar to switch themes." />
            <Row label="Compact tables" hint="Reduce row height in data tables." defaultOn />
            <Row label="Animated charts" hint="Enable motion in charts and cards." defaultOn />
          </div>
        </SectionCard>

        <SectionCard title="Notifications">
          <div className="space-y-4">
            <Row label="Investigation completed" hint="Email me when a run finishes." defaultOn />
            <Row label="Anomaly alerts" hint="Notify me on critical anomalies." defaultOn />
            <Row label="Weekly digest" hint="Summary of insights every Monday." />
          </div>
        </SectionCard>

        <SectionCard title="Language & region">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Language</Label><Input defaultValue="English (US)" className="mt-1.5" /></div>
            <div><Label>Timezone</Label><Input defaultValue="UTC-05:00 Eastern" className="mt-1.5" /></div>
            <div><Label>Date format</Label><Input defaultValue="MMM DD, YYYY" className="mt-1.5" /></div>
            <div><Label>Currency</Label><Input defaultValue="USD ($)" className="mt-1.5" /></div>
          </div>
        </SectionCard>

        <SectionCard title="Export preferences">
          <div className="space-y-4">
            <Row label="Include charts in PDF" hint="Embed rendered chart images." defaultOn />
            <Row label="Include raw data" hint="Attach a data sheet in Excel exports." />
            <Row label="Watermark exports" hint="Add company watermark to PDFs." />
          </div>
        </SectionCard>
      </div>

      <SectionCard title="API keys" description="Placeholder — connect your integrations later.">
        <EmptyState
          icon={<KeyRound className="h-6 w-6" />}
          title="No API keys yet"
          description="Generate a key to connect Detective AI to your data pipelines."
          action={<Button><Copy className="h-4 w-4" /> Generate key</Button>}
        />
      </SectionCard>
    </div>
  );
}

function Row({ label, hint, defaultOn }: { label: string; hint: string; defaultOn?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
      <Switch defaultChecked={defaultOn} />
    </div>
  );
}
