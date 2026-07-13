import { themeBootstrapScript } from "@/lib/theme/theme-bootstrap";

export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: themeBootstrapScript,
      }}
    />
  );
}
