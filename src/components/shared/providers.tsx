"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import posthog from "posthog-js";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { ApiClientError } from "@/lib/api-client";
import { env } from "@/lib/env";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: (count, err) => !(err instanceof ApiClientError && err.status < 500) && count < 2,
          },
        },
      }),
  );

  useEffect(() => {
    if (env.posthogKey) posthog.init(env.posthogKey, { api_host: env.posthogHost, person_profiles: "identified_only" });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-center" />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
