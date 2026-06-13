"use client";

/** Capture a DOM element as a PNG download (client-only). */
export async function exportElementAsPng(
  element: HTMLElement,
  filename: string,
): Promise<void> {
  const html2canvas = (await import("html2canvas")).default;
  const canvas = await html2canvas(element, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,
  });

  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
