-- Insert 6 mock fishing spots (without species_available as it requires UUIDs)
INSERT INTO public.fishing_spots (name, description, location_lat, location_lng, location_name, rating_avg, rating_count, is_verified, is_public, photos) VALUES
(
  'Crystal Lake Marina',
  'A peaceful freshwater lake perfect for bass fishing. Features a well-maintained dock, boat rentals, and scenic mountain views. Best fishing spots are near the northern cove.',
  40.7128,
  -74.0060,
  'Crystal Lake, New York',
  4.8,
  124,
  true,
  true,
  ARRAY['https://images.unsplash.com/photo-1500463959177-e0869687df26?w=800', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800']
),
(
  'Sunset Pier',
  'Popular saltwater fishing pier with stunning sunset views. Great for catching redfish and flounder. Night fishing permitted with valid license.',
  25.7617,
  -80.1918,
  'Miami Beach, Florida',
  4.5,
  89,
  true,
  true,
  ARRAY['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800']
),
(
  'Mountain Creek Reserve',
  'Pristine fly fishing destination tucked in the Rocky Mountains. Crystal clear waters teeming with rainbow and brown trout. Catch and release only.',
  39.7392,
  -104.9903,
  'Denver, Colorado',
  4.9,
  67,
  true,
  true,
  ARRAY['https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=800', 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800']
),
(
  'Bayou Bend',
  'Classic Louisiana bayou fishing experience. Known for huge catfish and crappie. Bring bug spray and prepare for an authentic southern adventure.',
  29.9511,
  -90.0715,
  'New Orleans, Louisiana',
  4.3,
  156,
  false,
  true,
  ARRAY['https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800', 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800']
),
(
  'Pacific Shores Charter Point',
  'Premier deep sea fishing launch point. Charter boats available for tuna, halibut, and salmon expeditions. Full service bait shop on site.',
  34.0522,
  -118.2437,
  'Los Angeles, California',
  4.7,
  203,
  true,
  true,
  ARRAY['https://images.unsplash.com/photo-1534766555764-ce878a5e3a2b?w=800', 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800']
),
(
  'Hidden Cove',
  'A local secret spot with excellent panfish and bass. Quiet and secluded, perfect for a peaceful day of fishing. Shore access only, no boats.',
  41.8781,
  -87.6298,
  'Chicago, Illinois',
  4.4,
  45,
  false,
  true,
  ARRAY['https://images.unsplash.com/photo-1468581264429-2548ef9eb732?w=800', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800']
);