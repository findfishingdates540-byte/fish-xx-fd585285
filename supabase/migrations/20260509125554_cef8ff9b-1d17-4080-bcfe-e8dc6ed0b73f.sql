INSERT INTO public.fish_species (name) SELECT 'Largemouth Bass' WHERE NOT EXISTS (SELECT 1 FROM public.fish_species WHERE name='Largemouth Bass');
INSERT INTO public.fish_species (name) SELECT 'Shoal Bass' WHERE NOT EXISTS (SELECT 1 FROM public.fish_species WHERE name='Shoal Bass');
INSERT INTO public.fish_species (name) SELECT 'Striped Bass' WHERE NOT EXISTS (SELECT 1 FROM public.fish_species WHERE name='Striped Bass');
INSERT INTO public.fish_species (name) SELECT 'Black Crappie' WHERE NOT EXISTS (SELECT 1 FROM public.fish_species WHERE name='Black Crappie');
INSERT INTO public.fish_species (name) SELECT 'Bluegill' WHERE NOT EXISTS (SELECT 1 FROM public.fish_species WHERE name='Bluegill');
INSERT INTO public.fish_species (name) SELECT 'Redear Sunfish' WHERE NOT EXISTS (SELECT 1 FROM public.fish_species WHERE name='Redear Sunfish');
INSERT INTO public.fish_species (name) SELECT 'Catfish' WHERE NOT EXISTS (SELECT 1 FROM public.fish_species WHERE name='Catfish');
INSERT INTO public.fish_species (name) SELECT 'Chain Pickerel' WHERE NOT EXISTS (SELECT 1 FROM public.fish_species WHERE name='Chain Pickerel');
INSERT INTO public.fish_species (name) SELECT 'Gar' WHERE NOT EXISTS (SELECT 1 FROM public.fish_species WHERE name='Gar');
INSERT INTO public.fish_species (name) SELECT 'Tilapia' WHERE NOT EXISTS (SELECT 1 FROM public.fish_species WHERE name='Tilapia');
INSERT INTO public.fish_species (name) SELECT 'Sturgeon' WHERE NOT EXISTS (SELECT 1 FROM public.fish_species WHERE name='Sturgeon');

-- Defer batch 1 inserts to a do-block reading from /tmp won't work; execute via dynamic copy below.
SELECT 1;