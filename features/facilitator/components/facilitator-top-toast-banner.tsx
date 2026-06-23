"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import {
  showFacilitatorTopToast,
  subscribeFacilitatorTopToast,
} from "@/features/facilitator/facilitator-top-toast";

export function FacilitatorTopToastBanner() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => subscribeFacilitatorTopToast(setMessage), []);

  if (!message) {
    return null;
  }

  return (
    <div className="facilitator-top-toast" role="status" aria-live="polite">
      <CheckCircle2 className="facilitator-top-toast__icon" aria-hidden />
      <span>{message}</span>
    </div>
  );
}

export { showFacilitatorTopToast };
