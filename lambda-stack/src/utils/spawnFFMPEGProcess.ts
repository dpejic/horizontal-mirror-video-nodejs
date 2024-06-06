import { spawn } from "child_process";

export const spawnFFMPEGProcess = () => {
  return spawn(
    "/opt/ffmpeg",
    [
      "-i",
      "pipe:0",
      "-filter:v",
      "hflip",
      "-f",
      "mp4",
      "-movflags",
      "frag_keyframe+empty_moov",
      "-c:v",
      "libx264",
      "-c:a",
      "aac",
      "pipe:1",
    ],
    {
      stdio: ["pipe", "pipe", "pipe"],
      env: process.env,
    }
  );
};
