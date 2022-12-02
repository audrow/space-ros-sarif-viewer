import { router } from "../trpc";
import { sarifRouter } from "./sarif";

export const appRouter = router({
  sarif: sarifRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
