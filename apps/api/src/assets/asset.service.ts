import { randomUUID } from "node:crypto";

import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  type S3Client,
} from "@aws-sdk/client-s3";
import {
  IMAGE_MIME_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  type ImageMimeType,
} from "@vega/contracts/assets";
import type { PoolClient } from "pg";

const MIME_TYPES = new Set<string>(IMAGE_MIME_TYPES);
const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/u;

export type AssetFailure =
  | "not_found"
  | "forbidden"
  | "archived"
  | "state"
  | "type"
  | "size"
  | "storage";

export class AssetServiceError extends Error {
  constructor(public readonly reason: AssetFailure) {
    super(reason);
    this.name = "AssetServiceError";
  }
}

export interface AssetRecord {
  id: string;
  room_id: string;
  created_by_guest_id: string;
  kind: "image";
  status: "pending" | "uploading" | "ready" | "failed";
  storage_key: string;
  original_filename: string | null;
  mime_type: ImageMimeType;
  size_bytes: string | number;
  ready_at: Date | null;
}

interface AssetAuthorityRecord extends AssetRecord {
  room_status: string;
  membership_role: string;
}

export interface PublicAsset {
  id: string;
  kind: "image";
  status: AssetRecord["status"];
  mimeType: ImageMimeType;
  sizeBytes: number;
  readyAt?: string;
}

function publicAsset(record: AssetRecord): PublicAsset {
  const result: PublicAsset = {
    id: record.id,
    kind: record.kind,
    status: record.status,
    mimeType: record.mime_type,
    sizeBytes: Number(record.size_bytes),
  };
  if (record.ready_at) {
    result.readyAt = record.ready_at.toISOString();
  }
  return result;
}

async function readAssetAuthority(
  client: PoolClient,
  roomId: string,
  assetId: string,
  guestId: string,
): Promise<AssetAuthorityRecord> {
  const result = await client.query<AssetAuthorityRecord>(
    `SELECT a.*, r.status AS room_status, m.role AS membership_role
     FROM assets a
     JOIN rooms r ON r.id = a.room_id
     JOIN room_memberships m
       ON m.room_id = a.room_id
      AND m.guest_id = $3
      AND m.revoked_at IS NULL
     WHERE a.id = $2 AND a.room_id = $1 AND a.archived_at IS NULL`,
    [roomId, assetId, guestId],
  );
  const record = result.rows[0];
  if (!record) throw new AssetServiceError("not_found");
  if (record.room_status !== "active") {
    throw new AssetServiceError("archived");
  }
  return record;
}

function requireUploader(record: AssetAuthorityRecord): void {
  if (!["owner", "editor"].includes(record.membership_role)) {
    throw new AssetServiceError("forbidden");
  }
}

function hasExpectedSignature(bytes: Buffer, mimeType: ImageMimeType): boolean {
  if (mimeType === "image/png") {
    return (
      bytes.length >= 8 &&
      bytes.subarray(0, 8).equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      )
    );
  }
  if (mimeType === "image/jpeg") {
    return (
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    );
  }
  return (
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  );
}

export function decodeImageDataUrl(
  dataUrl: string,
  expectedMimeType: ImageMimeType,
): Buffer {
  const prefix = `data:${expectedMimeType};base64,`;
  if (!dataUrl.startsWith(prefix)) throw new AssetServiceError("type");

  const encoded = dataUrl.slice(prefix.length);
  if (!encoded || !BASE64_PATTERN.test(encoded)) {
    throw new AssetServiceError("type");
  }

  const bytes = Buffer.from(encoded, "base64");
  if (bytes.length === 0 || bytes.length > MAX_IMAGE_SIZE_BYTES) {
    throw new AssetServiceError("size");
  }
  if (!hasExpectedSignature(bytes, expectedMimeType)) {
    throw new AssetServiceError("type");
  }
  return bytes;
}

export async function createImageAsset(
  client: PoolClient,
  params: {
    roomId: string;
    guestId: string;
    mimeType: string;
    sizeBytes: number;
    originalFilename?: string;
  },
): Promise<PublicAsset> {
  if (!MIME_TYPES.has(params.mimeType)) throw new AssetServiceError("type");
  if (params.sizeBytes <= 0 || params.sizeBytes > MAX_IMAGE_SIZE_BYTES) {
    throw new AssetServiceError("size");
  }

  const authority = await client.query<{
    status: string;
    role: string;
  }>(
    `SELECT r.status, m.role
     FROM rooms r
     JOIN room_memberships m
       ON m.room_id = r.id
      AND m.guest_id = $2
      AND m.revoked_at IS NULL
     WHERE r.id = $1`,
    [params.roomId, params.guestId],
  );
  const membership = authority.rows[0];
  if (!membership) throw new AssetServiceError("not_found");
  if (membership.status !== "active") throw new AssetServiceError("archived");
  if (!["owner", "editor"].includes(membership.role)) {
    throw new AssetServiceError("forbidden");
  }

  const assetId = randomUUID();
  const storageKey = `rooms/${params.roomId}/assets/${assetId}`;
  const result = await client.query<AssetRecord>(
    `INSERT INTO assets (
       id, room_id, created_by_guest_id, kind, status, storage_key,
       original_filename, mime_type, size_bytes
     )
     VALUES ($1, $2, $3, 'image', 'pending', $4, $5, $6, $7)
     RETURNING *`,
    [
      assetId,
      params.roomId,
      params.guestId,
      storageKey,
      params.originalFilename ?? null,
      params.mimeType,
      params.sizeBytes,
    ],
  );
  const record = result.rows[0];
  if (!record) throw new AssetServiceError("storage");
  return publicAsset(record);
}

export async function uploadImageAsset(
  client: PoolClient,
  storage: S3Client,
  bucket: string,
  params: {
    roomId: string;
    assetId: string;
    guestId: string;
    dataUrl: string;
  },
): Promise<PublicAsset> {
  const asset = await readAssetAuthority(
    client,
    params.roomId,
    params.assetId,
    params.guestId,
  );
  requireUploader(asset);
  if (!["pending", "failed"].includes(asset.status)) {
    throw new AssetServiceError("state");
  }

  const bytes = decodeImageDataUrl(params.dataUrl, asset.mime_type);
  if (bytes.length !== Number(asset.size_bytes)) {
    throw new AssetServiceError("size");
  }

  await client.query(
    `UPDATE assets SET status = 'uploading', updated_at = NOW(), failed_at = NULL
     WHERE id = $1`,
    [asset.id],
  );

  try {
    await storage.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: asset.storage_key,
        Body: bytes,
        ContentType: asset.mime_type,
      }),
    );
  } catch {
    await client.query(
      `UPDATE assets SET status = 'failed', updated_at = NOW(), failed_at = NOW()
       WHERE id = $1`,
      [asset.id],
    );
    throw new AssetServiceError("storage");
  }

  return { ...publicAsset(asset), status: "uploading" };
}

export async function completeImageAsset(
  client: PoolClient,
  storage: S3Client,
  bucket: string,
  params: { roomId: string; assetId: string; guestId: string },
): Promise<PublicAsset> {
  const asset = await readAssetAuthority(
    client,
    params.roomId,
    params.assetId,
    params.guestId,
  );
  requireUploader(asset);
  if (asset.status !== "uploading") throw new AssetServiceError("state");

  try {
    const stored = await storage.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: asset.storage_key,
      }),
    );
    if (
      stored.ContentLength !== Number(asset.size_bytes) ||
      stored.ContentType !== asset.mime_type
    ) {
      throw new AssetServiceError("storage");
    }
  } catch (error: unknown) {
    if (error instanceof AssetServiceError) throw error;
    throw new AssetServiceError("storage");
  }

  const result = await client.query<AssetRecord>(
    `UPDATE assets
     SET status = 'ready', ready_at = NOW(), updated_at = NOW(), failed_at = NULL
     WHERE id = $1
     RETURNING *`,
    [asset.id],
  );
  const ready = result.rows[0];
  if (!ready) throw new AssetServiceError("storage");
  return publicAsset(ready);
}

export async function getImageAsset(
  client: PoolClient,
  params: { roomId: string; assetId: string; guestId: string },
): Promise<{ public: PublicAsset; record: AssetRecord }> {
  const asset = await readAssetAuthority(
    client,
    params.roomId,
    params.assetId,
    params.guestId,
  );
  return { public: publicAsset(asset), record: asset };
}

export async function readImageAssetContent(
  client: PoolClient,
  storage: S3Client,
  bucket: string,
  params: { roomId: string; assetId: string; guestId: string },
): Promise<{ body: Buffer; mimeType: ImageMimeType }> {
  const { record } = await getImageAsset(client, params);
  if (record.status !== "ready") throw new AssetServiceError("state");

  try {
    const object = await storage.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: record.storage_key,
      }),
    );
    if (!object.Body) throw new AssetServiceError("storage");
    const bytes = Buffer.from(await object.Body.transformToByteArray());
    if (
      bytes.length !== Number(record.size_bytes) ||
      object.ContentType !== record.mime_type
    ) {
      throw new AssetServiceError("storage");
    }
    return { body: bytes, mimeType: record.mime_type };
  } catch (error: unknown) {
    if (error instanceof AssetServiceError) throw error;
    throw new AssetServiceError("storage");
  }
}

