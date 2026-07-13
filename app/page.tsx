import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/wordmark";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-spacing-screen-x">
      <Wordmark />
      <ThemeToggle />
    </main>
  );
}
