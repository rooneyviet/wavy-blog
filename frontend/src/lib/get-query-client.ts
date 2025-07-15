import { QueryClient } from "@tanstack/react-query";
import { cache } from "react";

// cache() is scoped per request, so we don't need to worry about sharing
// queryClient between requests.
const getQueryClient = cache(() => new QueryClient());
export default getQueryClient;
