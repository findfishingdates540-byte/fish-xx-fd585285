-- Upgrade user to admin role
INSERT INTO public.user_roles (user_id, role)
VALUES ('abbb4201-0204-43f2-8a89-625e1fcb3974', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;