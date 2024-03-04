export function RichTextSpan({ text }: { text: string }): JSX.Element {
  const colors = {
    g: "#13a600",
    r: "#d90000",
    y: "#f5dc00",
  };
  const spans: {
    text: string;
    color: string | null;
  }[] = [];
  let buffer = "";
  let color: string | null = null;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "[") {
      if (text[i + 2] === "]") {
        if (buffer) {
          spans.push({ text: buffer, color: null });
          buffer = "";
        }
        color = colors[text[i + 1] as keyof typeof colors];
        i += 2;
        continue;
      } else if (text[i + 1] === "/" && text[i + 3] === "]") {
        spans.push({ text: buffer, color });
        i += 3;
        color = null;
        buffer = "";
        continue;
      }
    }
    buffer += text[i];
  }
  if (buffer) {
    spans.push({ text: buffer, color });
  }
  return (
    <span>
      {spans.map((span, i) => (
        <span key={i} style={{ color: span.color ?? undefined }}>
          {span.text}
        </span>
      ))}
    </span>
  );
}
