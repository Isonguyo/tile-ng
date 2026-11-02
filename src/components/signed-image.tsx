import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ImageIcon } from "lucide-react";
import { getSignedUrl } from "@/lib/storage";

type SignedImageProps = React.ImgHTMLAttributes<HTMLImageElement> & { path?: string | null };

export function SignedImage({ path, alt = "", className, ...props }: SignedImageProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const { data: url } = useQuery({
    queryKey: ["signed-listing-image", path],
    enabled: !!path,
    queryFn: () => getSignedUrl(path!),
    staleTime: 50 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  useEffect(() => setFailedUrl(null), [path, url]);

  if (!url || failedUrl === url) {
    return (
      <div className={`grid place-items-center bg-muted text-muted-foreground/50 ${className ?? ""}`} aria-label={alt}>
        <ImageIcon className="h-8 w-8" />
      </div>
    );
  }
  return <img src={url} alt={alt} className={className} onError={() => setFailedUrl(url)} {...props} />;
}
