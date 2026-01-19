-- Create call_sessions table to track active calls
CREATE TABLE public.call_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  caller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  callee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel_name TEXT NOT NULL,
  call_type TEXT NOT NULL CHECK (call_type IN ('voice', 'video')),
  status TEXT NOT NULL DEFAULT 'ringing' CHECK (status IN ('ringing', 'accepted', 'declined', 'ended', 'missed', 'busy')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  answered_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view calls they're part of
CREATE POLICY "Users can view their own calls"
ON public.call_sessions
FOR SELECT
USING (auth.uid() = caller_id OR auth.uid() = callee_id);

-- Users can create calls where they are the caller
CREATE POLICY "Users can create calls as caller"
ON public.call_sessions
FOR INSERT
WITH CHECK (auth.uid() = caller_id);

-- Users can update calls they're part of
CREATE POLICY "Users can update their own calls"
ON public.call_sessions
FOR UPDATE
USING (auth.uid() = caller_id OR auth.uid() = callee_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_call_sessions_updated_at
BEFORE UPDATE ON public.call_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_call_sessions_callee_status ON public.call_sessions(callee_id, status);
CREATE INDEX idx_call_sessions_caller_status ON public.call_sessions(caller_id, status);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_sessions;