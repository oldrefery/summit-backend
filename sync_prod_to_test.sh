#!/usr/bin/env bash
set -e  # Stops the script on error

# === Loading environment variables from .env.test ===
ENV_FILE=".env.test"

if [ -f "$ENV_FILE" ]; then
    echo "Loading environment variables from $ENV_FILE..."
    export $(grep -v '^#' $ENV_FILE | xargs)
else
    echo "Error: $ENV_FILE file not found! Please create it with the required variables."
    exit 1
fi

# Names of buckets for files
BUCKET1="avatars"
BUCKET2="app-data"

# Local folders for downloading/uploading
LOCAL_AVATARS_PATH="local_avatars"
LOCAL_APPDATA_PATH="local_app_data"

# Names of files for dumps
SCHEMA_FILE="prod_schema.sql"
DATA_FILE="prod_data.sql"

# SQL for cleaning the public schema
CLEANUP_SQL='DROP SCHEMA public CASCADE; CREATE SCHEMA public;'

echo "=== Step 1) Connecting to PROD project for DB and Storage"
# Using input redirection to pass an empty password
npx supabase link --project-ref "$PROD_PROJECT" <<< ""

echo "=== Step 2) Dumping the SCHEMA (structure) from PROD"
npx supabase db dump --file "$SCHEMA_FILE"

echo "=== Step 3) Dumping the DATA (inserts) from PROD"
npx supabase db dump --data-only --file "$DATA_FILE"

echo "=== Step 4) Copying files from PROD Storage to local folders"
npx supabase --experimental storage cp "ss://$BUCKET1/" "./$LOCAL_AVATARS_PATH" --recursive
npx supabase --experimental storage cp "ss://$BUCKET2/" "./$LOCAL_APPDATA_PATH" --recursive

echo "=== Step 5) Connecting to TEST project (only for using storage)"
# Using input redirection to pass an empty password
npx supabase link --project-ref "$TEST_PROJECT" <<< ""

echo "=== Step 6) Cleaning TEST DB: deleting the public schema"
PGPASSWORD="$TEST_DB_PASS" psql \
  --host="$TEST_DB_HOST" \
  --port="$TEST_DB_PORT" \
  --username="$TEST_DB_USER" \
  --dbname="$TEST_DB_NAME" \
  --command="$CLEANUP_SQL"

echo "=== Step 7) Applying the SCHEMA dump to TEST DB"
PGPASSWORD="$TEST_DB_PASS" psql \
  --host="$TEST_DB_HOST" \
  --port="$TEST_DB_PORT" \
  --username="$TEST_DB_USER" \
  --dbname="$TEST_DB_NAME" \
  --file="$SCHEMA_FILE"

echo "=== Step 8) Applying the DATA dump to TEST DB"
PGPASSWORD="$TEST_DB_PASS" psql \
  --host="$TEST_DB_HOST" \
  --port="$TEST_DB_PORT" \
  --username="$TEST_DB_USER" \
  --dbname="$TEST_DB_NAME" \
  --file="$DATA_FILE"

echo "=== Step 9) Copying local folders to TEST Storage"
npx supabase --experimental storage cp "./$LOCAL_AVATARS_PATH" "ss://$BUCKET1/" --recursive
npx supabase --experimental storage cp "./$LOCAL_APPDATA_PATH" "ss://$BUCKET2/" --recursive

echo "=== Synchronization completed! ==="
