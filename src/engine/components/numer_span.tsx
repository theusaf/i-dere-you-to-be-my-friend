import { ReactNode } from "react";

export function NumberSpan({ children }: { children?: ReactNode }) {
  return <span className="font-numerals">{children}</span>;
}
