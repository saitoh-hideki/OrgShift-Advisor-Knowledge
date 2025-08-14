# OrgShift Advisor - Deployment Instructions

## Prerequisites
```bash
npm install -g supabase
```

## Step 1: Database Setup

```bash
cd orgshift

# Link to your Supabase project
supabase link --project-ref eqiqthlfjcbyqfudziar

# Push database migrations
supabase db push

# Seed initial data (run in Supabase SQL Editor)
-- Insert scenes
INSERT INTO scenes (id, name) VALUES
  ('meeting', '会議'),
  ('sales', '営業'),
  ('one_on_one', '1on1');

-- Insert theories (use Supabase Table Editor to import theories.min.json)
-- Or use this SQL helper script:
```

## Step 2: Seed Data Helper Script

Create and run this script to seed data:

```bash
# Create seed helper script
cat > seed_data.js << 'EOF'
const theories = require('./supabase/seed/theories.min.json');
const mappingRules = require('./supabase/seed/mapping_rules.min.json');

// Generate SQL for theories
console.log('-- Theories insert');
theories.forEach(t => {
  console.log(`INSERT INTO theories (id, name_ja, name_en, domain, one_liner, mechanism, how_to, templates, tags) VALUES (
    '${t.id}', '${t.name_ja}', '${t.name_en}', '${t.domain}', 
    '${t.one_liner}', '${t.mechanism || ''}', 
    '${JSON.stringify(t.how_to)}', '${JSON.stringify(t.templates)}', 
    ARRAY[${t.tags.map(tag => `'${tag}'`).join(',')}]
  );`);
});

// Generate SQL for mapping rules
console.log('\n-- Mapping rules insert');
Object.entries(mappingRules).forEach(([scene, data]) => {
  console.log(`INSERT INTO mapping_rules (scene_id, weights, theory_scores) VALUES (
    '${scene}', 
    '${JSON.stringify(data.weights)}', 
    '${JSON.stringify(data.theories)}'
  );`);
});
EOF

node seed_data.js > seed.sql
# Copy the output SQL and run it in Supabase SQL Editor
```

## Step 3: Deploy Edge Functions

```bash
# Deploy all functions with no JWT verification (prototype mode)
supabase functions deploy advice --no-verify-jwt
supabase functions deploy theory --no-verify-jwt
supabase functions deploy feedback --no-verify-jwt

# Set secrets (if not already set)
supabase secrets set OPENAI_API_KEY=your_openai_key_here
```

## Step 4: Test Edge Functions

```bash
# Test advice endpoint
curl -X POST "https://eqiqthlfjcbyqfudziar.supabase.co/functions/v1/advice" \
  -H 'Content-Type: application/json' \
  -d '{
    "scene": "meeting",
    "goal": "decide",
    "time_limit": "short",
    "stakes": "high"
  }'

# Test theory endpoint
curl "https://eqiqthlfjcbyqfudziar.supabase.co/functions/v1/theory?id=anchoring"

# Test feedback endpoint (replace SESSION_ID with actual UUID from advice response)
curl -X POST "https://eqiqthlfjcbyqfudziar.supabase.co/functions/v1/feedback" \
  -H 'Content-Type: application/json' \
  -d '{
    "session_id": "SESSION_ID",
    "result": "success",
    "comment": "Worked well",
    "executed_theory_ids": ["anchoring", "framing"]
  }'
```

## Step 5: Setup Web Admin (Optional)

```bash
cd web-admin
npm install
npm run dev
# Open http://localhost:3000

# Deploy to Vercel
vercel
# Set environment variables in Vercel dashboard
```

## Step 6: Setup Mobile App

```bash
cd mobile
npm install

# Create assets directory for Expo
mkdir -p assets
# Add placeholder images (icon.png, splash.png, adaptive-icon.png, favicon.png)

# Start Expo
npx expo start
# Press 'i' for iOS, 'a' for Android
```

## Environment Variables Summary

### Supabase Functions (.env)
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY  
- OPENAI_API_KEY

### Web Admin (.env.local)
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

### Mobile App (.env)
- EXPO_PUBLIC_SUPABASE_URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY

## Monitoring

Check function logs:
```bash
supabase functions logs advice
supabase functions logs theory
supabase functions logs feedback
```

## Troubleshooting

1. If functions return 500 errors, check:
   - Database tables are created
   - Seed data is inserted
   - Environment variables are set

2. If mobile app can't connect:
   - Ensure functions are deployed with --no-verify-jwt
   - Check CORS headers in function responses

3. Database connection issues:
   - Verify SUPABASE_SERVICE_ROLE_KEY is correct
   - Check Supabase project is active