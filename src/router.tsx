import { createRouter } from "@tanstack/react-router";
import { queryClient } from "@/lib/queryClient";
import { routeTree } from "./routeTree.gen";
import type { AuthContextValue } from "@/store/auth";

export interface RouterContext {
  queryClient: typeof queryClient;
  auth: AuthContextValue;
}

export const getRouter = () => {
  return createRouter({
    routeTree,
    context: { queryClient, auth: undefined! },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });
};
