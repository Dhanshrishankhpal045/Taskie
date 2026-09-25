import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileAudio,
  FileText,
  Loader2,
  Mic,
  MicOff,
  Sparkles,
  Upload,
  WandSparkles,
  X,
} from "lucide-react";

import {
  analyzeMeeting,
  createMeeting,
} from "../api/meetingApi";

import { transcribeAudio } from "../api/audioApi";

import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

function NewMeeting() {
  const navigate = useNavigate();

  const MAX_RECORDING_SECONDS = 60 * 60;

  const [title, setTitle] = useState("");
  const [transcript, setTranscript] = useState("");

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const [error, setError] = useState("");

  const [isRecording, setIsRecording] =
    useState(false);

  const [recordingSeconds, setRecordingSeconds] =
    useState(0);

  const [recordingStatus, setRecordingStatus] =
    useState("");

  const mediaRecorderRef =
    useRef<MediaRecorder | null>(null);

  const audioChunksRef =
    useRef<Blob[]>([]);

  const recordingTimerRef =
    useRef<number | null>(null);

  const stopRecordingRef =
    useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current !== null) {
        window.clearInterval(
          recordingTimerRef.current
        );

        recordingTimerRef.current = null;
      }

      const recorder =
        mediaRecorderRef.current;

      if (recorder) {
        if (recorder.state === "recording") {
          recorder.stop();
        }

        recorder.stream
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, []);

  const formatRecordingTime = (
    seconds: number
  ) => {
    const hours = Math.floor(seconds / 3600);

    const minutes = Math.floor(
      (seconds % 3600) / 60
    );

    const remainingSeconds =
      seconds % 60;

    if (hours > 0) {
      return `${String(hours).padStart(
        2,
        "0"
      )}:${String(minutes).padStart(
        2,
        "0"
      )}:${String(
        remainingSeconds
      ).padStart(2, "0")}`;
    }

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  const extractPdfText = async (
    file: File
  ): Promise<string> => {
    const arrayBuffer =
      await file.arrayBuffer();

    const pdf =
      await pdfjsLib.getDocument({
        data: arrayBuffer,
      }).promise;

    const pages: string[] = [];

    for (
      let pageNumber = 1;
      pageNumber <= pdf.numPages;
      pageNumber++
    ) {
      const page =
        await pdf.getPage(pageNumber);

      const content =
        await page.getTextContent();

      const pageText = content.items
        .map((item) =>
          "str" in item ? item.str : ""
        )
        .join(" ");

      pages.push(pageText);
    }

    return pages.join("\n\n");
  };

  const handleTextOrPdfUpload = async (
    file: File
  ) => {
    const fileName =
      file.name.toLowerCase();

    const maxFileSize =
      10 * 1024 * 1024;

    if (file.size > maxFileSize) {
      setError(
        "Text or PDF files must be smaller than 10 MB."
      );
      return;
    }

    if (
      !fileName.endsWith(".txt") &&
      !fileName.endsWith(".pdf")
    ) {
      setError(
        "Unsupported transcript file. Please upload a TXT or PDF file."
      );
      return;
    }

    try {
      setFileLoading(true);
      setError("");
      setSelectedFile(file);

      let extractedText = "";

      if (fileName.endsWith(".txt")) {
        extractedText =
          await file.text();
      } else {
        extractedText =
          await extractPdfText(file);
      }

      if (!extractedText.trim()) {
        setError(
          "No readable text was found in this file."
        );
        return;
      }

      setTranscript(
        extractedText.trim()
      );
    } catch (err) {
      console.error(
        "Failed to extract transcript file:",
        err
      );

      setError(
        "Could not read this file. Please try another TXT or PDF file."
      );
    } finally {
      setFileLoading(false);
    }
  };

  const handleAudioUpload = async (
    file: File
  ) => {
    const fileName =
      file.name.toLowerCase();

    const allowedExtensions = [
      ".mp3",
      ".wav",
      ".m4a",
      ".webm",
    ];

    const isSupported =
      allowedExtensions.some(
        (extension) =>
          fileName.endsWith(extension)
      );

    if (!isSupported) {
      setError(
        "Unsupported audio format. Please upload MP3, WAV, M4A, or WebM."
      );
      return;
    }

    const maxFileSize =
      25 * 1024 * 1024;

    if (file.size > maxFileSize) {
      setError(
        "Audio files must be smaller than 25 MB."
      );
      return;
    }

    try {
      setFileLoading(true);
      setError("");
      setSelectedFile(file);

      const extractedTranscript =
        await transcribeAudio(file);

      if (!extractedTranscript.trim()) {
        setError(
          "No transcript was returned from the audio."
        );
        return;
      }

      setTranscript(
        extractedTranscript.trim()
      );
    } catch (err) {
      console.error(
        "Audio transcription failed:",
        err
      );

      const message =
        err instanceof Error
          ? err.message
          : "Failed to transcribe audio.";

      setError(message);
    } finally {
      setFileLoading(false);
    }
  };

  const handleFileChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const fileName =
      file.name.toLowerCase();

    setError("");

    if (
      fileName.endsWith(".txt") ||
      fileName.endsWith(".pdf")
    ) {
      await handleTextOrPdfUpload(file);
    } else if (
      fileName.endsWith(".mp3") ||
      fileName.endsWith(".wav") ||
      fileName.endsWith(".m4a") ||
      fileName.endsWith(".webm")
    ) {
      await handleAudioUpload(file);
    } else {
      setError(
        "Unsupported file type. Please upload TXT, PDF, MP3, WAV, M4A, or WebM."
      );
    }

    event.target.value = "";
  };

  const stopRecording = () => {
    const recorder =
      mediaRecorderRef.current;

    if (!recorder) {
      return;
    }

    if (recordingTimerRef.current !== null) {
      window.clearInterval(
        recordingTimerRef.current
      );

      recordingTimerRef.current = null;
    }

    if (recorder.state === "recording") {
      recorder.stop();
    }

    recorder.stream
      .getTracks()
      .forEach((track) =>
        track.stop()
      );

    setIsRecording(false);

    setRecordingStatus(
      "Processing recording..."
    );
  };

  stopRecordingRef.current =
    stopRecording;

  const startRecording = async () => {
    try {
      setError("");
      setRecordingStatus("");

      if (
        loading ||
        fileLoading ||
        isRecording
      ) {
        return;
      }

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setError(
          "Your browser does not support microphone recording."
        );
        return;
      }

      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            audio: true,
          }
        );

      let mimeType = "";

      if (
        MediaRecorder.isTypeSupported(
          "audio/webm;codecs=opus"
        )
      ) {
        mimeType =
          "audio/webm;codecs=opus";
      } else if (
        MediaRecorder.isTypeSupported(
          "audio/webm"
        )
      ) {
        mimeType = "audio/webm";
      } else if (
        MediaRecorder.isTypeSupported(
          "audio/mp4"
        )
      ) {
        mimeType = "audio/mp4";
      }

      let recorder: MediaRecorder;

      try {
        recorder = mimeType
          ? new MediaRecorder(stream, {
              mimeType,
            })
          : new MediaRecorder(stream);
      } catch (recorderError) {
        stream
          .getTracks()
          .forEach((track) =>
            track.stop()
          );

        console.error(
          "Could not create MediaRecorder:",
          recorderError
        );

        setError(
          "Your browser could not create an audio recorder."
        );

        return;
      }

      audioChunksRef.current = [];

      recorder.ondataavailable = (
        event
      ) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(
            event.data
          );
        }
      };

      recorder.onerror = () => {
        console.error(
          "MediaRecorder error."
        );

        setError(
          "The recording encountered an unexpected error."
        );

        setIsRecording(false);
        setRecordingStatus("");

        if (
          recordingTimerRef.current !==
          null
        ) {
          window.clearInterval(
            recordingTimerRef.current
          );

          recordingTimerRef.current = null;
        }

        stream
          .getTracks()
          .forEach((track) =>
            track.stop()
          );
      };

      recorder.onstop = async () => {
        try {
          setFileLoading(true);
          setError("");
          setRecordingStatus(
            "Transcribing recording..."
          );

          const actualMimeType =
            recorder.mimeType ||
            "audio/webm";

          const extension =
            actualMimeType.includes(
              "mp4"
            )
              ? "m4a"
              : "webm";

          const audioBlob =
            new Blob(
              audioChunksRef.current,
              {
                type: actualMimeType,
              }
            );

          if (audioBlob.size === 0) {
            setError(
              "The recording was empty. Please try recording again."
            );
            return;
          }

          const audioFile =
            new File(
              [audioBlob],
              `meeting-recording-${Date.now()}.${extension}`,
              {
                type: actualMimeType,
              }
            );

          setSelectedFile(
            audioFile
          );

          const extractedTranscript =
            await transcribeAudio(
              audioFile
            );

          if (
            !extractedTranscript.trim()
          ) {
            setError(
              "No transcript was returned from the recording."
            );
            return;
          }

          setTranscript(
            extractedTranscript.trim()
          );

          setRecordingStatus(
            "Recording transcribed successfully."
          );
        } catch (err) {
          console.error(
            "Live recording transcription failed:",
            err
          );

          const message =
            err instanceof Error
              ? err.message
              : "Failed to transcribe the recording.";

          setError(message);
          setRecordingStatus("");
        } finally {
          setFileLoading(false);

          stream
            .getTracks()
            .forEach((track) =>
              track.stop()
            );
        }
      };

      mediaRecorderRef.current =
        recorder;

      recorder.start(1000);

      setIsRecording(true);
      setRecordingSeconds(0);

      setRecordingStatus(
        "Recording in progress..."
      );

      recordingTimerRef.current =
        window.setInterval(() => {
          setRecordingSeconds(
            (previous) => {
              const next =
                previous + 1;

              if (
                next >=
                MAX_RECORDING_SECONDS
              ) {
                window.setTimeout(
                  () => {
                    if (
                      mediaRecorderRef.current
                        ?.state ===
                      "recording"
                    ) {
                      stopRecordingRef.current?.();
                    }
                  },
                  0
                );
              }

              return Math.min(
                next,
                MAX_RECORDING_SECONDS
              );
            }
          );
        }, 1000);
    } catch (err) {
      console.error(
        "Could not start recording:",
        err
      );

      const errorName =
        err instanceof DOMException
          ? err.name
          : "";

      if (
        errorName ===
        "NotAllowedError"
      ) {
        setError(
          "Microphone permission was denied. Please allow microphone access in your browser and try again."
        );
      } else if (
        errorName ===
        "NotFoundError"
      ) {
        setError(
          "No microphone was found. Please connect a microphone and try again."
        );
      } else if (
        errorName ===
        "NotReadableError"
      ) {
        setError(
          "Your microphone is currently being used by another application."
        );
      } else {
        setError(
          "Microphone access was denied or could not be started."
        );
      }

      setIsRecording(false);
      setRecordingStatus("");
    }
  };

  const clearSelectedFile = () => {
    if (isRecording || fileLoading) {
      return;
    }

    setSelectedFile(null);
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const cleanTitle =
      title.trim();

    const cleanTranscript =
      transcript.trim();

    if (!cleanTitle) {
      setError(
        "Please enter a meeting title."
      );
      return;
    }

    if (!cleanTranscript) {
      setError(
        "Please enter, upload, or record a meeting transcript."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const meeting =
        await createMeeting({
          title: cleanTitle,
        });

      await analyzeMeeting(
        meeting._id,
        cleanTranscript
      );

      navigate(
        `/meetings/${meeting._id}`
      );
    } catch (err: any) {
      console.error(
        "Failed to create and analyze meeting:",
        err
      );

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Something went wrong while creating or analyzing the meeting. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-meeting-page">
      <div className="new-meeting-header">
        <button
          type="button"
          className="back-button"
          onClick={() =>
            navigate("/meetings")
          }
          disabled={
            loading ||
            fileLoading ||
            isRecording
          }
        >
          <ArrowLeft size={17} />
          Back to Meetings
        </button>

        <div>
          <div className="page-eyebrow">
            Meeting Intelligence
          </div>

          <h1>
            Create New Meeting
          </h1>

          <p>
            Add a transcript, upload a
            file, or record your meeting
            and let Taskie turn the
            conversation into verified
            action items.
          </p>
        </div>
      </div>

      <form
        className="new-meeting-form"
        onSubmit={handleSubmit}
      >
        <div className="form-section">
          <div className="form-section-header">
            <div className="form-section-icon">
              <FileText size={18} />
            </div>

            <div>
              <h2>
                Meeting Details
              </h2>

              <p>
                Give your meeting a title
                and provide the
                conversation.
              </p>
            </div>
          </div>

          <label className="form-field">
            <span>
              Meeting Title
            </span>

            <input
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value
                )
              }
              placeholder="e.g. Weekly Project Sync"
              disabled={
                loading ||
                fileLoading ||
                isRecording
              }
            />
          </label>
        </div>

        <div className="form-section">
          <div className="form-section-header">
            <div className="form-section-icon">
              <Upload size={18} />
            </div>

            <div>
              <h2>
                Add Meeting Content
              </h2>

              <p>
                Paste the transcript or
                upload a TXT, PDF, MP3,
                WAV, M4A, or WebM file.
              </p>
            </div>
          </div>

          <div className="meeting-input-options">
            <label className="meeting-upload-button">
              <Upload size={17} />

              <span>
                Upload File
              </span>

              <input
                type="file"
                accept=".txt,.pdf,.mp3,.wav,.m4a,.webm"
                onChange={
                  handleFileChange
                }
                disabled={
                  loading ||
                  fileLoading ||
                  isRecording
                }
                hidden
              />
            </label>

            <span className="meeting-upload-help">
              TXT / PDF / MP3 / WAV /
              M4A / WebM
            </span>
          </div>

          {selectedFile && (
            <div className="selected-file-card">
              <div className="selected-file-info">
                <div className="selected-file-icon">
                  {selectedFile.name
                    .toLowerCase()
                    .match(
                      /\.(mp3|wav|m4a|webm)$/
                    ) ? (
                    <FileAudio size={18} />
                  ) : (
                    <FileText size={18} />
                  )}
                </div>

                <div>
                  <strong>
                    {selectedFile.name}
                  </strong>

                  <span>
                    {fileLoading
                      ? "Processing..."
                      : "Processed successfully"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="selected-file-remove"
                onClick={
                  clearSelectedFile
                }
                disabled={
                  loading ||
                  fileLoading ||
                  isRecording
                }
                aria-label="Remove selected file"
              >
                <X size={17} />
              </button>
            </div>
          )}

          <div
            className={`live-recording-card ${
              isRecording
                ? "is-recording"
                : ""
            }`}
          >
            <div className="live-recording-info">
              <div className="live-recording-icon">
                {isRecording ? (
                  <MicOff size={19} />
                ) : (
                  <Mic size={19} />
                )}
              </div>

              <div>
                <strong>
                  {isRecording
                    ? "Recording meeting..."
                    : "Record Meeting"}
                </strong>

                <span>
                  {isRecording
                    ? `${formatRecordingTime(
                        recordingSeconds
                      )} / 60:00 maximum`
                    : recordingStatus ||
                      "Record your meeting directly from your browser"}
                </span>
              </div>
            </div>

            {isRecording && (
              <div className="recording-live-indicator">
                <span />
                LIVE
              </div>
            )}

            {!isRecording ? (
              <button
                type="button"
                className="recording-start-button"
                onClick={
                  startRecording
                }
                disabled={
                  loading ||
                  fileLoading
                }
              >
                <Mic size={17} />
                Start Recording
              </button>
            ) : (
              <button
                type="button"
                className="recording-stop-button"
                onClick={
                  stopRecording
                }
                disabled={
                  fileLoading
                }
              >
                <MicOff size={17} />
                Stop Recording
              </button>
            )}
          </div>

          {isRecording && (
            <div className="recording-progress">
              <div
                className="recording-progress-bar"
                style={{
                  width: `${Math.min(
                    100,
                    (recordingSeconds /
                      MAX_RECORDING_SECONDS) *
                      100
                  )}%`,
                }}
              />
            </div>
          )}

          {recordingStatus &&
            !isRecording &&
            !fileLoading && (
              <div className="recording-status-message">
                <Mic size={15} />
                {recordingStatus}
              </div>
            )}

          <label className="form-field transcript-field">
            <span>
              Transcript
            </span>

            <textarea
              value={transcript}
              onChange={(event) =>
                setTranscript(
                  event.target.value
                )
              }
              placeholder="Paste or type your meeting transcript here..."
              rows={14}
              disabled={
                loading ||
                fileLoading ||
                isRecording
              }
            />
          </label>
        </div>

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        <div className="new-meeting-submit">
          <div className="submit-info">
            <Sparkles size={17} />

            <span>
              Taskie will analyze the
              conversation and prepare
              results for human
              verification.
            </span>
          </div>

          <button
            type="submit"
            className="primary-submit-button"
            disabled={
              loading ||
              fileLoading ||
              isRecording
            }
          >
            {loading ? (
              <>
                <Loader2
                  size={18}
                  className="spin"
                />
                Analyzing...
              </>
            ) : (
              <>
                <WandSparkles
                  size={18}
                />
                Analyze Meeting
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default NewMeeting;