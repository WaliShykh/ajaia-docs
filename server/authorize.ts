import { can, type Action, type Role } from "@/shared/policy";
import { Forbidden, NotFound } from "./errors";

/**
 * Throws unless `role` permits `action`. No role at all is reported as 404 so
 * callers can't probe which document IDs exist.
 */
export function authorize(role: Role | null, action: Action): asserts role is Role {
  if (role == null) throw new NotFound("Document not found.");
  if (!can(role, action)) throw new Forbidden();
}
