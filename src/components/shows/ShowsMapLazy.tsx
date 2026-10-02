"use client";

import dynamic from "next/dynamic";

/** ShowsMap without server rendering — Leaflet needs `window`. */
export const ShowsMapLazy = dynamic(() => import("./ShowsMap").then((m) => m.ShowsMap), {
  ssr: false,
  loading: () => <div className="h-[380px] w-full border border-steel-dim/40 bg-ink-raised sm:h-[460px]" />,
});
