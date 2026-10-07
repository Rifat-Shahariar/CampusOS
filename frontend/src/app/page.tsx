import { siteConfig } from "@/config/site";

/**
 * Application shell for the root route.
 * Product screens live under their feature directories and are added later.
 */
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl 3xl:text-6xl">
        {siteConfig.name}
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground sm:max-w-lg sm:text-base">
        {siteConfig.description}
      </p>
    </main>
  );
}
