
WITH species_ids AS (
  SELECT ARRAY_REMOVE(ARRAY[
    (SELECT id FROM public.fish_species WHERE name ILIKE 'Snowy Grouper' LIMIT 1),
    (SELECT id FROM public.fish_species WHERE name ILIKE 'Warsaw Grouper' LIMIT 1),
    (SELECT id FROM public.fish_species WHERE name ILIKE 'Yellowedge Grouper' LIMIT 1),
    (SELECT id FROM public.fish_species WHERE name ILIKE 'Tilefish' LIMIT 1),
    (SELECT id FROM public.fish_species WHERE name ILIKE 'Amberjack' LIMIT 1),
    (SELECT id FROM public.fish_species WHERE name ILIKE 'Red Snapper' LIMIT 1)
  ], NULL)::uuid[] AS ids
)
INSERT INTO public.fishing_spots (name, location_lat, location_lng, location_name, description, depth_ft, primary_material, species_available, area_type, coast, is_public, is_verified)
SELECT v.name, v.lat, v.lng, v.region, v.descr, v.depth, v.struct, (SELECT ids FROM species_ids), 'saltwater','Florida',true,true
FROM (VALUES
('Pulley Ridge - North Ridge Edge',25.8667,-83.6,'Pulley Ridge','Ledge/Hard Bottom - Good starting drift area. Targets: Snapper, Grouper',325,'Ledge/Hard Bottom'),
('Pulley Ridge - Mid Ridge Ledges',25.7,-83.9,'Pulley Ridge','Ledges - Consistent fishing zone. Targets: Yellowedge Grouper, Tilefish',400,'Ledges'),
('Pulley Ridge - Deep Drop Zone',25.55,-84.0,'Pulley Ridge','Drop-off - Best for deep drop rigs. Targets: Snowy Grouper, Tilefish',650,'Drop-off'),
('Pulley Ridge - South Ridge Area',25.15,-83.95,'Pulley Ridge','Mixed Structure - Less pressure, explore. Targets: Warsaw Grouper, Snapper',550,'Mixed Structure'),
('Pulley Ridge - Central High Spot',25.62,-83.88,'Pulley Ridge','Hard Bottom Rise - Look for bait schools. Targets: Amberjack, Grouper',315,'Hard Bottom Rise'),
('Pulley Ridge - West Edge Drop',25.68,-84.05,'Pulley Ridge','Steep Drop - Strong currents possible. Targets: Tilefish, Snowy Grouper',800,'Steep Drop'),
('Pulley Ridge - East Ridge Patch',25.74,-83.82,'Pulley Ridge','Coral/Hard Patch - Drift over structure. Targets: Snapper, Amberjack',350,'Coral/Hard Patch')
) AS v(name,lat,lng,region,descr,depth,struct);
