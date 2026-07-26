import { randomUUID } from "node:crypto";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const PROBE_TIMEOUT_MS = 5_000;
const CLEANUP_TIMEOUT_MS = 2_000;
const PROBE_PREFIX = ".health/";
const PROBE_BODY = "readiness-probe";

export type StorageProbeResult =
  | { readonly ready: true }
  | {
      readonly ready: false;
      readonly reason: "unavailable" | "access_denied" | "probe_failed";
    };

const withAbortTimeout = async <Output>(
  operation: (signal: AbortSignal) => Promise<Output>,
  timeoutMs: number,
): Promise<Output> => {
  const controller = new AbortController();
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutHandle = setTimeout(() => {
      controller.abort();
      reject(new Error("STORAGE_PROBE_TIMEOUT"));
    }, timeoutMs);
  });
  try {
    return await Promise.race([operation(controller.signal), timeout]);
  } finally {
    clearTimeout(timeoutHandle);
  }
};

const sendWithTimeout = async <Output>(
  client: S3Client,
  command:
    | DeleteObjectCommand
    | GetObjectCommand
    | HeadBucketCommand
    | PutObjectCommand,
  timeoutMs: number,
): Promise<Output> =>
  withAbortTimeout(
    (signal) =>
      client.send(command as never, { abortSignal: signal }) as Promise<Output>,
    timeoutMs,
  );

export const probeStorageReadiness = async (
  client: S3Client,
  bucket: string,
): Promise<StorageProbeResult> => {
  const probeKey = `${PROBE_PREFIX}${randomUUID()}.txt`;
  let objectMayExist = false;
  let result: StorageProbeResult = {
    ready: false,
    reason: "probe_failed",
  };

  try {
    await sendWithTimeout(
      client,
      new HeadBucketCommand({ Bucket: bucket }),
      PROBE_TIMEOUT_MS,
    );

    objectMayExist = true;
    await sendWithTimeout(
      client,
      new PutObjectCommand({
        Bucket: bucket,
        Key: probeKey,
        Body: PROBE_BODY,
        ContentType: "text/plain",
      }),
      PROBE_TIMEOUT_MS,
    );

    const { body, output: getResult } = await withAbortTimeout(
      async (signal) => {
        const output = await client.send(
          new GetObjectCommand({ Bucket: bucket, Key: probeKey }),
          { abortSignal: signal },
        );
        return {
          output,
          body: await output.Body?.transformToString(),
        };
      },
      PROBE_TIMEOUT_MS,
    );
    result =
      getResult.ContentType === "text/plain" && body === PROBE_BODY
        ? { ready: true }
        : { ready: false, reason: "probe_failed" };
  } catch {
    result = { ready: false, reason: "unavailable" };
  } finally {
    if (objectMayExist) {
      try {
        await sendWithTimeout(
          client,
          new DeleteObjectCommand({ Bucket: bucket, Key: probeKey }),
          CLEANUP_TIMEOUT_MS,
        );
      } catch {
        result = { ready: false, reason: "probe_failed" };
      }
    }
  }

  return result;
};

export const createStorageClient = (configuration: {
  endpoint: string;
  region: string;
  accessKey: string;
  secretKey: string;
  forcePathStyle: boolean;
}): S3Client =>
  new S3Client({
    endpoint: configuration.endpoint,
    region: configuration.region,
    credentials: {
      accessKeyId: configuration.accessKey,
      secretAccessKey: configuration.secretKey,
    },
    forcePathStyle: configuration.forcePathStyle,
    requestHandler: {
      requestTimeout: PROBE_TIMEOUT_MS,
      connectionTimeout: PROBE_TIMEOUT_MS,
    },
  });
