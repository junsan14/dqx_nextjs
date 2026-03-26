"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { FaImage } from "react-icons/fa6";
import { getCroppedImageBlob } from "@/lib/cropImage";

const EXISTING_IMAGE_CROP = { x: 0, y: 0 };
const NEW_IMAGE_CROP = { x: 150, y: 37 };

const EXISTING_IMAGE_ZOOM = 1;
const NEW_IMAGE_ZOOM = 3.22;

const RESET_EDIT_CROP = { x: 0, y: 0 };
const RESET_EDIT_ZOOM = 1;

const DEFAULT_FILE_NAME = "monster.png";
const CROPPER_SIZE = 320;

export default function MonsterImageCropper({
  value = "",
  onApply,
  aspect = 1,
  disabled = false,
  title = "モンスター画像",
}) {
  const hasInitialValue = Boolean(value);

  const [originalImageUrl, setOriginalImageUrl] = useState(value || "");
  const [previewImageUrl, setPreviewImageUrl] = useState(value || "");
  const [sourceFileName, setSourceFileName] = useState(DEFAULT_FILE_NAME);

  const [crop, setCrop] = useState(
    hasInitialValue ? EXISTING_IMAGE_CROP : NEW_IMAGE_CROP
  );
  const [zoom, setZoom] = useState(
    hasInitialValue ? EXISTING_IMAGE_ZOOM : NEW_IMAGE_ZOOM
  );
  const [, setCroppedAreaPixels] = useState(null);

  const [draftCrop, setDraftCrop] = useState(RESET_EDIT_CROP);
  const [draftZoom, setDraftZoom] = useState(RESET_EDIT_ZOOM);
  const [draftCroppedAreaPixels, setDraftCroppedAreaPixels] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cropperKey, setCropperKey] = useState(0);

  const originalObjectUrlRef = useRef(null);
  const previewObjectUrlRef = useRef(null);
  const prepareTimerRef = useRef(null);
  const autoPreparedRef = useRef(false);

  const activeImageUrl = isEditing ? originalImageUrl : previewImageUrl;
  const hasImage = useMemo(() => Boolean(activeImageUrl), [activeImageUrl]);

  const revokeOriginalObjectUrl = useCallback(() => {
    if (originalObjectUrlRef.current) {
      URL.revokeObjectURL(originalObjectUrlRef.current);
      originalObjectUrlRef.current = null;
    }
  }, []);

  const revokePreviewObjectUrl = useCallback(() => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
  }, []);

  const clearPrepareTimer = useCallback(() => {
    if (prepareTimerRef.current) {
      clearTimeout(prepareTimerRef.current);
      prepareTimerRef.current = null;
    }
  }, []);

  const buildOutputFileName = useCallback((fileName) => {
    return (fileName || DEFAULT_FILE_NAME).replace(
      /\.(jpg|jpeg|png|webp)$/i,
      ".png"
    );
  }, []);

  const prepareCroppedImage = useCallback(
    async ({
      targetSourceUrl,
      targetAreaPixels,
      targetFileName,
      nextCrop,
      nextZoom,
    }) => {
      if (
        disabled ||
        !targetSourceUrl ||
        !targetAreaPixels ||
        !onApply
      ) {
        return;
      }

      setIsProcessing(true);

      try {
        const { file, previewUrl } = await getCroppedImageBlob(
          targetSourceUrl,
          targetAreaPixels,
          buildOutputFileName(targetFileName)
        );

        revokePreviewObjectUrl();
        previewObjectUrlRef.current = previewUrl;

        setPreviewImageUrl(previewUrl);
        setCrop(nextCrop);
        setZoom(nextZoom);
        setCroppedAreaPixels(targetAreaPixels);
        setCropperKey((prev) => prev + 1);

        onApply({
          file,
          previewUrl,
          crop: nextCrop,
          zoom: nextZoom,
          croppedAreaPixels: targetAreaPixels,
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [buildOutputFileName, disabled, onApply, revokePreviewObjectUrl]
  );

  const syncInitialState = useCallback(
    (nextUrl, nextFileName, hasExistingImage) => {
      const initialCrop = hasExistingImage
        ? EXISTING_IMAGE_CROP
        : NEW_IMAGE_CROP;
      const initialZoom = hasExistingImage
        ? EXISTING_IMAGE_ZOOM
        : NEW_IMAGE_ZOOM;

      clearPrepareTimer();
      autoPreparedRef.current = false;

      setOriginalImageUrl(nextUrl || "");
      setPreviewImageUrl(nextUrl || "");
      setSourceFileName(nextFileName || DEFAULT_FILE_NAME);

      setCrop(initialCrop);
      setZoom(initialZoom);
      setCroppedAreaPixels(null);

      setDraftCrop(RESET_EDIT_CROP);
      setDraftZoom(RESET_EDIT_ZOOM);
      setDraftCroppedAreaPixels(null);

      setIsEditing(false);
      setCropperKey((prev) => prev + 1);
    },
    [clearPrepareTimer]
  );

  useEffect(() => {
    const nextValue = value || "";
    const isBlobValue =
      typeof nextValue === "string" && nextValue.startsWith("blob:");
    const hasLocalUpload = Boolean(originalObjectUrlRef.current);

    // 親から返ってくる一時 preview blob では子を再初期化しない
    if (hasLocalUpload && isBlobValue) {
      return;
    }

    syncInitialState(nextValue, DEFAULT_FILE_NAME, Boolean(nextValue));
  }, [value, syncInitialState]);

  useEffect(() => {
    return () => {
      clearPrepareTimer();
      revokeOriginalObjectUrl();
      revokePreviewObjectUrl();
    };
  }, [
    clearPrepareTimer,
    revokeOriginalObjectUrl,
    revokePreviewObjectUrl,
  ]);

  const scheduleAutoPrepare = useCallback(
    (nextSourceUrl, nextFileName, nextCrop, nextZoom, nextPixels) => {
      clearPrepareTimer();

      if (!nextSourceUrl || !nextPixels) return;

      prepareTimerRef.current = setTimeout(() => {
        prepareCroppedImage({
          targetSourceUrl: nextSourceUrl,
          targetAreaPixels: nextPixels,
          targetFileName: nextFileName,
          nextCrop,
          nextZoom,
        });
      }, 0);
    },
    [clearPrepareTimer, prepareCroppedImage]
  );

  const handleFileChange = useCallback(
    (e) => {
      if (disabled) return;

      const file = e.target.files?.[0];
      if (!file) return;

      clearPrepareTimer();
      revokeOriginalObjectUrl();
      revokePreviewObjectUrl();

      const nextUrl = URL.createObjectURL(file);
      originalObjectUrlRef.current = nextUrl;
      autoPreparedRef.current = false;

      setOriginalImageUrl(nextUrl);
      setPreviewImageUrl(nextUrl);
      setSourceFileName(file.name || DEFAULT_FILE_NAME);

      setCrop(NEW_IMAGE_CROP);
      setZoom(NEW_IMAGE_ZOOM);
      setCroppedAreaPixels(null);

      setDraftCrop(RESET_EDIT_CROP);
      setDraftZoom(RESET_EDIT_ZOOM);
      setDraftCroppedAreaPixels(null);

      setIsEditing(false);
      setCropperKey((prev) => prev + 1);

      e.target.value = "";
    },
    [
      clearPrepareTimer,
      disabled,
      revokeOriginalObjectUrl,
      revokePreviewObjectUrl,
    ]
  );

  const handleCropComplete = useCallback(
    (_croppedArea, croppedPixels) => {
      if (isEditing) {
        setDraftCroppedAreaPixels(croppedPixels);
        return;
      }

      setCroppedAreaPixels(croppedPixels);

      const isLocalOriginal =
        Boolean(originalObjectUrlRef.current) &&
        originalImageUrl === originalObjectUrlRef.current;

      // ローカル画像の自動切り出しは1回だけ
      if (
        isLocalOriginal &&
        croppedPixels &&
        !autoPreparedRef.current
      ) {
        autoPreparedRef.current = true;

        scheduleAutoPrepare(
          originalImageUrl,
          sourceFileName,
          crop,
          zoom,
          croppedPixels
        );
      }
    },
    [
      crop,
      isEditing,
      originalImageUrl,
      scheduleAutoPrepare,
      sourceFileName,
      zoom,
    ]
  );

  const handleStartEdit = useCallback(() => {
    if (disabled || !originalImageUrl) return;

    // 再編集中は自動切り出しループを止める
    autoPreparedRef.current = true;

    const isUploadedLocalImage =
      Boolean(originalObjectUrlRef.current) &&
      originalImageUrl === originalObjectUrlRef.current;

    setDraftCrop(isUploadedLocalImage ? RESET_EDIT_CROP : EXISTING_IMAGE_CROP);
    setDraftZoom(isUploadedLocalImage ? RESET_EDIT_ZOOM : EXISTING_IMAGE_ZOOM);
    setDraftCroppedAreaPixels(null);
    setIsEditing(true);
    setCropperKey((prev) => prev + 1);
  }, [disabled, originalImageUrl]);

  const handleCancelEdit = useCallback(() => {
    setDraftCrop(RESET_EDIT_CROP);
    setDraftZoom(RESET_EDIT_ZOOM);
    setDraftCroppedAreaPixels(null);
    setIsEditing(false);
    setCropperKey((prev) => prev + 1);
  }, []);

  const handleConfirmEdit = useCallback(async () => {
    if (!originalImageUrl || !draftCroppedAreaPixels) return;

    await prepareCroppedImage({
      targetSourceUrl: originalImageUrl,
      targetAreaPixels: draftCroppedAreaPixels,
      targetFileName: sourceFileName,
      nextCrop: draftCrop,
      nextZoom: draftZoom,
    });

    setIsEditing(false);
    setCropperKey((prev) => prev + 1);
  }, [
    draftCrop,
    draftCroppedAreaPixels,
    draftZoom,
    originalImageUrl,
    prepareCroppedImage,
    sourceFileName,
  ]);

  return (
    <div style={wrapperStyle}>
      <div style={headerStyle}>
        <div style={titleStyle}>{title}</div>
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
          {hasImage ? sourceFileName : "画像未選択"}
        </div>
      </div>

      {hasImage ? (
        <>
          <div style={cropContainerOuterStyle}>
            <div style={cropContainerStyle}>
              <Cropper
                key={`${cropperKey}-${activeImageUrl}-${isEditing ? "editing" : "preview"}`}
                image={activeImageUrl}
                crop={isEditing ? draftCrop : crop}
                zoom={isEditing ? draftZoom : zoom}
                minZoom={1}
                maxZoom={4}
                aspect={aspect}
                cropSize={{ width: CROPPER_SIZE, height: CROPPER_SIZE }}
                onCropChange={isEditing ? setDraftCrop : () => {}}
                onZoomChange={isEditing ? setDraftZoom : () => {}}
                onCropComplete={handleCropComplete}
                objectFit="contain"
                restrictPosition={false}
                zoomWithScroll={isEditing}
                showGrid={isEditing}
                style={{
                  containerStyle: {
                    cursor: isEditing ? "move" : "default",
                    touchAction: isEditing ? "none" : "auto",
                  },
                }}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div style={statusRowStyle}>
            <span style={statusBadgeStyle}>
              {isEditing ? "修正モード" : "保存範囲プレビュー"}
            </span>
            <span style={zoomValueStyle}>
              {(isEditing ? draftZoom : zoom).toFixed(2)}x
            </span>
          </div>

          {isEditing ? (
            <>
              <div style={sliderRowStyle}>
                <label style={labelStyle}>ズーム</label>
                <input
                  type="range"
                  min={1}
                  max={4}
                  step={0.01}
                  value={draftZoom}
                  disabled={disabled || isProcessing}
                  onChange={(e) => setDraftZoom(Number(e.target.value))}
                  style={sliderStyle}
                />
                <span style={zoomValueStyle}>{draftZoom.toFixed(2)}x</span>
              </div>

              <div style={buttonRowStyle}>
                <button
                  type="button"
                  onClick={handleConfirmEdit}
                  disabled={disabled || isProcessing || !draftCroppedAreaPixels}
                  style={{
                    ...secondaryButtonStyle,
                    ...(disabled || isProcessing || !draftCroppedAreaPixels
                      ? buttonDisabledStyle
                      : {}),
                  }}
                >
                  {isProcessing ? "保存用を更新中..." : "この範囲で決定"}
                </button>

                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={disabled || isProcessing}
                  style={{
                    ...ghostButtonStyle,
                    ...(disabled || isProcessing ? buttonDisabledStyle : {}),
                  }}
                >
                  キャンセル
                </button>
              </div>
            </>
          ) : (
            <div style={helperTextStyle}>
              画像をアップロードした時点で、今見えている範囲そのままで保存用データを作成する。範囲を直したい時だけ「切り取り範囲を再選択」を押して「この範囲で決定」を押す。
            </div>
          )}

          {!isEditing && (
            <div style={buttonRowStyle}>
              <button
                type="button"
                onClick={handleStartEdit}
                disabled={disabled || isProcessing}
                style={{
                  ...secondaryButtonStyle,
                  ...(disabled || isProcessing ? buttonDisabledStyle : {}),
                }}
              >
                切り取り範囲を再選択
              </button>
            </div>
          )}
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
  border: "1px solid var(--panel-border)",
  borderRadius: 16,
  background: "var(--panel-bg)",
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
  color: "var(--text-title)",
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
  border: "1px solid var(--input-border)",
  background: "var(--input-bg)",
  color: "var(--input-text)",
  fontWeight: 600,
  cursor: "pointer",
  userSelect: "none",
  transition: "all 0.2s ease",
};

const fileButtonDisabledStyle = {
  opacity: 0.6,
  cursor: "not-allowed",
  background: "var(--input-disabled-bg)",
};

const fileNameStyle = {
  minHeight: 20,
  padding: "8px 12px",
  borderRadius: 10,
  background: "var(--soft-bg)",
  border: "1px solid var(--card-border)",
  color: "var(--text-muted)",
  fontSize: 13,
};

const cropContainerOuterStyle = {
  display: "flex",
  justifyContent: "center",
};

const cropContainerStyle = {
  position: "relative",
  width: CROPPER_SIZE,
  height: CROPPER_SIZE,
  background: "var(--soft-bg)",
  borderRadius: 16,
  overflow: "hidden",
  border: "1px solid var(--card-border)",
  flex: "0 0 auto",
};

const statusRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

const statusBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: 9999,
  border: "1px solid var(--soft-border)",
  background: "var(--soft-bg)",
  color: "var(--text-sub)",
  fontSize: 12,
  fontWeight: 700,
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
  color: "var(--text-sub)",
};

const sliderStyle = {
  width: "100%",
  accentColor: "var(--primary-bg)",
};

const zoomValueStyle = {
  minWidth: 48,
  textAlign: "right",
  fontSize: 13,
  color: "var(--text-muted)",
};

const helperTextStyle = {
  fontSize: 13,
  lineHeight: 1.6,
  color: "var(--text-muted)",
};

const buttonRowStyle = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const secondaryButtonStyle = {
  border: "1px solid var(--secondary-border)",
  borderRadius: 12,
  padding: "12px 16px",
  background: "var(--secondary-bg)",
  color: "var(--secondary-text)",
  cursor: "pointer",
  fontWeight: 700,
};

const ghostButtonStyle = {
  border: "1px solid var(--ghost-border)",
  borderRadius: 12,
  padding: "12px 16px",
  background: "var(--ghost-bg)",
  color: "var(--text-sub)",
  cursor: "pointer",
  fontWeight: 700,
};

const buttonDisabledStyle = {
  opacity: 0.7,
  cursor: "not-allowed",
};

const emptyStyle = {
  border: "1px dashed var(--soft-border)",
  borderRadius: 16,
  padding: 32,
  color: "var(--text-muted)",
  background: "var(--soft-bg)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
  textAlign: "center",
};