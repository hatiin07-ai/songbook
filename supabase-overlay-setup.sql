-- ============================================
-- 오버레이 상태 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS overlay_state (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  song_title TEXT DEFAULT '',
  song_artist TEXT DEFAULT '',
  is_visible BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 초기 행 삽입 (항상 1행만 존재)
INSERT INTO overlay_state (id, song_title, song_artist, is_visible)
VALUES (1, '', '', false)
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE overlay_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "overlay_read_all" ON overlay_state FOR SELECT USING (true);
CREATE POLICY "overlay_update_auth" ON overlay_state FOR UPDATE USING (auth.role() = 'authenticated');
