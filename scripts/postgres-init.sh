#!/bin/sh
set -eu

export PGPASSWORD="${POSTGRES_PASSWORD}"

psql \
  --host postgres \
  --username "${POSTGRES_USER}" \
  --dbname "${POSTGRES_DB}" \
  --set api_role="${API_DATABASE_USER}" \
  --set api_password="${API_DATABASE_PASSWORD}" \
  --set collaboration_role="${COLLABORATION_DATABASE_USER}" \
  --set collaboration_password="${COLLABORATION_DATABASE_PASSWORD}" <<'SQL'
SELECT set_config('vega.api_role', :'api_role', false);
SELECT set_config('vega.api_password', :'api_password', false);
SELECT set_config('vega.collaboration_role', :'collaboration_role', false);
SELECT set_config('vega.collaboration_password', :'collaboration_password', false);

DO $roles$
DECLARE
  api_role text := current_setting('vega.api_role');
  api_password text := current_setting('vega.api_password');
  collaboration_role text := current_setting('vega.collaboration_role');
  collaboration_password text := current_setting('vega.collaboration_password');
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = api_role) THEN
    EXECUTE format('CREATE ROLE %I LOGIN', api_role);
  END IF;
  EXECUTE format(
    'ALTER ROLE %I LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD %L',
    api_role,
    api_password
  );

  IF NOT EXISTS (
    SELECT FROM pg_catalog.pg_roles WHERE rolname = collaboration_role
  ) THEN
    EXECUTE format('CREATE ROLE %I LOGIN', collaboration_role);
  END IF;
  EXECUTE format(
    'ALTER ROLE %I LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD %L',
    collaboration_role,
    collaboration_password
  );
END
$roles$;
SQL

echo "PostgreSQL runtime roles initialised."
