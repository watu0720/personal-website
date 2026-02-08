import Image from "next/image";

type HomeHeroProps = {
  headerImageUrl?: string | null;
  title?: string;
  subtitle?: string;
};

export function HomeHero({
  headerImageUrl,
  title = "わっつーのHP へようこそ",
  subtitle = "動画投稿・開発活動などをまとめた個人ホームページです。",
}: HomeHeroProps) {
  const imgSrc = headerImageUrl || "/placeholder.svg";
  return (
    <section className="mb-10 overflow-hidden rounded-2xl border bg-card animate-in">
      <div className="relative h-48 w-full sm:h-64">
        <Image
          src={imgSrc}
          alt="ヘッダー"
          fill
          className="object-cover"
          priority
          unoptimized={imgSrc.startsWith("http")}
        />
      </div>
      <div className="p-6">
        <h1 className="mb-2 text-2xl font-bold text-foreground text-balance">
          {title}
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {subtitle}
        </p>
      </div>
    </section>
  );
}
