import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Mail } from "lucide-react";

interface Props {
  consent: boolean;
  setConsent: (v: boolean) => void;
  parentEmail: string;
  setParentEmail: (v: string) => void;
}

export function StepParentConsent({ consent, setConsent, parentEmail, setParentEmail }: Props) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-3">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-foreground">You're under 18 — let's keep things safe.</p>
            <p className="text-muted-foreground">
              Because you're between 13 and 17, your account will be set up as a Junior Angler with safer defaults:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-1">
              <li>No adult dating features</li>
              <li>Limited direct messaging (buddies only)</li>
              <li>Safer privacy defaults & strong reporting tools</li>
              <li>Access to Junior tournaments & challenges</li>
            </ul>
          </div>
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-border p-4 cursor-pointer hover:border-primary transition-colors">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 w-4 h-4 accent-primary cursor-pointer"
        />
        <span className="text-sm text-foreground">
          <span className="font-medium">My parent or guardian has given me permission</span> to create
          a Fish-X account and understands the safety features above.
        </span>
      </label>

      <div className="space-y-2">
        <Label htmlFor="parent-email" className="text-sm font-medium text-foreground">
          Parent / Guardian email <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="parent-email"
            type="email"
            placeholder="parent@example.com"
            value={parentEmail}
            onChange={(e) => setParentEmail(e.target.value)}
            className="pl-9"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          We may contact your parent/guardian about safety updates. We will never share this with other users.
        </p>
      </div>
    </div>
  );
}