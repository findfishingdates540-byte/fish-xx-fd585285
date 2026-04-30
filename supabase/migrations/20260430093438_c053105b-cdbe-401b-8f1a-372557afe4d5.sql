ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS signup_source text,
ADD COLUMN IF NOT EXISTS referred_by text;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    display_name,
    account_mode,
    is_premium,
    premium_expires_at,
    signup_source,
    referred_by
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    'fishing'::account_mode,
    true,
    NOW() + INTERVAL '10 years',
    NULLIF(NEW.raw_user_meta_data ->> 'signup_source', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'referred_by', '')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;