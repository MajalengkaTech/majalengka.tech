import { Database } from 'bun:sqlite'

const dbPath = '.data/db/sqlite.db'
console.log('Connecting to database:', dbPath)
const db = new Database(dbPath)

// Create Better Auth tables
db.run(`
CREATE TABLE IF NOT EXISTS \`user\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`name\` text NOT NULL,
	\`email\` text NOT NULL UNIQUE,
	\`emailVerified\` integer DEFAULT 0 NOT NULL,
	\`image\` text,
	\`createdAt\` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	\`updatedAt\` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	\`role\` text DEFAULT 'user',
	\`banned\` integer DEFAULT 0,
	\`banReason\` text,
	\`banExpires\` integer,
	\`bio\` text,
	\`githubUsername\` text,
	\`websiteUrl\` text
);
`)

db.run(`
CREATE TABLE IF NOT EXISTS \`session\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`expiresAt\` integer NOT NULL,
	\`token\` text NOT NULL UNIQUE,
	\`createdAt\` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	\`updatedAt\` integer NOT NULL,
	\`ipAddress\` text,
	\`userAgent\` text,
	\`userId\` text NOT NULL REFERENCES \`user\`(\`id\`) ON DELETE CASCADE,
	\`impersonatedBy\` text
);
`)

db.run(`CREATE INDEX IF NOT EXISTS \`session_userId_idx\` ON \`session\` (\`userId\`);`)

db.run(`
CREATE TABLE IF NOT EXISTS \`account\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`accountId\` text NOT NULL,
	\`providerId\` text NOT NULL,
	\`userId\` text NOT NULL REFERENCES \`user\`(\`id\`) ON DELETE CASCADE,
	\`accessToken\` text,
	\`refreshToken\` text,
	\`idToken\` text,
	\`accessTokenExpiresAt\` integer,
	\`refreshTokenExpiresAt\` integer,
	\`scope\` text,
	\`password\` text,
	\`createdAt\` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	\`updatedAt\` integer NOT NULL
);
`)

db.run(`CREATE INDEX IF NOT EXISTS \`account_userId_idx\` ON \`account\` (\`userId\`);`)

db.run(`
CREATE TABLE IF NOT EXISTS \`verification\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`identifier\` text NOT NULL,
	\`value\` text NOT NULL,
	\`expiresAt\` integer NOT NULL,
	\`createdAt\` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	\`updatedAt\` integer NOT NULL
);
`)

db.run(`CREATE INDEX IF NOT EXISTS \`verification_identifier_idx\` ON \`verification\` (\`identifier\`);`)

// Record applied migrations into _hub_migrations so NuxtHub doesn't re-run them
try {
	db.run(`INSERT OR IGNORE INTO _hub_migrations (name, applied_at) VALUES ('0001_projects_and_profile', datetime('now'))`)
	db.run(`INSERT OR IGNORE INTO _hub_migrations (name, applied_at) VALUES ('0002_better_auth', datetime('now'))`)
	const migrations = db.query('SELECT * FROM _hub_migrations').all()
	console.log('Current _hub_migrations:', migrations)
} catch (e) {
	console.error('Error updating migrations:', e)
}

// Also verify projects table has userId as text
const tables = db.query('SELECT name FROM sqlite_master WHERE type=\'table\'').all()
console.log('Tables in database:', tables)
console.log('✅ Better Auth tables created successfully!')
