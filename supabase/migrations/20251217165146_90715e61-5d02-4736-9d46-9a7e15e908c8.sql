-- Insert common fish species for catch logging
INSERT INTO public.fish_species (name, scientific_name, description, image_url) VALUES
  ('Largemouth Bass', 'Micropterus salmoides', 'Popular freshwater game fish known for its fighting ability. Found in lakes, ponds, and rivers across North America.', NULL),
  ('Smallmouth Bass', 'Micropterus dolomieu', 'Bronze-colored bass that prefers cooler, cleaner waters. Excellent fighter and popular sport fish.', NULL),
  ('Rainbow Trout', 'Oncorhynchus mykiss', 'Colorful trout with pink stripe along its side. Found in cold, clear streams and lakes.', NULL),
  ('Brown Trout', 'Salmo trutta', 'European native trout with distinctive spots. Prefers cold streams and rivers.', NULL),
  ('Brook Trout', 'Salvelinus fontinalis', 'Native to eastern North America. Beautiful fish with vermiculations on back.', NULL),
  ('Bluegill', 'Lepomis macrochirus', 'Common panfish found throughout North America. Great for beginners.', NULL),
  ('Channel Catfish', 'Ictalurus punctatus', 'Most common catfish in North America. Excellent table fare.', NULL),
  ('Blue Catfish', 'Ictalurus furcatus', 'Largest catfish species in North America. Can grow over 100 pounds.', NULL),
  ('Walleye', 'Sander vitreus', 'Prized for excellent taste. Found in lakes and rivers of northern US and Canada.', NULL),
  ('Northern Pike', 'Esox lucius', 'Aggressive predator with sharp teeth. Found in weedy lakes and rivers.', NULL),
  ('Muskie', 'Esox masquinongy', 'Called the fish of 10,000 casts. Largest member of the pike family.', NULL),
  ('Crappie', 'Pomoxis spp.', 'Popular panfish that schools in large numbers. Great eating fish.', NULL),
  ('Striped Bass', 'Morone saxatilis', 'Anadromous fish found in coastal waters and stocked in reservoirs.', NULL),
  ('Carp', 'Cyprinus carpio', 'Large, strong freshwater fish. Popular in European sport fishing.', NULL),
  ('Yellow Perch', 'Perca flavescens', 'Schooling panfish with excellent flavor. Found in lakes and ponds.', NULL),
  ('Kokanee Salmon', 'Oncorhynchus nerka', 'Landlocked sockeye salmon. Found in deep, cold lakes.', NULL),
  ('Chinook Salmon', 'Oncorhynchus tshawytscha', 'Largest Pacific salmon species. Highly prized game fish.', NULL),
  ('Coho Salmon', 'Oncorhynchus kisutch', 'Silver salmon known for acrobatic fights. Found in Pacific waters.', NULL),
  ('Lake Trout', 'Salvelinus namaycush', 'Deep-water trout that can grow very large. Found in cold northern lakes.', NULL),
  ('Redfish', 'Sciaenops ocellatus', 'Popular saltwater game fish also known as Red Drum. Found along Atlantic and Gulf coasts.', NULL)
ON CONFLICT DO NOTHING;