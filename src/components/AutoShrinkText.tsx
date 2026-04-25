import { useLayoutEffect, useRef, useState } from 'react';

interface AutoShrinkTextProps {
  text: string;
  maxSize: number;
  minSize?: number;
  className?: string;
  title?: string;
}

export function AutoShrinkText({
  text,
  maxSize,
  minSize = 10,
  className = '',
  title,
}: AutoShrinkTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState(maxSize);
  const [truncate, setTruncate] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reset to max before measuring
    el.style.fontSize = `${maxSize}px`;
    el.style.overflow = '';
    el.style.textOverflow = '';

    let size = maxSize;
    while (size > minSize && el.scrollWidth > el.clientWidth) {
      size--;
      el.style.fontSize = `${size}px`;
    }

    const needsTruncate = el.scrollWidth > el.clientWidth;
    setFontSize(size);
    setTruncate(needsTruncate);
  }, [text, maxSize, minSize]);

  return (
    <span
      ref={ref}
      className={`block min-w-0 ${truncate ? 'truncate' : 'whitespace-nowrap overflow-hidden'} ${className}`}
      style={{ fontSize: `${fontSize}px` }}
      title={title ?? text}
    >
      {text}
    </span>
  );
}
