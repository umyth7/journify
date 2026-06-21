import ffmpeg from "fluent-ffmpeg";
import { S3Client, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { Readable } from "stream";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

const db = new PrismaClient();

// Lossless formats → always transcode
const LOSSLESS_CODECS = new Set(["pcm_s16le", "pcm_s24le", "pcm_s32le", "pcm_f32le", "flac", "alac", "pcm_s16be"]);

// Bitrate threshold: if source is lossy and ≤ this, skip re-encoding
const SKIP_TRANSCODE_BITRATE = 192_000; // 192kbps

interface ProbeResult {
  codec: string;
  bitrate: number; // bps
  duration: number; // seconds
}

function probeAudio(url: string): Promise<ProbeResult> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(url, (err, meta) => {
      if (err) return reject(err);
      const audio = meta.streams.find((s) => s.codec_type === "audio");
      if (!audio) return reject(new Error("No audio stream found"));
      resolve({
        codec: audio.codec_name ?? "unknown",
        bitrate: parseInt(String(audio.bit_rate ?? meta.format.bit_rate ?? "0")),
        duration: parseFloat(String(meta.format.duration ?? "0")),
      });
    });
  });
}

function shouldTranscode(probe: ProbeResult): boolean {
  // Always transcode lossless formats
  if (LOSSLESS_CODECS.has(probe.codec)) return true;
  // Transcode lossy if high bitrate (size reduction worth it)
  if (probe.bitrate > SKIP_TRANSCODE_BITRATE) return true;
  // AAC/OGG/Opus → convert to MP3 for universal browser compat
  if (["aac", "vorbis", "opus"].includes(probe.codec)) return true;
  // Already ≤192kbps MP3 → keep as-is
  return false;
}

async function downloadToTemp(key: string): Promise<string> {
  const tmpPath = path.join(os.tmpdir(), `journey-src-${Date.now()}-${path.basename(key)}`);
  const res = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const body = res.Body as Readable;

  await new Promise<void>((resolve, reject) => {
    const ws = fs.createWriteStream(tmpPath);
    body.pipe(ws);
    ws.on("finish", resolve);
    ws.on("error", reject);
  });

  return tmpPath;
}

function transcodeToMp3(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioCodec("libmp3lame")
      .audioBitrate(128)
      .audioChannels(2)
      .audioFrequency(44100)
      .format("mp3")
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run();
  });
}

async function uploadToR2(filePath: string, key: string): Promise<string> {
  const fileStream = fs.createReadStream(filePath);
  const upload = new Upload({
    client: r2,
    params: {
      Bucket: BUCKET,
      Key: key,
      Body: fileStream,
      ContentType: "audio/mpeg",
    },
    queueSize: 4,
    partSize: 10 * 1024 * 1024,
  });
  await upload.done();
  return `${R2_PUBLIC_URL}/${key}`;
}

export async function processTranscodeJob(setId: string, originalKey: string): Promise<void> {
  console.log(`[transcode] Starting job for set ${setId}`);

  let srcTmp: string | null = null;
  let outTmp: string | null = null;

  try {
    // 1. Download source first, probe locally (avoids R2 public URL dependency)
    console.log(`[transcode] Downloading source...`);
    srcTmp = await downloadToTemp(originalKey);
    console.log(`[transcode] Downloaded to ${srcTmp}`);

    const probe = await probeAudio(srcTmp);
    console.log(`[transcode] Source: codec=${probe.codec} bitrate=${Math.round(probe.bitrate / 1000)}kbps duration=${Math.round(probe.duration)}s`);

    if (!shouldTranscode(probe)) {
      console.log(`[transcode] Skipping transcode (already optimal)`);
      await db.set.update({ where: { id: setId }, data: { status: "READY" } });
      return;
    }

    // 3. Transcode to MP3 128kbps
    const outKey = originalKey.replace(/\.[^.]+$/, "") + "-128k.mp3";
    outTmp = path.join(os.tmpdir(), `journey-out-${Date.now()}.mp3`);
    console.log(`[transcode] Transcoding to MP3 128kbps...`);
    await transcodeToMp3(srcTmp, outTmp);

    const srcSize = fs.statSync(srcTmp).size;
    const outSize = fs.statSync(outTmp).size;
    console.log(`[transcode] Done: ${Math.round(srcSize / 1024 / 1024)}MB → ${Math.round(outSize / 1024 / 1024)}MB`);

    // 4. Upload transcoded file
    console.log(`[transcode] Uploading to R2...`);
    const newAudioUrl = await uploadToR2(outTmp, outKey);

    // 5. Update DB first (so set is never in a broken state)
    await db.set.update({
      where: { id: setId },
      data: { status: "READY", audioUrl: newAudioUrl },
    });
    console.log(`[transcode] Set ${setId} → READY`);

    // 6. Delete original from R2 (after DB is safe)
    await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: originalKey }));
    console.log(`[transcode] Deleted original from R2`);

  } catch (err) {
    console.error(`[transcode] Failed for set ${setId}:`, err);
    await db.set.update({ where: { id: setId }, data: { status: "FAILED" } }).catch((dbErr) => {
      console.error(`[transcode] Failed to update status to FAILED for set ${setId}:`, dbErr);
    });
    throw err;
  } finally {
    if (srcTmp && fs.existsSync(srcTmp)) fs.unlinkSync(srcTmp);
    if (outTmp && fs.existsSync(outTmp)) fs.unlinkSync(outTmp);
  }
}
