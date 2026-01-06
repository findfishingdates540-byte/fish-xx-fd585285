import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const SUPABASE_URL = "https://zjmnlelqoiclkbrqefyv.supabase.co";

export function useVerificationRequests() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["verification-requests", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("verification_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const pendingIdRequest = requests?.find(
    (r) => r.type === "id" && r.status === "pending"
  );
  const pendingLiveRequest = requests?.find(
    (r) => r.type === "live" && r.status === "pending"
  );

  const uploadDocument = async (file: File, type: "id" | "selfie"): Promise<string> => {
    if (!user) throw new Error("Not authenticated");

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${type}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("verification-documents")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Return the path for admin to access via signed URL
    return `${SUPABASE_URL}/storage/v1/object/verification-documents/${fileName}`;
  };

  const submitIdVerification = useMutation({
    mutationFn: async ({
      documentType,
      file,
    }: {
      documentType: string;
      file: File;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Check for existing pending request
      if (pendingIdRequest) {
        throw new Error("You already have a pending ID verification request");
      }

      const documentUrl = await uploadDocument(file, "id");

      const { error } = await supabase.from("verification_requests").insert({
        user_id: user.id,
        type: "id",
        id_document_type: documentType,
        id_document_url: documentUrl,
        status: "pending",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verification-requests"] });
      toast.success("ID verification submitted for review");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit verification");
    },
  });

  const submitLiveVerification = useMutation({
    mutationFn: async ({ file }: { file: File }) => {
      if (!user) throw new Error("Not authenticated");

      // Check for existing pending request
      if (pendingLiveRequest) {
        throw new Error("You already have a pending live verification request");
      }

      const selfieUrl = await uploadDocument(file, "selfie");

      const { error } = await supabase.from("verification_requests").insert({
        user_id: user.id,
        type: "live",
        selfie_url: selfieUrl,
        status: "pending",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verification-requests"] });
      toast.success("Live verification submitted for review");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit verification");
    },
  });

  return {
    requests,
    pendingIdRequest,
    pendingLiveRequest,
    isLoading,
    submitIdVerification,
    submitLiveVerification,
  };
}
