import { Fragment } from "react";

/** Muestra un texto donde las partes entre asteriscos (*así*) van en cursiva destacada. */
export default function Enfasis({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*[^*]+\*)/g).map((parte, i) =>
        parte.startsWith("*") && parte.endsWith("*") && parte.length > 2
          ? <em key={i}>{parte.slice(1, -1)}</em>
          : <Fragment key={i}>{parte}</Fragment>,
      )}
    </>
  );
}
