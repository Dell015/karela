import { supabase } from "@/services/database/supabase/config";
import { isTransientNetworkError, logRequestError } from "@/services/networkErrors";

/**
 * Calls a Supabase database function and turns failures into messages the
 * user can read.
 *
 * The game functions (shop, squads, guilds, territory) raise errors written
 * for people ("You already own this."), so those are shown as they are.
 * Anything else becomes a short, honest fallback.
 */

export class RpcError extends Error {
  /** true when the database function doesn't exist yet (a migration wasn't run). */
  readonly notSetUp: boolean;
  constructor(message: string, notSetUp = false) {
    super(message);
    this.notSetUp = notSetUp;
  }
}

export const NOT_SET_UP =
  "This part of Karela isn't switched on for this server yet. Try again after the next update.";

export const callRpc = async <T>(fn: string, args?: Record<string, unknown>): Promise<T> => {
  const { data, error } = await supabase.rpc(fn, args);
  if (!error) return data as T;

  if (error.code === "PGRST202" || error.code === "42883") {
    throw new RpcError(NOT_SET_UP, true);
  }
  // P0001 = RAISE EXCEPTION in our functions: written for the user.
  if (error.code === "P0001" && error.message) {
    throw new RpcError(error.message);
  }
  logRequestError(`RPC ${fn} failed:`, error);
  if (isTransientNetworkError(error)) {
    throw new RpcError("You seem to be offline. Check your connection and try again.");
  }
  throw new RpcError("Something went wrong on our side. Try again in a moment.");
};

/** Message for any error thrown around an RPC call. */
export const errorMessage = (e: unknown) =>
  e instanceof RpcError
    ? e.message
    : isTransientNetworkError(e)
      ? "You seem to be offline. Check your connection and try again."
      : "Something went wrong. Try again in a moment.";
