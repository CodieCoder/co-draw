#!/bin/sh
set -eu

mc alias set \
  local \
  http://minio:9000 \
  "${MINIO_ROOT_USER}" \
  "${MINIO_ROOT_PASSWORD}"

mc mb --ignore-existing "local/${OBJECT_STORAGE_BUCKET}"
mc admin user add \
  local \
  "${OBJECT_STORAGE_ACCESS_KEY}" \
  "${OBJECT_STORAGE_SECRET_KEY}"

{
  printf '%s\n' \
    '{' \
    '  "Version": "2012-10-17",' \
    '  "Statement": [' \
    '    {' \
    '      "Effect": "Allow",' \
    '      "Action": [' \
    '        "s3:GetBucketLocation",' \
    '        "s3:ListBucket",' \
    '        "s3:ListBucketMultipartUploads"' \
    '      ],'
  printf '      "Resource": ["arn:aws:s3:::%s"]\n' "${OBJECT_STORAGE_BUCKET}"
  printf '%s\n' \
    '    },' \
    '    {' \
    '      "Effect": "Allow",' \
    '      "Action": [' \
    '        "s3:GetObject",' \
    '        "s3:PutObject",' \
    '        "s3:DeleteObject",' \
    '        "s3:AbortMultipartUpload",' \
    '        "s3:ListMultipartUploadParts"' \
    '      ],'
  printf '      "Resource": ["arn:aws:s3:::%s/*"]\n' "${OBJECT_STORAGE_BUCKET}"
  printf '%s\n' \
    '    }' \
    '  ]' \
    '}'
} > /tmp/vega-canvas-policy.json

mc admin policy create \
  local \
  vega-canvas-rw \
  /tmp/vega-canvas-policy.json

# Existing Stage 0B volumes may retain the original server-wide policy.
mc admin policy detach \
  local \
  readwrite \
  --user "${OBJECT_STORAGE_ACCESS_KEY}" 2>/dev/null || true

mc admin policy attach \
  local \
  vega-canvas-rw \
  --user "${OBJECT_STORAGE_ACCESS_KEY}"
mc anonymous set private "local/${OBJECT_STORAGE_BUCKET}"

echo "MinIO bucket and scoped runtime policy initialised."
