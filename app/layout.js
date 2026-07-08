import "./globals.css";

export const metadata = {
  title: "GrowEasy AI CSV Importer",
  description: "Upload, preview, and intelligently map CSV leads into GrowEasy CRM format."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
