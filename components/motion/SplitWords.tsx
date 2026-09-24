import { Fragment } from "react";

/**
 * Parte un título en palabras enmascaradas para que suban una tras otra.
 * Las palabras entre asteriscos (`*llenos*`) se muestran en cursiva, como
 * los acentos del diseño. Se anima cuando un ancestro tiene `data-inview`
 * (ver Reveal) o, con `immediate`, apenas carga la página.
 */
export default function SplitWords({ text, immediate = false, offset = 0 }: { text: string; immediate?: boolean; offset?: number }) {
  const plain = text.replace(/\*/g, "");
  let emphasis = false;
  const words = text.split(" ").map((raw) => {
    const starts = raw.startsWith("*");
    if (starts) emphasis = true;
    const word = { value: raw.replace(/\*/g, ""), em: emphasis };
    if (raw.endsWith("*") || raw.replace(/[^*]/g, "").length === 2) emphasis = false;
    return word;
  });

  return (
    <span className={`splitWords${immediate ? " splitNow" : ""}`} aria-label={plain} role="text">
      {words.map((word, i) => (
        <Fragment key={`${word.value}-${i}`}>
          <span className="splitMask" aria-hidden="true">
            <span className="splitWord" style={{ "--i": i + offset } as React.CSSProperties}>
              {word.em ? <em>{word.value}</em> : word.value}
            </span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  );
}
