CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    email       TEXT NOT NULL UNIQUE,
    password    TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS otps (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id),
    code        VARCHAR(6) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    used        BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_otps_code ON otps(code);
CREATE INDEX IF NOT EXISTS idx_otps_expires ON otps(expires_at);

CREATE TABLE IF NOT EXISTS upload_sessions (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id),
    session_sig UUID NOT NULL UNIQUE,
    token       TEXT,
    status      VARCHAR(10) DEFAULT 'pending',
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sessions_sig ON upload_sessions(session_sig);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON upload_sessions(token);

CREATE TABLE IF NOT EXISTS uploads (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id),
    session_id      INTEGER REFERENCES upload_sessions(id),
    s3_key          TEXT NOT NULL,
    original_name   TEXT NOT NULL,
    size_bytes       BIGINT NOT NULL,
    mime_type       TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
