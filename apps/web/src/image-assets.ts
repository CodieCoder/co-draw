import { ROOM_YJS_KEYS } from "@vega/collaboration-schema";
import type {
  BinaryFileData,
  BinaryFiles,
  ExcalidrawImperativeAPI,
} from "@vega/excalidraw-adapter/excalidraw";
import type * as Y from "yjs";

import {
  completeImageAsset,
  createImageAsset,
  getImageAssetContent,
  uploadImageAsset,
} from "./api.js";

const IMAGE_MAPPING_PREFIX = "asset:image:";
const SUPPORTED_IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

export interface ImageAssetMapping {
  kind: "image";
  assetId: string;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  status: "ready";
  createdAt: string;
}

export function imageMappingKey(fileId: string): string {
  return `${IMAGE_MAPPING_PREFIX}${fileId}`;
}

export function parseImageAssetMapping(
  value: unknown,
): ImageAssetMapping | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  if (
    candidate.kind !== "image" ||
    candidate.status !== "ready" ||
    typeof candidate.assetId !== "string" ||
    !/^[0-9a-f-]{36}$/iu.test(candidate.assetId) ||
    typeof candidate.mimeType !== "string" ||
    !SUPPORTED_IMAGE_MIME_TYPES.has(candidate.mimeType) ||
    typeof candidate.createdAt !== "string"
  ) {
    return null;
  }
  return candidate as unknown as ImageAssetMapping;
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Image could not be decoded"));
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Image could not be decoded"));
    };
    reader.readAsDataURL(blob);
  });
}

export interface ImageAssetManagerOptions {
  roomId: string;
  ydoc: Y.Doc;
  canUpload: boolean;
  getApi: () => ExcalidrawImperativeAPI | null;
  onStatus: (status: string | null) => void;
}

export class ImageAssetManager {
  readonly #roomId: string;
  readonly #ydoc: Y.Doc;
  readonly #canUpload: boolean;
  readonly #getApi: () => ExcalidrawImperativeAPI | null;
  readonly #onStatus: (status: string | null) => void;
  readonly #productObjects: Y.Map<Record<string, unknown>>;
  readonly #uploading = new Set<string>();
  readonly #resolving = new Map<string, Promise<void>>();
  #disposed = false;
  #observer: (() => void) | null = null;

  constructor(options: ImageAssetManagerOptions) {
    this.#roomId = options.roomId;
    this.#ydoc = options.ydoc;
    this.#canUpload = options.canUpload;
    this.#getApi = options.getApi;
    this.#onStatus = options.onStatus;
    this.#productObjects = options.ydoc.getMap<Record<string, unknown>>(
      ROOM_YJS_KEYS.productObjects,
    );
  }

  start(): void {
    if (this.#observer) return;
    this.#observer = () => {
      void this.resolveCurrentScene();
    };
    this.#productObjects.observe(this.#observer);
    void this.resolveCurrentScene();
  }

  stop(): void {
    this.#disposed = true;
    if (this.#observer) {
      this.#productObjects.unobserve(this.#observer);
      this.#observer = null;
    }
    this.#resolving.clear();
    this.#uploading.clear();
  }

  handleLocalFiles(files: BinaryFiles): void {
    if (!this.#canUpload || this.#disposed) return;
    for (const file of Object.values(files)) {
      if (
        file.mimeType.startsWith("image/") &&
        !SUPPORTED_IMAGE_MIME_TYPES.has(file.mimeType)
      ) {
        this.#onStatus("Only PNG, JPEG, and WebP images can be shared");
        continue;
      }
      if (
        SUPPORTED_IMAGE_MIME_TYPES.has(file.mimeType) &&
        !this.#productObjects.has(imageMappingKey(String(file.id))) &&
        !this.#uploading.has(String(file.id))
      ) {
        void this.#upload(file);
      }
    }
  }

  async resolveCurrentScene(): Promise<void> {
    const api = this.#getApi();
    if (!api || this.#disposed) return;

    const localFiles = api.getFiles();
    this.handleLocalFiles(localFiles);
    const referencedFileIds = new Set<string>();
    for (const element of api.getSceneElementsIncludingDeleted()) {
      if (
        element.type === "image" &&
        element.isDeleted !== true &&
        typeof element.fileId === "string"
      ) {
        referencedFileIds.add(element.fileId);
      }
    }

    for (const fileId of referencedFileIds) {
      if (localFiles[fileId] || this.#resolving.has(fileId)) continue;
      const mapping = parseImageAssetMapping(
        this.#productObjects.get(imageMappingKey(fileId)),
      );
      if (!mapping) continue;
      const resolution = this.#resolve(fileId, mapping).finally(() => {
        this.#resolving.delete(fileId);
      });
      this.#resolving.set(fileId, resolution);
    }
    await Promise.allSettled(this.#resolving.values());
  }

  async #upload(file: BinaryFileData): Promise<void> {
    const fileId = String(file.id);
    this.#uploading.add(fileId);
    this.#onStatus("Uploading image…");
    try {
      const encoded = file.dataURL.slice(file.dataURL.indexOf(",") + 1);
      const padding = encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0;
      const sizeBytes = Math.floor((encoded.length * 3) / 4) - padding;
      const mimeType = file.mimeType;
      if (
        mimeType !== "image/png" &&
        mimeType !== "image/jpeg" &&
        mimeType !== "image/webp"
      ) {
        throw new Error("Only PNG, JPEG, and WebP images can be shared");
      }

      const created = await createImageAsset(this.#roomId, {
        mimeType,
        sizeBytes,
      });
      await uploadImageAsset(
        this.#roomId,
        created.asset.id,
        String(file.dataURL),
      );
      const completed = await completeImageAsset(
        this.#roomId,
        created.asset.id,
      );
      if (completed.asset.status !== "ready") {
        throw new Error("Image upload did not become ready");
      }

      const mapping: ImageAssetMapping = {
        kind: "image",
        assetId: completed.asset.id,
        mimeType,
        status: "ready",
        createdAt: new Date().toISOString(),
      };
      this.#ydoc.transact(() => {
        this.#productObjects.set(imageMappingKey(fileId), { ...mapping });
      }, "local-asset-mapping");
      if (!this.#disposed) this.#onStatus("Image shared");
    } catch (error: unknown) {
      if (!this.#disposed) {
        this.#onStatus(
          error instanceof Error ? error.message : "Image upload failed",
        );
      }
    } finally {
      this.#uploading.delete(fileId);
    }
  }

  async #resolve(
    fileId: string,
    mapping: ImageAssetMapping,
  ): Promise<void> {
    this.#onStatus("Loading shared image…");
    try {
      const blob = await getImageAssetContent(this.#roomId, mapping.assetId);
      const dataURL = await blobToDataUrl(blob);
      if (this.#disposed) return;
      const api = this.#getApi();
      if (!api) return;
      api.addFiles([
        {
          id: fileId as BinaryFileData["id"],
          mimeType: mapping.mimeType,
          dataURL: dataURL as BinaryFileData["dataURL"],
          created: Date.parse(mapping.createdAt) || Date.now(),
          lastRetrieved: Date.now(),
        },
      ]);
      api.refresh();
      this.#onStatus(null);
    } catch {
      this.#onStatus("Shared image is unavailable");
    }
  }
}
