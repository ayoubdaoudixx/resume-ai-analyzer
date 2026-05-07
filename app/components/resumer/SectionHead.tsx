import type { ReactNode } from "react";

type Props = {
  numeral: string;
  eyebrow: string;
  title: ReactNode;
  sub?: ReactNode;
};

export function SectionHead({ numeral, eyebrow, title, sub }: Props) {
  return (
    <div className="section-head">
      <div className="section-num">
        {eyebrow}
        <span className="roman">{numeral}</span>
      </div>
      <div>
        <h2 className="section-title">{title}</h2>
        {sub && <p className="section-sub">{sub}</p>}
      </div>
    </div>
  );
}
