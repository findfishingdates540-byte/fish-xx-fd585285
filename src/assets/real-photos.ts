// Real user-uploaded catch photos sourced from public feed posts.
// Replaces previously AI-generated marketing imagery on public pages.
export const realCatchPhotos = [
  'https://zjmnlelqoiclkbrqefyv.supabase.co/storage/v1/object/public/catch-photos/c14d7c61-7b4e-49c2-9fe7-51e73fb4a5de/1782051953086-6k3pbo.jpg',
  'https://zjmnlelqoiclkbrqefyv.supabase.co/storage/v1/object/public/catch-photos/c14d7c61-7b4e-49c2-9fe7-51e73fb4a5de/1782017514692-dv8fx.jpg',
  'https://zjmnlelqoiclkbrqefyv.supabase.co/storage/v1/object/public/catch-photos/c14d7c61-7b4e-49c2-9fe7-51e73fb4a5de/1782013826916-39bvmdj.jpg',
  'https://zjmnlelqoiclkbrqefyv.supabase.co/storage/v1/object/public/catch-photos/c14d7c61-7b4e-49c2-9fe7-51e73fb4a5de/1782005478422-b5e4o.jpg',
  'https://zjmnlelqoiclkbrqefyv.supabase.co/storage/v1/object/public/catch-photos/c14d7c61-7b4e-49c2-9fe7-51e73fb4a5de/1782000673344-3s017g.jpg',
  'https://zjmnlelqoiclkbrqefyv.supabase.co/storage/v1/object/public/catch-photos/c14d7c61-7b4e-49c2-9fe7-51e73fb4a5de/1781987487039-dljnup.jpg',
  'https://zjmnlelqoiclkbrqefyv.supabase.co/storage/v1/object/public/catch-photos/dfb49c4c-7f8f-4cb0-beb7-8f6284911195/1781967149642-8h0gdg.jpg',
  'https://zjmnlelqoiclkbrqefyv.supabase.co/storage/v1/object/public/catch-photos/c14d7c61-7b4e-49c2-9fe7-51e73fb4a5de/1781967104931-896kj.jpg',
  'https://zjmnlelqoiclkbrqefyv.supabase.co/storage/v1/object/public/catch-photos/c14d7c61-7b4e-49c2-9fe7-51e73fb4a5de/1781960920419-pzwqwv.jpg',
  'https://zjmnlelqoiclkbrqefyv.supabase.co/storage/v1/object/public/catch-photos/c14d7c61-7b4e-49c2-9fe7-51e73fb4a5de/1781952633839-qohrpf.jpg',
  'https://zjmnlelqoiclkbrqefyv.supabase.co/storage/v1/object/public/catch-photos/c14d7c61-7b4e-49c2-9fe7-51e73fb4a5de/1781949691330-2qt7mr.jpg',
  'https://zjmnlelqoiclkbrqefyv.supabase.co/storage/v1/object/public/catch-photos/c14d7c61-7b4e-49c2-9fe7-51e73fb4a5de/1781917430072-vsxcjm.jpg',
  'https://zjmnlelqoiclkbrqefyv.supabase.co/storage/v1/object/public/catch-photos/c14d7c61-7b4e-49c2-9fe7-51e73fb4a5de/1781904257406-tea3.jpg',
  'https://zjmnlelqoiclkbrqefyv.supabase.co/storage/v1/object/public/catch-photos/c14d7c61-7b4e-49c2-9fe7-51e73fb4a5de/1781899484491-6h8wha.jpg',
  'https://zjmnlelqoiclkbrqefyv.supabase.co/storage/v1/object/public/catch-photos/dfb49c4c-7f8f-4cb0-beb7-8f6284911195/1781895776945-07q7v.jpg',
  'https://zjmnlelqoiclkbrqefyv.supabase.co/storage/v1/object/public/catch-photos/c14d7c61-7b4e-49c2-9fe7-51e73fb4a5de/1781886418416-s33ggg.jpg',
  'https://zjmnlelqoiclkbrqefyv.supabase.co/storage/v1/object/public/catch-photos/c14d7c61-7b4e-49c2-9fe7-51e73fb4a5de/1781867388496-gtp05sd.jpg',
  'https://zjmnlelqoiclkbrqefyv.supabase.co/storage/v1/object/public/catch-photos/c14d7c61-7b4e-49c2-9fe7-51e73fb4a5de/1781836684490-j6e5a9.jpg',
  'https://zjmnlelqoiclkbrqefyv.supabase.co/storage/v1/object/public/catch-photos/c14d7c61-7b4e-49c2-9fe7-51e73fb4a5de/1781820257488-ir3qkj.jpg',
  'https://zjmnlelqoiclkbrqefyv.supabase.co/storage/v1/object/public/catch-photos/c14d7c61-7b4e-49c2-9fe7-51e73fb4a5de/1781798152412-ui1x08.jpg',
  'https://zjmnlelqoiclkbrqefyv.supabase.co/storage/v1/object/public/catch-photos/dfb49c4c-7f8f-4cb0-beb7-8f6284911195/1781793181878-r9tbkb.jpg',
  'https://zjmnlelqoiclkbrqefyv.supabase.co/storage/v1/object/public/catch-photos/c14d7c61-7b4e-49c2-9fe7-51e73fb4a5de/1781784428638-toihwr.jpg',
  'https://zjmnlelqoiclkbrqefyv.supabase.co/storage/v1/object/public/catch-photos/dfb49c4c-7f8f-4cb0-beb7-8f6284911195/1781749659867-bikelh.jpg',
  'https://zjmnlelqoiclkbrqefyv.supabase.co/storage/v1/object/public/catch-photos/c14d7c61-7b4e-49c2-9fe7-51e73fb4a5de/1781732043903-wavmd.jpg',
];

export const realPhoto = (i: number) => realCatchPhotos[i % realCatchPhotos.length];