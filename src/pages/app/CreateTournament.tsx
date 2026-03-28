import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Swords } from "lucide-react";
import { toast } from "sonner";

const CreateTournament = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState("single_elimination");
  const [seeding, setSeeding] = useState("random");
  const [scoring, setScoring] = useState("biggest_catch");
  const [maxParticipants, setMaxParticipants] = useState("16");
  const [entryFee, setEntryFee] = useState("0");
  const [prizeDescription, setPrizeDescription] = useState("");
  const [registrationEnd, setRegistrationEnd] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Login required");
      if (!title.trim()) throw new Error("Title is required");
      if (!registrationEnd) throw new Error("Registration end date is required");
      if (!startDate) throw new Error("Start date is required");

      const { data, error } = await supabase.from("tournaments").insert({
        title: title.trim(),
        description: description.trim() || null,
        format,
        seeding_method: seeding,
        scoring_method: scoring,
        max_participants: parseInt(maxParticipants),
        entry_fee: parseFloat(entryFee) || 0,
        prize_description: prizeDescription.trim() || null,
        registration_end: new Date(registrationEnd).toISOString(),
        start_date: new Date(startDate).toISOString(),
        end_date: endDate ? new Date(endDate).toISOString() : null,
        status: "registration",
        created_by: user.id,
      } as any).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      toast.success("Tournament created!");
      navigate(`/app/tournaments/${data.id}`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="max-w-lg mx-auto px-4 pb-32">
      <div className="flex items-center gap-3 py-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Swords className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold">Create Tournament</h1>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Title *</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Spring Bass Showdown" />
        </div>

        <div>
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tournament details..." rows={3} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="single_elimination">Single Elimination</SelectItem>
                <SelectItem value="double_elimination">Double Elimination</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Seeding</Label>
            <Select value={seeding} onValueChange={setSeeding}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="random">Random</SelectItem>
                <SelectItem value="ranked">Ranked</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Scoring Method</Label>
            <Select value={scoring} onValueChange={setScoring}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="biggest_catch">Biggest Catch</SelectItem>
                <SelectItem value="total_weight">Total Weight</SelectItem>
                <SelectItem value="most_catches">Most Catches</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Max Participants</Label>
            <Select value={maxParticipants} onValueChange={setMaxParticipants}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="8">8</SelectItem>
                <SelectItem value="16">16</SelectItem>
                <SelectItem value="32">32</SelectItem>
                <SelectItem value="64">64</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Entry Fee ($)</Label>
            <Input type="number" min="0" step="0.01" value={entryFee} onChange={(e) => setEntryFee(e.target.value)} placeholder="0" />
          </div>
          <div>
            <Label>Prize</Label>
            <Input value={prizeDescription} onChange={(e) => setPrizeDescription(e.target.value)} placeholder="$500 cash" />
          </div>
        </div>

        <div>
          <Label>Registration Closes *</Label>
          <Input type="datetime-local" value={registrationEnd} onChange={(e) => setRegistrationEnd(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Start Date *</Label>
            <Input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label>End Date</Label>
            <Input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        <Button
          className="w-full mt-4"
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending || !title.trim() || !registrationEnd || !startDate}
        >
          {createMutation.isPending ? "Creating..." : "Create Tournament"}
        </Button>
      </div>
    </div>
  );
};

export default CreateTournament;
