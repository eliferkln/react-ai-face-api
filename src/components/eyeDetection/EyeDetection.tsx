import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

const EyeDetection: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [videoWidth, setVideoWidth] = useState<number>(0);
  const [videoHeight, setVideoHeight] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [detections, setDetections] = useState<
    faceapi.WithFaceLandmarks<faceapi.WithFaceDetection<{}>>[]
  >([]);

  useEffect(() => {
    const loadModels = async () => {
      await faceapi.loadFaceDetectionModel("/models");
      await faceapi.loadFaceLandmarkModel("/models");
      setIsLoaded(true);
    };
    loadModels();
  }, []);
  useEffect(() => {
    const video = videoRef.current!;
    const canvas = canvasRef.current!;
    let interval: NodeJS.Timeout;

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        video.srcObject = stream;
        video.play();
        interval = setInterval(() => {
          detectFaces(video, canvas);
        }, 100);
      })
      .catch((err) => {
        console.error(err);
      });

    return () => {
      clearInterval(interval);
    };
  }, []);

  const detectFaces = async (
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement
  ) => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.SsdMobilenetv1Options())
      .withFaceLandmarks()
      .withFaceDescriptors();

    // setDetections(d);

    // Canvas üzerinde yüzleri çiz
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    detections.forEach((detection) => {
      const box = detection.detection.box;
      const x = box.x;
      const y = box.y;
      const width = box.width;
      const height = box.height;
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
    });
  };
  useEffect(() => {
    const handleResize = () => {
      if (videoRef.current) {
        setVideoWidth(videoRef.current.videoWidth);
        setVideoHeight(videoRef.current.videoHeight);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handlePlay = async () => {
    if (!isLoaded || !videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = videoWidth;
    canvas.height = videoHeight;

    const stream = video.srcObject as MediaStream;
    const track = stream.getVideoTracks()[0];
    const settings = track.getSettings();
    const aspectRatio = settings.aspectRatio || videoWidth / videoHeight;
    const displayWidth = video.clientWidth;
    const displayHeight = displayWidth / aspectRatio;

    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    const detectionInterval = setInterval(async () => {
      const detectionOptions = new faceapi.TinyFaceDetectorOptions({
        inputSize: 128,
        scoreThreshold: 0.5,
      });

      const singleFaceDetection = await faceapi
        .detectSingleFace(video, detectionOptions)
        .withFaceLandmarks();
      if (!singleFaceDetection) return;

      const leftEye = singleFaceDetection.landmarks.getLeftEye();
      const rightEye = singleFaceDetection.landmarks.getRightEye();

      // Burada, sol ve sağ gözlerin pozisyonunu kullanarak
      // farklı işlemler gerçekleştirebilirsiniz.
    }, 100);

    video.addEventListener("pause", () => clearInterval(detectionInterval));
    video.addEventListener("ended", () => clearInterval(detectionInterval));
  };

  return (
    <>
      <video
        ref={videoRef}
        style={{ display: "none" }}
        onPlay={handlePlay}
        autoPlay
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", top: 0, left: 0 }}
      />
    </>
  );
};

export default EyeDetection;
