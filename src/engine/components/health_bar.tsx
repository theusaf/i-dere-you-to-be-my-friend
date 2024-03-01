export interface HealthBarProps {
  percentage: number;
  className?: string;
}

export function HealthBar({
  percentage,
  className,
}: HealthBarProps): JSX.Element {
  return (
    <div
      className={`h-2 outline-1 outline relative w-full pointer-events-all ${className ?? ""}`}
    >
      <span
        className="absolute z-10 h-full bg-green-500 transition-all duration-500 ease-in-out"
        style={{
          width: `${percentage * 100}%`,
        }}
      ></span>
      <span className="bg-red-800 absolute w-full h-full"></span>
    </div>
  );
}
