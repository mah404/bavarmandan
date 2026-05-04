import { useTheme } from "next-themes";
import { Button } from "../ui/button";
import { Moon, Sun } from "lucide-react";

export const ToggleTheme = () => {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      size="sm"
      variant="ghost"
      className="w-full justify-start rounded-lg border border-primary/20 bg-background/15 px-4 hover:border-primary/45 hover:bg-primary/10 lg:size-11 lg:justify-center lg:p-0"
    >
      <div className="flex gap-2 dark:hidden">
        <Moon className="size-5" />
        <span className="block lg:hidden"> تاریک </span>
      </div>

      <div className="dark:flex gap-2 hidden">
        <Sun className="size-5" />
        <span className="block lg:hidden">روشن</span>
      </div>

      <span className="sr-only">Trocar de tema</span>
    </Button>
  );
};
