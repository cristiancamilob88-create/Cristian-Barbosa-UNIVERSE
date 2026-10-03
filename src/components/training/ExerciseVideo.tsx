import { youtubeEmbedUrl, youtubeId, type Exercise } from "@/lib/exercises";

/**
 * The video for one library exercise: an uploaded clip plays in a plain
 * <video> (muted, looping, inline — a movement demo, not a talk), a
 * YouTube link embeds through youtube-nocookie, and any other link
 * (an Instagram reel…) is a button that opens it. Uploaded wins when both
 * exist. Renders nothing when the exercise has no video.
 */
export function ExerciseVideo({ exercise, title }: { exercise: Pick<Exercise, "uploadedVideoUrl" | "videoUrl">; title: string }) {
  if (exercise.uploadedVideoUrl) {
    return (
      <video
        src={exercise.uploadedVideoUrl}
        controls
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={`Video: ${title}`}
        className="aspect-[9/16] max-h-[70vh] w-full bg-ink-raised object-contain sm:aspect-video"
      />
    );
  }

  const ytId = youtubeId(exercise.videoUrl);
  if (ytId) {
    return (
      <div className="aspect-video w-full bg-ink-raised">
        <iframe
          src={youtubeEmbedUrl(ytId)}
          title={`Video: ${title}`}
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          className="h-full w-full"
        />
      </div>
    );
  }

  if (exercise.videoUrl) {
    return (
      <a
        href={exercise.videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-fit items-center border border-ember px-5 py-3 font-mono text-xs uppercase tracking-wider text-ember hover:bg-ember hover:text-ink"
      >
        Ver el video
      </a>
    );
  }

  return null;
}
