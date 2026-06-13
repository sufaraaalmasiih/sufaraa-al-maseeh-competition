"use client";

import { memo } from "react";

function ArenaWatermarkInner() {
  return (
    <div
      aria-hidden
      className="arena-watermark"
      style={{
        background:
          "radial-gradient(circle at 50% 50%, rgba(35,136,196,0.06) 0%, transparent 70%)",
      }}
    />
  );
}

export const ArenaWatermark = memo(ArenaWatermarkInner);
