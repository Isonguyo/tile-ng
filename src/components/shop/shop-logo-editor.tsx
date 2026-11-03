import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fromUntyped } from "@/lib/db-untyped";
import { rpcUntyped } from "@/lib/waitlist-rpc";
import { SignedImage } from "@/components/signed-image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { showError } from "@/lib/user-feedback";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 10 * 1024 * 1024;

type ShopLogoEditorProps = {
  ownerId: string;
  slug: string;
  currentPath: string | null;
  shopStatus: string | null;
};

/**
 * Owner-only controls for the merchant shop logo. Uploads into the existing
 * private "listings" bucket, stores the object path on profiles.shop_logo_url
 * and cleans up the replaced object. Never touches avatar_url.
 */
export function ShopLogoEditor({ ownerId, slug, currentPath, shopStatus }: ShopLogoEditorProps) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    [],
  );

  const openEditor = () => {
    setFile(null);
    setPreview(null);
    setOpen(true);
  };

  const closeEditor = () => {
    if (busy) return;
    setFile(null);
    setPreview(null);
    setOpen(false);
  };

  const pickFile = (incoming?: File) => {
    if (busy) return;
    if (!incoming) return;
    if (!ALLOWED_TYPES.includes(incoming.type)) {
      toast.error("Choose a JPEG, PNG, WebP or AVIF image.");
      return;
    }
    if (incoming.size > MAX_BYTES) {
      toast.error("Shop logos must be 10 MB or smaller.");
      return;
    }
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const url = URL.createObjectURL(incoming);
    previewUrlRef.current = url;
    setFile(incoming);
    setPreview(url);
  };

  const refreshShop = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["shop", slug] }),
      qc.invalidateQueries({ queryKey: ["merchant-shop-profile", ownerId] }),
      qc.invalidateQueries({ queryKey: ["shop-listings", ownerId] }),
    ]);
  };

  const isStorableObject = (path: string) =>
    !/^(?:https?:\/\/|\/\/|data:image\/|blob:)/i.test(path) && path.startsWith(`${ownerId}/`);

  const saveNewLogo = async () => {
    if (!file || busy) return;
    setBusy(true);
    try {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${ownerId}/shop-logo-${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("listings")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (uploadError) throw uploadError;

      const previous = currentPath && currentPath !== path ? currentPath : null;
      const { error: updateError } = await fromUntyped("profiles")
        .update({ shop_logo_url: path })
        .eq("id", ownerId);
      if (updateError) {
        await supabase.storage.from("listings").remove([path]).catch(() => {});
        throw updateError;
      }
      if (previous && isStorableObject(previous)) {
        await supabase.storage.from("listings").remove([previous]).catch(() => {});
      }

      // Editing an approved or rejected storefront sends it back through the
      // existing moderation workflow — never set an approved status here.
      let sentForReview = false;
      if (shopStatus === "approved" || shopStatus === "rejected") {
        const { error: reviewError } = await rpcUntyped("submit_shop_for_review");
        sentForReview = !reviewError;
        if (reviewError) console.warn("submit_shop_for_review failed:", reviewError.message);
      }

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      setFile(null);
      setPreview(null);
      setOpen(false);
      await refreshShop();
      toast.success("Shop logo updated.");
      if (shopStatus === "approved" || shopStatus === "rejected") {
        if (sentForReview) {
          toast.info("Your updated shop profile has been submitted for review. The new logo appears publicly once Tile Admin approves it.");
        } else {
          toast.info("Your updated shop profile now requires review before the new logo shows publicly.");
        }
      }
    } catch (error) {
      showError(error, "We couldn't update your shop logo. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const removeLogo = async () => {
    if (busy || !currentPath) return;
    setBusy(true);
    try {
      const { error } = await fromUntyped("profiles")
        .update({ shop_logo_url: null })
        .eq("id", ownerId);
      if (error) throw error;
      if (isStorableObject(currentPath)) {
        await supabase.storage.from("listings").remove([currentPath]).catch(() => {});
      }
      setOpen(false);
      await refreshShop();
      toast.success("Shop logo removed. Your shop initial shows instead.");
    } catch (error) {
      showError(error, "We couldn't remove your shop logo. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openEditor}
        aria-label="Change shop photo"
        title="Change shop photo"
        className="absolute -bottom-2 -right-2 z-10 grid h-10 w-10 place-items-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-md transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Camera className="h-4 w-4" />
      </button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) closeEditor();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Shop photo</DialogTitle>
            <DialogDescription>
              Update the picture shown on your storefront. JPG, PNG, WebP or AVIF, up to 10 MB.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="mx-auto h-40 w-40 overflow-hidden rounded-2xl border bg-muted">
              {preview ? (
                <img src={preview} alt="New shop photo preview" className="h-full w-full object-cover" />
              ) : currentPath ? (
                <SignedImage path={currentPath} alt="Current shop photo" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-xs text-muted-foreground">
                  No photo yet
                </div>
              )}
            </div>
            {file && (
              <p className="text-center text-xs text-muted-foreground">
                {file.name} — save to apply this photo to your shop.
              </p>
            )}
            {busy && (
              <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Working on your shop photo…
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-2">
              <label
                className={`inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold hover:bg-accent ${busy ? "pointer-events-none opacity-60" : ""}`}
              >
                <Camera className="h-4 w-4" />
                {currentPath ? "Replace Photo" : "Upload Photo"}
                <input
                  className="sr-only"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  disabled={busy}
                  onChange={(event) => {
                    pickFile(event.target.files?.[0]);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              {file && (
                <Button onClick={() => void saveNewLogo()} disabled={busy}>
                  {busy ? "Saving…" : "Save Photo"}
                </Button>
              )}
              {currentPath && !file && (
                <Button variant="outline" disabled={busy} onClick={() => void removeLogo()}>
                  <Trash2 className="h-4 w-4" /> Remove Photo
                </Button>
              )}
              <Button variant="ghost" disabled={busy} onClick={closeEditor}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
