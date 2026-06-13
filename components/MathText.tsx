"use client";

import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";

interface Props {
  text: string;
}

export default function MathText({ text }: Props) {
  // Split text by $$ (block) then $ (inline) delimiters
  const parts: React.ReactNode[] = [];
  const blockRegex = /\$\$([\s\S]+?)\$\$/g;
  const inlineRegex = /\$([^$]+?)\$/g;

  let lastIndex = 0;
  let blockMatch: RegExpExecArray | null;

  while ((blockMatch = blockRegex.exec(text)) !== null) {
    const before = text.slice(lastIndex, blockMatch.index);
    if (before) parts.push(<span key={`t-${lastIndex}`}>{renderInline(before)}</span>);
    parts.push(<BlockMath key={`bm-${blockMatch.index}`} math={blockMatch[1]} />);
    lastIndex = blockMatch.index + blockMatch[0].length;
  }

  const remaining = text.slice(lastIndex);
  if (remaining) parts.push(<span key={`t-${lastIndex}`}>{renderInline(remaining)}</span>);

  return <span>{parts}</span>;

  function renderInline(str: string): React.ReactNode[] {
    const result: React.ReactNode[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    inlineRegex.lastIndex = 0;
    while ((m = inlineRegex.exec(str)) !== null) {
      if (m.index > last) result.push(str.slice(last, m.index));
      result.push(<InlineMath key={`im-${m.index}`} math={m[1]} />);
      last = m.index + m[0].length;
    }
    if (last < str.length) result.push(str.slice(last));
    return result;
  }
}
