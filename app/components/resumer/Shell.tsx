import type { ReactNode } from "react";
import { TopBar } from "./TopBar";
import { Footer } from "./Footer";

type Props = {
  children: ReactNode;
  showFooter?: boolean;
};

export function Shell({ children, showFooter = true }: Props) {
  return (
    <div className="app">
      <TopBar />
      {children}
      {showFooter && <Footer />}
    </div>
  );
}
