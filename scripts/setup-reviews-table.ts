import { Database } from 'bun:sqlite'

const dbPath = '.data/db/sqlite.db'
console.log('Connecting to database:', dbPath)
const db = new Database(dbPath)

db.run(`
CREATE TABLE IF NOT EXISTS project_reviews (
	id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	project_id integer NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
	user_id text NOT NULL REFERENCES user(id) ON DELETE CASCADE,
	rating integer NOT NULL,
	comment text,
	created_at integer NOT NULL,
	updated_at integer
);
`)

db.run(`CREATE UNIQUE INDEX IF NOT EXISTS project_user_review_unique ON project_reviews (project_id, user_id);`)

try {
	db.run(`INSERT OR IGNORE INTO _hub_migrations (name, applied_at) VALUES ('0004_project_reviews', datetime('now'))`)
} catch (e) {
	console.error('Error inserting migration record:', e)
}

const tables = db.query('SELECT name FROM sqlite_master WHERE type=\'table\'').all()
console.log('Tables in database:', tables)
console.log('project_reviews ready!')
