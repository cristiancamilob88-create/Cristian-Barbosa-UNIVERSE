import Image from "next/image";
import Link from "next/link";
import { pastShowPath, type PastShow } from "@/config/pastShows";

/** One show in a "Shows realizados" list — links to its own page. */
export function PastShowCard({ show }: { show: PastShow }) {
  return (
    <Link
      href={pastShowPath(show.slug)}
      className="group flex flex-col overflow-hidden bg-ink-raised transition-colors"
    >
      {show.image && (
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={show.image.src}
            alt={show.image.alt}
            fill
            sizes="(min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-6">
        <p className="text-base text-tide">
          {show.town}, {show.region} · {show.whenLabel}
        </p>
        <h3 className="font-display text-xl font-black uppercase tracking-tight text-chalk group-hover:text-ember">
          {show.title}
        </h3>
        <p className="text-base text-steel">{show.summary}</p>
        <p className="mt-auto pt-2 text-base font-bold text-ember">Ver el show →</p>
      </div>
    </Link>
  );
}
