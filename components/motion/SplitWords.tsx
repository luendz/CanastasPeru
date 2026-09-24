import { Fragment } from "react";

/**
 * Parte un texto en palabras enmascaradas para que suban una tras otra.
 * Se anima cuando un ancestro tiene `data-inview` (ver Reveal) o, con
 * `immediate`, apenas carga la página.
 */
export default function SplitWords({ text, immediate = false, offset = 0 }: { text: string; immediate?: boolean; offset?: number }) {
  const words = text.split(" ");
  return (
    <span className={`splitWords${immediate ? " splitNow" : ""}`} aria-label={text} role="text">
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span className="splitMask" aria-hidden="true">
            <span className="splitWord" style={{ "--i": i + offset } as React.CSSProperties}>{word}</span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  );
}
