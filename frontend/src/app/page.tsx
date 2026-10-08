import Link from "next/link";
import { siteConfig } from "@/config/site";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/login"
          className={cn(buttonVariants({ size: "lg" }), "h-10 px-5 font-medium cursor-pointer")}
        >
          Sign In
        </Link>
        <Link
          href="/register"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "h-10 px-5 font-medium cursor-pointer",
          )}
        >
          Student Registration
        </Link>
      </div>
    </main>
  );
}
