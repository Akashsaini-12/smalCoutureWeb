import React, { useEffect, useRef, useState } from "react";

export default function MSelect({ options = [], defaultValue = "0", name = "collection", onChange }) {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(defaultValue);
    const rootRef = useRef(null);

    const safeOptions = Array.isArray(options) ? options : [];
    const selected =
      safeOptions.find((o) => String(o.value) === String(value)) || safeOptions[0];
  
    useEffect(() => {
      const onDocClick = (e) => {
        if (!rootRef.current) return;
        if (!rootRef.current.contains(e.target)) setOpen(false);
      };
      document.addEventListener("click", onDocClick);
      return () => document.removeEventListener("click", onDocClick);
    }, []);
  
    return (
      <div
        ref={rootRef}
        style={{ position: "relative" }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* Keep a real select for accessibility/forms, but visually hidden */}
        <select
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: "hidden",
            clip: "rect(0, 0, 0, 0)",
            whiteSpace: "nowrap",
            border: 0,
          }}
          aria-hidden="true"
          tabIndex={-1}
        >
          {safeOptions.map((o) => (
            <option key={String(o.value)} value={String(o.value)}>
              {o.label}
            </option>
          ))}
        </select>
  
        <div
          className={`m-select-custom m-select-custom--custom-width m-select-custom--plain js-selectCustom h3 ${
            open ? "isActive" : ""
          }`}
          style={{ zIndex: 50 }}
        >
          <div
            className="m-select-custom--trigger"
            role="button"
            tabIndex={0}
            aria-haspopup="listbox"
            aria-expanded={open ? "true" : "false"}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen((v) => !v);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setOpen((v) => !v);
              if (e.key === "Escape") setOpen(false);
            }}
          >
            <span className="m-select-custom--trigger-text">
              {selected?.label}
            </span>
            <span className="m-select-custom--trigger-icon" aria-hidden="true">
              <svg
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 448 512"
              >
                <path d="M441.9 167.3l-19.8-19.8c-4.7-4.7-12.3-4.7-17 0L224 328.2 42.9 147.5c-4.7-4.7-12.3-4.7-17 0L6.1 167.3c-4.7 4.7-4.7 12.3 0 17l209.4 209.4c4.7 4.7 12.3 4.7 17 0l209.4-209.4c4.7-4.7 4.7-12.3 0-17z" />
              </svg>
            </span>
          </div>
  
          <div
            className="m-select-custom--options"
            role="listbox"
            style={{
              display: open ? "block" : "none",
              visibility: open ? "visible" : "hidden",
              opacity: open ? 1 : 0,
              position: "absolute",
              top: "100%",
              left: 0,
              minWidth: "100%",
              marginTop: 4,
              background: "#fff",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              border: "1px solid rgba(0,0,0,0.1)",
              borderRadius: 4,
              zIndex: 60,
              maxHeight: 280,
              overflowY: "auto",
              pointerEvents: open ? "auto" : "none",
            }}
          >
            {safeOptions.map((o) => {
              const isSelected = String(o.value) === String(value);
              return (
                <div
                  key={String(o.value)}
                  className={`m-select-custom--option ${
                    isSelected ? "isActive" : ""
                  }`}
                  data-value={o.value}
                  role="option"
                  aria-selected={isSelected ? "true" : "false"}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const v = String(o.value);
                    setValue(v);
                    setOpen(false);
                    if (onChange) onChange(v);
                  }}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                  }}
                >
                  {o.label}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
  