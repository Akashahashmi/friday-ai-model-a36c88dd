/** Pure-CSS starfield + occasional meteors, fixed behind the UI, non-interactive. */
function stars(count: number, seed: number) {
  let s = seed;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  return Array.from({ length: count }, () => {
    const a = (0.35 + rnd() * 0.6).toFixed(2);
    return `${(rnd() * 100).toFixed(2)}vw ${(rnd() * 100).toFixed(2)}vh oklch(1 0 0 / ${a})`;
  }).join(",");
}
const LAYERS = [stars(140, 7), stars(70, 23), stars(25, 91)];

export function SpaceBackground() {
  return (
    <div className="space-bg" aria-hidden="true">
      <div className="star-layer s1" style={{ boxShadow: LAYERS[0] }} />
      <div className="star-layer s2" style={{ boxShadow: LAYERS[1] }} />
      <div className="star-layer s3" style={{ boxShadow: LAYERS[2] }} />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <span key={i} className={`meteor m${i}`} />
      ))}
    </div>
  );
}
