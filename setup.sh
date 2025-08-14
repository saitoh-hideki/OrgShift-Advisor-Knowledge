#!/bin/bash

echo "OrgShift Advisor - Quick Setup Script"
echo "======================================"

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Installing Supabase CLI..."
    npm install -g supabase
fi

# Step 1: Link to Supabase project
echo "Step 1: Linking to Supabase project..."
supabase link --project-ref eqiqthlfjcbyqfudziar

# Step 2: Push database schema
echo "Step 2: Pushing database schema..."
supabase db push

# Step 3: Deploy Edge Functions
echo "Step 3: Deploying Edge Functions..."
supabase functions deploy advice --no-verify-jwt
supabase functions deploy theory --no-verify-jwt  
supabase functions deploy feedback --no-verify-jwt

# Step 4: Generate seed SQL
echo "Step 4: Generating seed SQL..."
node -e "
const theories = require('./supabase/seed/theories.min.json');
const mappingRules = require('./supabase/seed/mapping_rules.min.json');

// Scenes
console.log('-- Insert scenes');
console.log(\"INSERT INTO scenes (id, name) VALUES ('meeting', '会議'), ('sales', '営業'), ('one_on_one', '1on1');\");

// Theories
console.log('\\n-- Insert theories');
theories.forEach(t => {
  const tags = t.tags.map(tag => \"'\" + tag + \"'\").join(',');
  console.log(\`INSERT INTO theories (id, name_ja, name_en, domain, one_liner, mechanism, how_to, templates, tags) VALUES (
    '\${t.id}', '\${t.name_ja}', '\${t.name_en}', '\${t.domain}',
    '\${t.one_liner}', '\${t.mechanism || ''}',
    '\${JSON.stringify(t.how_to).replace(/'/g, \"''\")}',
    '\${JSON.stringify(t.templates).replace(/'/g, \"''\")}',
    ARRAY[\${tags}]
  );\`);
});

// Mapping rules
console.log('\\n-- Insert mapping rules');
Object.entries(mappingRules).forEach(([scene, data]) => {
  console.log(\`INSERT INTO mapping_rules (scene_id, weights, theory_scores) VALUES (
    '\${scene}',
    '\${JSON.stringify(data.weights).replace(/'/g, \"''\")}',
    '\${JSON.stringify(data.theories).replace(/'/g, \"''\")}'
  );\`);
});
" > seed_generated.sql

echo ""
echo "Setup complete! Next steps:"
echo "1. Copy the contents of seed_generated.sql"
echo "2. Paste and run in Supabase SQL Editor"
echo "3. Test with: curl -X POST \"https://eqiqthlfjcbyqfudziar.supabase.co/functions/v1/advice\" -H 'Content-Type: application/json' -d '{\"scene\":\"meeting\",\"goal\":\"decide\",\"time_limit\":\"short\",\"stakes\":\"high\"}'"