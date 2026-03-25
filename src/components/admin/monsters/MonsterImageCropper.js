"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Cropper from "react-easy-crop";
import { FaImage } from "react-icons/fa6";
import { getCroppedImageBlob } from "@/lib/cropImage";

export default function MonsterImageCropper({
  value = "",
  onApply,
  aspect = 1,
  disabled = false,
  title = "モンスター画像",
}) {
  const [sourceUrl, setSourceUrl] = useState(value || "");
  const [sourceFileName, setSourceFileName] = useState("monster.png");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setSourceUrl(value || "");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }, [value]);

  const hasImage = useMemo(() => Boolean(sourceUrl), [sourceUrl]);

  const handleFileChange = useCallback(
    (e) => {
      if (disabled) return;

      const file = e.target.files?.[0];
      if (!file) return;

      const nextUrl = URL.createObjectURL(file);
      setSourceUrl(nextUrl);
      setSourceFileName(file.name || "monster.png");
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    },
    [disabled]
  );

  const handleCropComplete = useCallback((_croppedArea, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleApply = useCallback(async () => {
    if (disabled || !sourceUrl || !croppedAreaPixels) return;

    setIsProcessing(true);

    try {
      const { file, previewUrl } = await getCroppedImageBlob(
        sourceUrl,
        croppedAreaPixels,
        sourceFileName.replace(/\.(jpg|jpeg|png|webp)$/i, ".png")
      );

      onApply?.({
        file,
        previewUrl,
      });
    } finally {
      setIsProcessing(false);
    }
  }, [croppedAreaPixels, disabled, onApply, sourceFileName, sourceUrl]);

  return (
    <div style={wrapperStyle}>
      <div style={headerStyle}>
        <div>
          <div style={titleStyle}>{title}</div>
        </div>
      </div>

      <div style={controlsStyle}>
        <label
          htmlFor="monster-image-input"
          style={{
            ...fileButtonStyle,
            ...(disabled ? fileButtonDisabledStyle : {}),
          }}
        >
          <FaImage size={18} />
          <span>{hasImage ? "画像を変更" : "画像を選択"}</span>
        </label>

        <input
          id="monster-image-input"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={disabled}
          style={hiddenInputStyle}
        />

        <div style={fileNameStyle}>
          {sourceFileName || "画像未選択"}
        </div>
      </div>

      {hasImage ? (
        <>
          <div style={cropContainerStyle}>
            <Cropper
              image={sourceUrl}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
              objectFit="contain"
            />
          </div>

          <div style={sliderRowStyle}>
            <label style={labelStyle}>ズーム</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              disabled={disabled}
              onChange={(e) => setZoom(Number(e.target.value))}
              style={sliderStyle}
            />
            <span style={zoomValueStyle}>{zoom.toFixed(2)}x</span>
          </div>

          <button
            type="button"
            onClick={handleApply}
            disabled={disabled || isProcessing}
            style={{
              ...buttonStyle,
              ...(disabled || isProcessing ? buttonDisabledStyle : {}),
            }}
          >
            {isProcessing ? "切り出し中..." : "この範囲で決定"}
          </button>
        </>
      ) : (
        <div style={emptyStyle}>
          <FaImage size={28} style={{ opacity: 0.7 }} />
         
        </div>
      )}
    </div>
  );
}

const wrapperStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
  padding: 16,
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  background: "#fff",
  boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const titleStyle = {
  fontSize: 18,
  fontWeight: 700,
  color: "#111827",
};



const controlsStyle = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
};

const hiddenInputStyle = {
  display: "none",
};

const fileButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #d1d5db",
  background: "linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)",
  color: "#111827",
  fontWeight: 600,
  cursor: "pointer",
  userSelect: "none",
  transition: "all 0.2s ease",
};

const fileButtonDisabledStyle = {
  opacity: 0.6,
  cursor: "not-allowed",
};

const fileNameStyle = {
  minHeight: 20,
  padding: "8px 12px",
  borderRadius: 10,
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  color: "#4b5563",
  fontSize: 13,
};

const cropContainerStyle = {
  position: "relative",
  width: "100%",
  height: 420,
  background: "#111",
  borderRadius: 16,
  overflow: "hidden",
  border: "1px solid #e5e7eb",
};

const sliderRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const labelStyle = {
  minWidth: 60,
  fontSize: 14,
  fontWeight: 600,
  color: "#374151",
};

const sliderStyle = {
  width: "100%",
};

const zoomValueStyle = {
  minWidth: 48,
  textAlign: "right",
  fontSize: 13,
  color: "#6b7280",
};

const buttonStyle = {
  border: "1px solid #111827",
  borderRadius: 12,
  padding: "12px 16px",
  background: "#111827",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 700,
};

const buttonDisabledStyle = {
  opacity: 0.7,
  cursor: "not-allowed",
};

const emptyStyle = {
  border: "1px dashed #cbd5e1",
  borderRadius: 16,
  padding: 32,
  color: "#64748b",
  background: "#f8fafc",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
  textAlign: "center",
};