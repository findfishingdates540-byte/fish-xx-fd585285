import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Props {
  payoutId: string | null;
  onOpenChange: (open: boolean) => void;
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-3 border-b py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2 text-right font-medium break-all">
        <span>{value}</span>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={() => {
            navigator.clipboard.writeText(value);
            toast({ title: "Copied" });
          }}
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export function AdminPayoutDetailsDialog({ payoutId, onOpenChange }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-payout-details", payoutId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prize_payout_details" as any)
        .select("*")
        .eq("payout_id", payoutId)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!payoutId,
  });

  return (
    <Dialog open={!!payoutId} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Winner Payout Details</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : !data ? (
          <p className="text-sm text-muted-foreground">
            The winner has not yet submitted their payout details.
          </p>
        ) : (
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">
                {String(data.method).replace("_", " ")}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Submitted {new Date(data.submitted_at).toLocaleString()}
              </span>
            </div>
            <Row label="Full name" value={data.full_name} />
            <Row label="Contact email" value={data.contact_email} />
            <Row label="Contact phone" value={data.contact_phone} />
            <Row label="PayPal email" value={data.paypal_email} />
            <Row label="Venmo" value={data.venmo_handle} />
            <Row label="Zelle" value={data.zelle_identifier} />
            <Row label="Account holder" value={data.bank_account_name} />
            <Row label="Bank" value={data.bank_name} />
            <Row label="Routing #" value={data.bank_routing} />
            <Row label="Account #" value={data.bank_account_number} />
            <Row label="Address 1" value={data.mailing_address_1} />
            <Row label="Address 2" value={data.mailing_address_2} />
            <Row label="City" value={data.mailing_city} />
            <Row label="State" value={data.mailing_state} />
            <Row label="Postal" value={data.mailing_postal_code} />
            <Row label="Country" value={data.mailing_country} />
            <Row label="Tax ID" value={data.tax_id} />
            <Row label="Notes" value={data.notes} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default AdminPayoutDetailsDialog;