type Props = {
  className?: string;
};

export function AnimatedGradientHeader({ className }: Props) {
  return (
    <div
      className={className}
      style={{
        width: "100%",
        display: "block",
        backgroundImage:
          "linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 50%, hsl(var(--primary)) 100%)",
        backgroundSize: "100% 100%",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
      aria-hidden
    />
  );
}
