import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, Lock, Pencil } from "lucide-react";

interface Props {
  payoutId: string;
  winnerId: string;
}

type Method = "paypal" | "venmo" | "zelle" | "bank" | "mailing_check" | "other";

export function WinnerPayoutForm({ payoutId, winnerId }: Props) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: existing, isLoading } = useQuery({
    queryKey: ["prize-payout-details", payoutId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prize_payout_details" as any)
        .select("*")
        .eq("payout_id", payoutId)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const [method, setMethod] = useState<Method>("paypal");
  const [fullName, setFullName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [venmoHandle, setVenmoHandle] = useState("");
  const [zelleIdentifier, setZelleIdentifier] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankRouting, setBankRouting] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [addr1, setAddr1] = useState("");
  const [addr2, setAddr2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postal, setPostal] = useState("");
  const [country, setCountry] = useState("United States");
  const [taxId, setTaxId] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (existing) {
      setMethod(existing.method);
      setFullName(existing.full_name || "");
      setContactEmail(existing.contact_email || "");
      setContactPhone(existing.contact_phone || "");
      setPaypalEmail(existing.paypal_email || "");
      setVenmoHandle(existing.venmo_handle || "");
      setZelleIdentifier(existing.zelle_identifier || "");
      setBankAccountName(existing.bank_account_name || "");
      setBankName(existing.bank_name || "");
      setBankRouting(existing.bank_routing || "");
      setBankAccountNumber(existing.bank_account_number || "");
      setAddr1(existing.mailing_address_1 || "");
      setAddr2(existing.mailing_address_2 || "");
      setCity(existing.mailing_city || "");
      setState(existing.mailing_state || "");
      setPostal(existing.mailing_postal_code || "");
      setCountry(existing.mailing_country || "United States");
      setTaxId(existing.tax_id || "");
      setNotes(existing.notes || "");
    }
  }, [existing]);

  const save = useMutation({
    mutationFn: async () => {
      if (!fullName.trim()) throw new Error("Full name is required");
      const missing: string[] = [];
      if (method === "paypal" && !paypalEmail.trim()) missing.push("PayPal email");
      if (method === "venmo" && !venmoHandle.trim()) missing.push("Venmo handle");
      if (method === "zelle" && !zelleIdentifier.trim()) missing.push("Zelle email or phone");
      if (method === "bank") {
        if (!bankAccountName.trim()) missing.push("Account holder name");
        if (!bankRouting.trim()) missing.push("Routing number");
        if (!bankAccountNumber.trim()) missing.push("Account number");
      }
      if (method === "mailing_check") {
        if (!addr1.trim()) missing.push("Address line 1");
        if (!city.trim()) missing.push("City");
        if (!state.trim()) missing.push("State / Region");
        if (!postal.trim()) missing.push("Postal code");
        if (!country.trim()) missing.push("Country");
      }
      if (method === "other" && !notes.trim())
        missing.push("Notes for organizer (describe how to pay you)");
      if (missing.length)
        throw new Error(`Please fill in: ${missing.join(", ")}`);
      const payload: any = {
        payout_id: payoutId,
        winner_id: winnerId,
        method,
        full_name: fullName.trim(),
        contact_email: contactEmail || null,
        contact_phone: contactPhone || null,
        paypal_email: method === "paypal" ? paypalEmail.trim() : null,
        venmo_handle: method === "venmo" ? venmoHandle.trim() : null,
        zelle_identifier: method === "zelle" ? zelleIdentifier.trim() : null,
        bank_account_name: method === "bank" ? bankAccountName.trim() : null,
        bank_name: method === "bank" ? bankName.trim() || null : null,
        bank_routing: method === "bank" ? bankRouting.trim() : null,
        bank_account_number: method === "bank" ? bankAccountNumber.trim() : null,
        mailing_address_1: method === "mailing_check" ? addr1.trim() : null,
        mailing_address_2: method === "mailing_check" ? addr2.trim() || null : null,
        mailing_city: method === "mailing_check" ? city.trim() : null,
        mailing_state: method === "mailing_check" ? state.trim() : null,
        mailing_postal_code: method === "mailing_check" ? postal.trim() : null,
        mailing_country: method === "mailing_check" ? country.trim() : null,
        tax_id: taxId || null,
        notes: notes || null,
      };
      if (existing?.id) {
        const { error } = await supabase
          .from("prize_payout_details" as any)
          .update(payload)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("prize_payout_details" as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Payout details submitted", description: "The organizer has been notified." });
      qc.invalidateQueries({ queryKey: ["prize-payout-details", payoutId] });
      setEditing(false);
    },
    onError: (err: any) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  if (isLoading) return null;

  // Submitted state
  if (existing && !editing) {
    return (
      <div className="mt-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium">Payout details submitted</p>
            <p className="text-xs text-muted-foreground">
              Method: <span className="capitalize font-medium">{existing.method.replace("_", " ")}</span> · The organizer will send your prize using this info.
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            <Pencil className="h-3 w-3 mr-1" /> Edit
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-md border p-3 space-y-3 bg-background">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" />
        Only you and the organizer can see this info.
      </div>

      <div className="space-y-1">
        <Label>Payout method</Label>
        <Select value={method} onValueChange={(v) => setMethod(v as Method)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="paypal">PayPal</SelectItem>
            <SelectItem value="venmo">Venmo</SelectItem>
            <SelectItem value="zelle">Zelle</SelectItem>
            <SelectItem value="bank">Bank transfer (ACH)</SelectItem>
            <SelectItem value="mailing_check">Mailed check</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label>Full legal name *</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" />
        </div>
        <div className="space-y-1">
          <Label>Contact email</Label>
          <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Contact phone</Label>
          <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
        </div>
      </div>

      {method === "paypal" && (
        <div className="space-y-1">
          <Label>PayPal email *</Label>
          <Input type="email" value={paypalEmail} onChange={(e) => setPaypalEmail(e.target.value)} />
        </div>
      )}
      {method === "venmo" && (
        <div className="space-y-1">
          <Label>Venmo handle *</Label>
          <Input value={venmoHandle} onChange={(e) => setVenmoHandle(e.target.value)} placeholder="@your-handle" />
        </div>
      )}
      {method === "zelle" && (
        <div className="space-y-1">
          <Label>Zelle email or phone *</Label>
          <Input value={zelleIdentifier} onChange={(e) => setZelleIdentifier(e.target.value)} />
        </div>
      )}
      {method === "bank" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="space-y-1 sm:col-span-2">
            <Label>Account holder name *</Label>
            <Input value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Bank name</Label>
            <Input value={bankName} onChange={(e) => setBankName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Routing number *</Label>
            <Input value={bankRouting} onChange={(e) => setBankRouting(e.target.value)} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Account number *</Label>
            <Input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} />
          </div>
        </div>
      )}
      {method === "mailing_check" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="space-y-1 sm:col-span-2">
            <Label>Address line 1 *</Label>
            <Input value={addr1} onChange={(e) => setAddr1(e.target.value)} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Address line 2</Label>
            <Input value={addr2} onChange={(e) => setAddr2(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>City *</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>State / Region *</Label>
            <Input value={state} onChange={(e) => setState(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Postal code *</Label>
            <Input value={postal} onChange={(e) => setPostal(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Country *</Label>
            <Input value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
        </div>
      )}

      <div className="space-y-1">
        <Label>Tax ID / SSN (if required for prizes over $600)</Label>
        <Input value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="Optional" />
      </div>

      <div className="space-y-1">
        <Label>Notes for organizer</Label>
        <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className="flex gap-2 justify-end">
        {existing && (
          <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
        )}
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? "Saving..." : existing ? "Update details" : "Submit payout details"}
        </Button>
      </div>
    </div>
  );
}

export default WinnerPayoutForm;