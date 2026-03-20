CREATE TABLE IF NOT EXISTS email_whitelist (
    id          SERIAL PRIMARY KEY,
    email       TEXT NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 기존 가입자를 화이트리스트에 일괄 등록
INSERT INTO email_whitelist (email)
SELECT email FROM users
ON CONFLICT (email) DO NOTHING;
