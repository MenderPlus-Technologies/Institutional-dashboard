"use client";

import { forwardRef, useLayoutEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input, type InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<InputProps, "type"> & {
  /** PIN fields stay as plain text and mask with an overlay so the digits can be revealed. */
  variant?: "password" | "pin";
};

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    { className, id, disabled, autoComplete = "new-password", variant = "password", spellCheck, value, style, ...props },
    ref
  ) {
    const [visible, setVisible] = useState(false);
    const innerRef = useRef<HTMLInputElement | null>(null);
    const skipRepaint = useRef(true);
    const isPin = variant === "pin";
    const masked = !visible;
    const text = typeof value === "string" || typeof value === "number" ? String(value) : "";

    const setRef = (node: HTMLInputElement | null) => {
      innerRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    useLayoutEffect(() => {
      if (isPin) return;
      if (skipRepaint.current) {
        skipRepaint.current = false;
        return;
      }
      const input = innerRef.current;
      if (!input) return;
      // Safari can keep password masking after the field switches to text, which
      // leaves a filled value looking blank. Force a repaint of the same value.
      input.style.setProperty("-webkit-text-security", visible ? "none" : "");
      const current = input.value;
      input.value = "";
      input.value = current;
    }, [isPin, visible]);

    return (
      <div className="relative">
        <Input
          id={id}
          type={isPin || visible ? "text" : "password"}
          disabled={disabled}
          autoComplete={autoComplete}
          spellCheck={isPin ? false : spellCheck}
          className={cn("pr-10", isPin && masked && "text-transparent caret-[#0d0d12]", className)}
          style={style}
          value={value}
          {...props}
          ref={setRef}
        />
        {isPin && masked && text.length > 0 && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm text-[#0d0d12]"
          >
            {"•".repeat(text.length)}
          </span>
        )}
        <button
          type="button"
          className="absolute inset-y-0 right-0 z-10 flex w-10 items-center justify-center text-[#9aa1b4] transition-colors duration-150 hover:text-[#009688] focus-visible:outline-none focus-visible:text-[#009688] disabled:pointer-events-none disabled:opacity-50"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
          aria-label={visible ? `Hide ${isPin ? "PIN" : "password"}` : `Show ${isPin ? "PIN" : "password"}`}
          aria-pressed={visible}
          aria-controls={id}
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
    );
  }
);
