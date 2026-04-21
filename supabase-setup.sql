-- ============================================
-- 🎵 스트리머 노래책 - Supabase 테이블 설정
-- ============================================

-- 1. songs 테이블 생성
CREATE TABLE songs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  genre TEXT NOT NULL CHECK (genre IN ('kpop', 'jpop', 'pop')),
  artist TEXT NOT NULL,
  title TEXT NOT NULL,
  level INT DEFAULT 0 CHECK (level >= 0 AND level <= 5),
  memo TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. RLS (Row Level Security) 활성화
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- 3. 공개 읽기 정책 (시청자 누구나 읽기 가능)
CREATE POLICY "Public can read songs" ON songs
  FOR SELECT USING (true);

-- 4. 인증된 사용자만 추가/수정/삭제 가능 (Admin)
CREATE POLICY "Authenticated can insert" ON songs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update" ON songs
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete" ON songs
  FOR DELETE USING (auth.role() = 'authenticated');

-- 5. 장르별 조회 성능을 위한 인덱스
CREATE INDEX idx_songs_genre ON songs (genre);

-- 6. updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER songs_updated_at
  BEFORE UPDATE ON songs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 💡 Supabase 대시보드 > SQL Editor 에서 실행하세요
-- ============================================
