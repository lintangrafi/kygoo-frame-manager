"use client";

// This script runs before React hydration to prevent flash of wrong theme
export function DarkModeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              var theme = localStorage.getItem('kygoo-ui-storage');
              if (theme) {
                var parsed = JSON.parse(theme);
                if (parsed.state && parsed.state.isDarkMode) {
                  document.documentElement.classList.add('dark');
                }
              }
            } catch (e) {}
          })();
        `,
      }}
    />
  );
}
