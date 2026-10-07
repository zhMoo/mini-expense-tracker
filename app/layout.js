import "./globals.css";
import SessionProviderWrapper from "../components/SessionProviderWrapper.jsx";

export const metadata = {
  title: "Mini Expense Tracker",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
      </body>
    </html>
  );
}
