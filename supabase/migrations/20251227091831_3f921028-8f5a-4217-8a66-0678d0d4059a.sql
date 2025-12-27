-- Create advertisements table
CREATE TABLE public.advertisements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  photos TEXT[] DEFAULT '{}',
  ad_type TEXT NOT NULL DEFAULT 'general',
  sponsor_name TEXT NOT NULL,
  sponsor_logo TEXT,
  website_url TEXT,
  cta_text TEXT DEFAULT 'Learn More',
  cta_url TEXT,
  fishing_spot_id UUID REFERENCES public.fishing_spots(id) ON DELETE SET NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

-- Admins can manage all advertisements
CREATE POLICY "Admins can manage advertisements"
ON public.advertisements
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view active advertisements within date range
CREATE POLICY "Anyone can view active ads"
ON public.advertisements
FOR SELECT
USING (
  is_active = true 
  AND start_date <= CURRENT_DATE 
  AND (end_date IS NULL OR end_date >= CURRENT_DATE)
);

-- Create trigger for updated_at
CREATE TRIGGER update_advertisements_updated_at
BEFORE UPDATE ON public.advertisements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_advertisements_active ON public.advertisements(is_active, start_date, end_date);
CREATE INDEX idx_advertisements_type ON public.advertisements(ad_type);