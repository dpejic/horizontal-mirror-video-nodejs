import { useState } from "react";
import { MediaRecord } from "./components/MediaRecord";
import { convertKbToMb } from "./utils/helpers";

import "./App.css";
import {
  getFileUrl,
  getPresignedUrl,
  getSseEndpoint,
  uploadToS3,
} from "./services/api/api";
import { SSEEvents } from "./types/SSEEvents";
import { Uploader } from "./utils/helpers/Uploader";

const App = () => {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [uploadingProgress, setUploadingProgress] = useState(0);
  const [initialBlobUrl, setInitialBlobUrl] = useState("");
  const [blobUrl, setBlobUrl] = useState("");
  const [videoProcessing, setVideoProcessing] = useState(false);

  const handleUpload = async (file: File) => {
    let mime;
    const indexOfSeparation = file.type.indexOf(";");
    if (indexOfSeparation === -1) {
      mime = file.type;
    } else {
      mime = file.type.slice(0, file.type.indexOf(";"));
    }
    const mb = convertKbToMb(file.size);

    setInitialBlobUrl(URL.createObjectURL(file));

    if (mb <= 10) {
      const presignedUrlResponse = await getPresignedUrl(mime);

      await uploadToS3(file, presignedUrlResponse.url, setUploadingProgress);

      setVideoProcessing(true);

      const subscribeToName = `${presignedUrlResponse.fileName.replace(
        /\.[^/.]+$/,
        ""
      )}-flipped.mp4`;

      const es = new EventSource(getSseEndpoint(subscribeToName));

      es.onmessage = async (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        if (data.message === SSEEvents.SUCCESS_UPLOAD) {
          await es.close();

          const fileUrl = await getFileUrl(subscribeToName);
          setBlobUrl(fileUrl.url);
          setVideoProcessing(false);
        }
      };
    } else {
      setVideoProcessing(true);

      const uploader = new Uploader({
        file: file,
        onFinish: async (fileName: string) => {
          const subscribeToName = `${fileName.replace(
            /\.[^/.]+$/,
            ""
          )}-flipped.mp4`;

          const es = new EventSource(getSseEndpoint(subscribeToName));

          es.onmessage = async (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            if (data.message === SSEEvents.SUCCESS_UPLOAD) {
              await es.close();

              const fileUrl = await getFileUrl(subscribeToName);
              setBlobUrl(fileUrl.url);
              setVideoProcessing(false);
            }
          };
        },
      });

      let percentage: number | undefined = undefined;

      uploader
        .onProgress(({ percentage: newPercentage }) => {
          if (newPercentage !== percentage) {
            percentage = newPercentage;
          }
        })
        .onError((error) => {
          console.error(error);
        });

      uploader.start();
    }
  };

  const handleOpenCamera = () => {
    setCameraOpen(true);
  };

  const handleCloseCamera = (file: File) => {
    setCameraOpen(false);
    handleUpload(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("video/")) {
        handleUpload(file);
      } else {
        alert("Please select a valid video file");
      }
    }
  };

  return (
    <div className="container">
      <input type="file" accept="video/*" onChange={handleFileChange} />

      <button
        className="camera-button"
        type="button"
        onClick={handleOpenCamera}
      >
        Open camera
      </button>
      {cameraOpen && <MediaRecord onCloseCamera={handleCloseCamera} />}
      {uploadingProgress > 0 && uploadingProgress < 100 && (
        <p>Uploading: {uploadingProgress}%</p>
      )}
      {videoProcessing && <p>Video processing....</p>}

      {initialBlobUrl.length > 0 && (
        <>
          <br />
          <br />
          <p>Initial video:</p>
          <video
            className="video-showcase"
            controls
            src={initialBlobUrl}
          ></video>
        </>
      )}
      <br />
      {blobUrl.length > 0 && (
        <>
          <p>Converted and Horizontal Mirrored Video:</p>
          <video className="video-showcase" controls src={blobUrl}></video>
        </>
      )}
    </div>
  );
};

export default App;
