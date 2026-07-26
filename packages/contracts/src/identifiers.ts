import { v7 as createUuidV7, validate as validateUuid, version as uuidVersion } from "uuid";
import { z } from "zod";

const uuidV7Schema = z
  .string()
  .transform((value) => value.toLowerCase())
  .pipe(
    z.string().refine(
      (value) => validateUuid(value) && uuidVersion(value) === 7,
      "Expected a UUIDv7 identifier.",
    ),
  );

export const guestIdSchema = uuidV7Schema.brand<"GuestId">();
export const guestSessionIdSchema = uuidV7Schema.brand<"GuestSessionId">();
export const roomIdSchema = uuidV7Schema.brand<"RoomId">();
export const membershipIdSchema = uuidV7Schema.brand<"MembershipId">();
export const shareLinkIdSchema = uuidV7Schema.brand<"ShareLinkId">();
export const assetIdSchema = uuidV7Schema.brand<"AssetId">();
export const exportIdSchema = uuidV7Schema.brand<"ExportId">();
export const auditEventIdSchema = uuidV7Schema.brand<"AuditEventId">();

export type GuestId = z.infer<typeof guestIdSchema>;
export type GuestSessionId = z.infer<typeof guestSessionIdSchema>;
export type RoomId = z.infer<typeof roomIdSchema>;
export type MembershipId = z.infer<typeof membershipIdSchema>;
export type ShareLinkId = z.infer<typeof shareLinkIdSchema>;
export type AssetId = z.infer<typeof assetIdSchema>;
export type ExportId = z.infer<typeof exportIdSchema>;
export type AuditEventId = z.infer<typeof auditEventIdSchema>;

export const createGuestId = (): GuestId => guestIdSchema.parse(createUuidV7());
export const createGuestSessionId = (): GuestSessionId =>
  guestSessionIdSchema.parse(createUuidV7());
export const createRoomId = (): RoomId => roomIdSchema.parse(createUuidV7());
export const createMembershipId = (): MembershipId =>
  membershipIdSchema.parse(createUuidV7());
export const createShareLinkId = (): ShareLinkId =>
  shareLinkIdSchema.parse(createUuidV7());
export const createAssetId = (): AssetId => assetIdSchema.parse(createUuidV7());
export const createExportId = (): ExportId => exportIdSchema.parse(createUuidV7());
export const createAuditEventId = (): AuditEventId =>
  auditEventIdSchema.parse(createUuidV7());

type IsAssignable<From, To> = From extends To ? true : false;
type AssertFalse<Value extends false> = Value;

type _GuestIdCannotBecomeRoomId = AssertFalse<IsAssignable<GuestId, RoomId>>;
type _RoomIdCannotBecomeAssetId = AssertFalse<IsAssignable<RoomId, AssetId>>;

export type IdentifierBrandProof = readonly [
  _GuestIdCannotBecomeRoomId,
  _RoomIdCannotBecomeAssetId,
];
