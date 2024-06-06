import { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { isMobile } from "react-device-detect";
import { useStopwatch } from "react-timer-hook";
import { useResizeDetector } from "react-resize-detector";

import { Props } from "./MediaRecord.types";
import {
  formatDuration,
  getSupportedMimeTypes,
  randomString,
} from "../../utils/helpers";
import { videoConstraints } from "../../utils/constants";

import "./mediaRecord.css";

const MediaRecord = ({ onCloseCamera }: Props) => {
  const webcamRef = useRef<Webcam>(null);
  const mediaRecorderRef = useRef<MediaRecorder>();
  const [mediaRecordingSupported, setMediaRecordingSupported] = useState(true);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

  const { width, ref } = useResizeDetector({
    handleHeight: false,
    refreshMode: "debounce",
    refreshRate: 50,
  });

  const {
    seconds: sec,
    minutes: min,
    hours: h,
    isRunning,
    start,
    pause,
    reset,
  } = useStopwatch({ autoStart: false });

  const { seconds, minutes } = formatDuration({
    seconds: sec,
    minutes: min,
    hours: h,
  });

  useEffect(() => {
    checkMediaPlayer();
  }, []);

  const handleCloseCamera = (file: File) => {
    onCloseCamera(file);
  };

  const checkMediaPlayer = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
    } catch (err) {
      setMediaRecordingSupported(false);
    }
  };

  const handleRecordingStart = useCallback(() => {
    if (webcamRef.current && webcamRef.current.stream) {
      const supportedVideoMimeType = getSupportedMimeTypes("video");
      start();

      mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream, {
        mimeType: supportedVideoMimeType,
      }) as MediaRecorder;

      mediaRecorderRef.current.addEventListener(
        "dataavailable",
        handleDataAvailable
      );
      mediaRecorderRef.current.start();
    }
  }, [webcamRef.current, mediaRecorderRef]);

  useEffect(() => {
    const convertBlob = async (blob: Blob[]) => {
      const file = new File([blob[0]], randomString(blob[0].type), {
        type: blob[0].type,
      });

      handleCloseCamera(file);
    };

    if (recordedChunks.length > 0) {
      convertBlob(recordedChunks);
    }
  }, [recordedChunks]);

  const handleDataAvailable = ({ data }: { data: Blob }) => {
    if (data.size > 0) {
      setRecordedChunks((prev) => prev.concat(data));
    }
  };

  const handleRecordingStop = useCallback(() => {
    mediaRecorderRef.current?.stop();
    reset();
    pause();
    stop();
  }, [mediaRecorderRef, webcamRef]);

  const handleRecordingStatus = () => {
    if (!isRunning) {
      handleRecordingStart();
    } else {
      handleRecordingStop();
    }
  };

  if (!mediaRecordingSupported) {
    return <div>Media not supported</div>;
  }

  return (
    <div className="container" ref={ref}>
      <div className="webcam-wrapper">
        <Webcam
          audio
          audioConstraints={{
            echoCancellation: true,
          }}
          forceScreenshotSourceSize={isMobile ? true : undefined}
          mirrored={true}
          muted
          ref={webcamRef}
          screenshotQuality={1}
          videoConstraints={videoConstraints}
          style={
            width && width > 1050
              ? {
                  width: "100%",
                }
              : {
                  height: "100%",
                }
          }
        />
        <div className="controls">
          <div className="duration">
            {minutes}:{seconds}
          </div>
          <div
            className={`actions-wrapper${isRunning ? " recording" : ""}`}
            onClick={handleRecordingStatus}
          >
            {isRunning ? (
              <div className="stop"></div>
            ) : (
              <div className="record"></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export { MediaRecord };
