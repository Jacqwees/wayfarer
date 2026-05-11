import pg from 'pg'

const client = new pg.Client({
  host: 'db.fkybsfpdhvjitivsylnj.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'nkUDvjV92*zS/MU',
  ssl: { rejectUnauthorized: false }
})

await client.connect()

await client.query(`
  CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, endpoint)
  );

  ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can manage own push subscriptions"
    ON push_subscriptions FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
`)

console.log('push_subscriptions table created')
await client.end()
