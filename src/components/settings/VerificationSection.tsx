import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { useVerificationRequests } from "@/hooks/use-verification-requests";
import { format } from "date-fns";
import {
  Upload,
  Camera,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  ShieldCheck,
  BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";

interface VerificationSectionProps {
  idVerified?: boolean;
  liveVerified?: boolean;
}

const DOCUMENT_TYPES = [
  { value: "passport", label: "Passport" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "national_id", label: "National ID Card" },
];

export function VerificationSection({ idVerified, liveVerified }: VerificationSectionProps) {
  const {
    requests,
    pendingIdRequest,
    pendingLiveRequest,
    isLoading,
    submitIdVerification,
    submitLiveVerification,
  } = useVerificationRequests();

  const [documentType, setDocumentType] = useState("passport");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const idInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleIdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File must be less than 10MB");
        return;
      }
      setIdFile(file);
    }
  };

  const handleSubmitId = async () => {
    if (!idFile) {
      toast.error("Please select a document");
      return;
    }
    await submitIdVerification.mutateAsync({ documentType, file: idFile });
    setIdFile(null);
    if (idInputRef.current) idInputRef.current.value = "";
  };

  const openCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      setStream(mediaStream);
      setCameraOpen(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      toast.error("Unable to access camera. Please grant camera permissions.");
    }
  }, []);

  const closeCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraOpen(false);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `selfie_${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          setSelfieFile(file);
          setSelfiePreview(URL.createObjectURL(blob));
          closeCamera();
        }
      },
      "image/jpeg",
      0.9
    );
  }, [closeCamera]);

  const handleSubmitSelfie = async () => {
    if (!selfieFile) {
      toast.error("Please take a selfie first");
      return;
    }
    await submitLiveVerification.mutateAsync({ file: selfieFile });
    setSelfieFile(null);
    setSelfiePreview(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Verification Status
          </CardTitle>
          <CardDescription>
            Build trust with other users by verifying your identity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                {idVerified ? (
                  <VerificationBadge idVerified size="lg" showTooltip={false} />
                ) : (
                  <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-medium">ID Verified</p>
                <p className="text-sm text-muted-foreground">
                  {idVerified ? "Your identity is verified" : "Not verified yet"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                {liveVerified ? (
                  <VerificationBadge liveVerified size="lg" showTooltip={false} />
                ) : (
                  <BadgeCheck className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-medium">Live Verified</p>
                <p className="text-sm text-muted-foreground">
                  {liveVerified ? "You're a real person" : "Not verified yet"}
                </p>
              </div>
            </div>
          </div>
          
        </CardContent>
      </Card>

      {/* ID Verification */}
      {!idVerified && (
        <Card>
          <CardHeader>
          <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              ID Verification
              <VerificationBadge idVerified size="sm" showTooltip={false} />
            </CardTitle>
            <CardDescription>
              Upload a valid government-issued ID to verify your identity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingIdRequest ? (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="font-medium">Verification Under Review</p>
                  <p className="text-sm text-muted-foreground">
                    Submitted {format(new Date(pendingIdRequest.submitted_at || ""), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Document Type</Label>
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Upload Document</Label>
                  <div
                    onClick={() => idInputRef.current?.click()}
                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    {idFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium">{idFile.name}</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          JPG, PNG, WEBP or PDF (max 10MB)
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    ref={idInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleIdFileChange}
                    className="hidden"
                  />
                </div>

                <Button
                  onClick={handleSubmitId}
                  disabled={!idFile || submitIdVerification.isPending}
                  className="w-full"
                >
                  {submitIdVerification.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit for Review"
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Live Verification */}
      {!liveVerified && (
        <Card>
          <CardHeader>
          <CardTitle className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5" />
              Live Verification
              <VerificationBadge liveVerified size="sm" showTooltip={false} />
            </CardTitle>
            <CardDescription>
              Take a selfie to prove you're a real person
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingLiveRequest ? (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="font-medium">Verification Under Review</p>
                  <p className="text-sm text-muted-foreground">
                    Submitted {format(new Date(pendingLiveRequest.submitted_at || ""), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {cameraOpen ? (
                  <div className="space-y-4">
                    <div className="relative rounded-lg overflow-hidden bg-black aspect-[4/3]">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 border-4 border-primary/30 rounded-lg pointer-events-none" />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={closeCamera} className="flex-1">
                        Cancel
                      </Button>
                      <Button onClick={capturePhoto} className="flex-1">
                        <Camera className="h-4 w-4 mr-2" />
                        Capture
                      </Button>
                    </div>
                  </div>
                ) : selfiePreview ? (
                  <div className="space-y-4">
                    <div className="relative rounded-lg overflow-hidden bg-black aspect-[4/3]">
                      <img
                        src={selfiePreview}
                        alt="Selfie preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelfieFile(null);
                          setSelfiePreview(null);
                        }}
                        className="flex-1"
                      >
                        Retake
                      </Button>
                      <Button
                        onClick={handleSubmitSelfie}
                        disabled={submitLiveVerification.isPending}
                        className="flex-1"
                      >
                        {submitLiveVerification.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit for Review"
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={openCamera}
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="font-medium">Take a Selfie</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Make sure your face is clearly visible and well-lit
                    </p>
                  </div>
                )}
              </>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </CardContent>
        </Card>
      )}

      {/* Request History */}
      {requests && requests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Request History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(request.status)}
                    <div>
                      <p className="font-medium">
                        {request.type === "id" ? "ID Verification" : "Live Verification"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(request.submitted_at || request.created_at || ""), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-sm font-medium capitalize ${
                        request.status === "approved"
                          ? "text-green-500"
                          : request.status === "rejected"
                          ? "text-destructive"
                          : "text-yellow-500"
                      }`}
                    >
                      {request.status}
                    </span>
                    {request.status === "rejected" && request.rejection_reason && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {request.rejection_reason}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
