
-- Enable RLS
ALTER TABLE timelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE moment_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE moment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY timelines_public_read ON timelines FOR SELECT USING (visibility='public');
CREATE POLICY moments_public_read ON timeline_moments FOR SELECT USING (visibility='public');
CREATE POLICY media_public_read ON moment_media FOR SELECT USING (moment_id IN (SELECT id FROM timeline_moments WHERE visibility='public'));
CREATE POLICY app_users_self_read ON app_users FOR SELECT USING (auth_user_id = auth.uid());

-- Frontend-ready view
CREATE OR REPLACE VIEW v_public_moments_with_media AS
SELECT m.id, m.title, m.world_z AS z, m.side, m.likes, m.popularity AS pop,
json_agg(json_build_object('type',mm.media_type,'bucket',mm.storage_bucket,'path',mm.storage_path,'width',mm.width,'height',mm.height,'duration',mm.duration_seconds)) FILTER (WHERE mm.id IS NOT NULL) AS media
FROM timeline_moments m
JOIN timelines t ON t.id=m.timeline_id
LEFT JOIN moment_media mm ON mm.moment_id=m.id
WHERE m.visibility='public' AND t.visibility='public'
GROUP BY m.id;
