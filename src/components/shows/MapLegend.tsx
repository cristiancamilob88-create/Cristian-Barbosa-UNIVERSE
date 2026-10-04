/** Color key for ShowsMap — same order everywhere the map appears. */
export function MapLegend() {
  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-steel">
      <li className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ffc857]" aria-hidden="true" />
        Próximas fechas
      </li>
      <li className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-ember" aria-hidden="true" />
        Gira con el Circo Santiago de Chile
      </li>
      <li className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-tide" aria-hidden="true" />
        Colegios, alcaldías y eventos
      </li>
      <li className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-chalk" aria-hidden="true" />
        Envigado, su base
      </li>
    </ul>
  );
}
