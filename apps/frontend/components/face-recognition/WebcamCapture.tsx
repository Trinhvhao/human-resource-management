'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { Camera, RefreshCw, FlipHorizontal } from 'lucide-react';

interface WebcamCaptureProps {
  onCapture: (imageBase64: string) => void;
  isProcessing?: boolean;
  width?: number;
  height?: number;
  buttonText?: string;
  buttonIcon?: 'camera' | 'check-in';
  showPreview?: boolean;
}

export default function WebcamCapture({
  onCapture,
  isProcessing = false,
  width = 640,
  height = 480,
  buttonText = 'Chụp ảnh',
  showPreview = true,
}: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isMirrored, setIsMirrored] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setCapturedImage(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: width },
          height: { ideal: height },
          facingMode: 'user',
        },
        audio: false,
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true);
        };
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError(
          'Bạn cần cho phép truy cập camera. Vui lòng kiểm tra cài đặt trình duyệt.',
        );
      } else if (err.name === 'NotFoundError') {
        setError(
          'Không tìm thấy camera. Vui lòng kết nối webcam và thử lại.',
        );
      } else {
        setError(`Lỗi mở camera: ${err.message}`);
      }
    }
  }, [width, height]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setCameraReady(false);
    }
  }, [stream]);

  useEffect(() => {
    startCamera();
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mirror the image if needed
    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0);

    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const base64 = canvas.toDataURL('image/jpeg', 0.8);
    // Only show preview if requested; for live check-in we stay in live camera mode
    if (showPreview) {
      setCapturedImage(base64);
    }
    onCapture(base64);
  }, [isMirrored, onCapture]);

  const retake = useCallback(() => {
    setCapturedImage(null);
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-red-300 bg-red-50 p-8">
        <Camera className="mb-3 h-12 w-12 text-red-400" />
        <p className="mb-4 text-center text-sm text-red-600">{error}</p>
        <button
          onClick={startCamera}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Video / Preview area */}
      <div className="relative overflow-hidden rounded-xl border-2 border-gray-200 bg-black">
        {/* Live video feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`${capturedImage && showPreview ? 'hidden' : 'block'}`}
          style={{
            width,
            height,
            maxWidth: '100%',
            transform: isMirrored ? 'scaleX(-1)' : 'none',
          }}
        />

        {/* Captured preview */}
        {capturedImage && showPreview && (
          <img
            src={capturedImage}
            alt="Captured"
            style={{ width, height, maxWidth: '100%', objectFit: 'cover' }}
          />
        )}

        {/* Face guide overlay */}
        {!capturedImage && cameraReady && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className={`h-56 w-44 rounded-full border-2 border-dashed ${isProcessing ? 'border-blue-400 animate-pulse' : 'border-white/60'}`} />
          </div>
        )}

        {/* Scanning animation overlay */}
        {isProcessing && !capturedImage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[1px]">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent mb-3" />
            <p className="text-sm font-semibold text-white drop-shadow">Đang quét khuôn mặt...</p>
          </div>
        )}

        {/* Loading / not ready */}
        {!cameraReady && !error && (
          <div
            className="flex items-center justify-center bg-gray-900"
            style={{ width, height, maxWidth: '100%' }}
          >
            <div className="text-center text-white">
              <RefreshCw className="mx-auto mb-2 h-8 w-8 animate-spin" />
              <p className="text-sm">Đang mở camera...</p>
            </div>
          </div>
        )}
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Controls */}
      <div className="flex gap-3">
        {!capturedImage ? (
          <>
            <button
              onClick={capturePhoto}
              disabled={!cameraReady || isProcessing}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Camera className="h-5 w-5" />
                  {buttonText}
                </>
              )}
            </button>

            <button
              onClick={() => setIsMirrored(!isMirrored)}
              className="rounded-lg border border-gray-300 p-3 text-gray-600 transition-colors hover:bg-gray-50"
              title="Lật camera"
            >
              <FlipHorizontal className="h-5 w-5" />
            </button>
          </>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={retake}
              disabled={isProcessing}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className="h-5 w-5" />
              Chụp lại
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
