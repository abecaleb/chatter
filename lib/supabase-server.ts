import { cookies } from "next/headers";
import { createRouteHandlerClient, createServerComponentClient } from "@supabase/auth-helpers-nextjs";

export const createServerSupabase = () => createServerComponentClient({ cookies });
export const createRouteSupabase = () => createRouteHandlerClient({ cookies });
