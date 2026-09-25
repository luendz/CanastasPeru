import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s · Panel MKA" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="adm">{children}</div>;
}
