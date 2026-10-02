import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { showError } from "@/lib/user-feedback";
import { fromUntyped } from "@/lib/db-untyped";
import { rpcUntyped } from "@/lib/waitlist-rpc";

export const Route = createFileRoute("/artisan/edit")({
    component: EditArtisanProfilePage,
});

function EditArtisanProfilePage() {
    const { profile, loading: authLoading, refreshProfile } = useAuth();
    const { data: platformSettings } = useQuery({
        queryKey: ["artisan-edit-platform-settings"],
        queryFn: async () => {
            const { data, error } = await rpcUntyped("get_public_platform_flags");
            if (error) throw new Error(error.message);
            return data as { launch_mode?: "prelaunch" | "launched" } | null;
        },
        staleTime: 30_000,
    });
    const isPrelaunch = platformSettings?.launch_mode !== "launched";

    const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState("");
    const [newPortfolioPreviews, setNewPortfolioPreviews] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!profilePhoto) {
            setPhotoPreview(profile?.profile_photo || profile?.avatar_url || "");
            return;
        }
        const previewUrl = URL.createObjectURL(profilePhoto);
        setPhotoPreview(previewUrl);
        return () => URL.revokeObjectURL(previewUrl);
    }, [profilePhoto, profile?.profile_photo, profile?.avatar_url]);

    const [form, setForm] = useState({
        full_name: profile?.full_name ?? "",
        profession: profile?.profession ?? "",
        bio: profile?.bio ?? "",
        phone: profile?.phone ?? "",
        whatsapp: profile?.whatsapp ?? "",
    });

    const [existingPortfolio, setExistingPortfolio] = useState<string[]>(
        Array.isArray(profile?.portfolio_images)
            ? profile.portfolio_images
            : []
    );

    const [newPortfolio, setNewPortfolio] = useState<File[]>([]);

    useEffect(() => {
        const previewUrls = newPortfolio.map((file) => URL.createObjectURL(file));
        setNewPortfolioPreviews(previewUrls);
        return () => previewUrls.forEach((url) => URL.revokeObjectURL(url));
    }, [newPortfolio]);

    // Images removed by the user (delete from Storage after save)
    const [deletedPortfolio, setDeletedPortfolio] = useState<string[]>([]);

    useEffect(() => {
        if (!profile) return;
        setForm({
            full_name: profile.full_name ?? "",
            profession: profile.profession ?? "",
            bio: profile.bio ?? "",
            phone: profile.phone ?? "",
            whatsapp: profile.whatsapp ?? "",
        });
        setExistingPortfolio(Array.isArray(profile.portfolio_images) ? profile.portfolio_images : []);
    }, [profile]);

    const saveProfile = async () => {
        if (!profile) return;
        setSaving(true);

        try {
            let avatarUrl = profile.profile_photo || profile.avatar_url || "";

            // Upload new profile picture
            if (profilePhoto) {
                const ext = profilePhoto.name.split(".").pop();

                const filePath = `${profile.id}/artisan-avatar-${Date.now()}.${ext}`;

                const { error: uploadError } = await supabase.storage
                    .from("listings")
                    .upload(filePath, profilePhoto, {
                        upsert: true,
                    });

                if (uploadError) throw uploadError;

                const {
                    data: { publicUrl },
                } = supabase.storage
                    .from("listings")
                    .getPublicUrl(filePath);

                avatarUrl = publicUrl;
            }

            // Existing images that were NOT deleted
            const portfolioUrls = [...existingPortfolio];

            // Upload newly added portfolio images
            for (const file of newPortfolio) {
                const ext = file.name.split(".").pop();

                const filePath = `${profile.id}/artisan-portfolio-${crypto.randomUUID()}.${ext}`;

                const { error: uploadError } = await supabase.storage
                    .from("listings")
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const {
                    data: { publicUrl },
                } = supabase.storage
                    .from("listings")
                    .getPublicUrl(filePath);

                portfolioUrls.push(publicUrl);
            }

            // Update profile
            const { error } = await fromUntyped("profiles")
                .update({
                    full_name: form.full_name,
                    profession: form.profession,
                    bio: form.bio,
                    phone: form.phone,
                    whatsapp: form.whatsapp,
                    avatar_url: avatarUrl,
                    profile_photo: avatarUrl,
                    portfolio_images: portfolioUrls,
                    is_artisan: true,
                    is_prelaunch: isPrelaunch,
                    artisan_status: "pending",
                })
                .eq("id", profile.id);

            if (error) throw error;

            // Delete removed portfolio images from Storage
            for (const url of deletedPortfolio) {
                try {
                    const path = url.split(
                        "/storage/v1/object/public/listings/"
                    )[1];

                    if (path) {
                        await supabase.storage
                            .from("listings")
                            .remove([path]);
                    }
                } catch (err) {
                    console.error("Failed to delete portfolio image:", err);
                }
            }

            setNewPortfolio([]);
            setDeletedPortfolio([]);
            await refreshProfile();

            toast.success(
                isPrelaunch
                    ? "Your artisan profile has been submitted for review and will remain private until approved and the marketplace launches."
                    : "Your artisan profile has been submitted for review and will remain private until it is approved."
            );
        } catch (err: any) {
            console.error(err);
            showError(err, "We couldn't update your artisan profile. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[#06120d] text-slate-100">
                <SiteHeader />
                <div className="container mx-auto max-w-3xl px-4 py-24 text-center text-slate-400">Loading your artisan profile…</div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-[#06120d] text-slate-100">
                <SiteHeader />
                <div className="container mx-auto max-w-xl px-4 py-24 text-center">
                    <h1 className="text-2xl font-bold text-white">Sign in to edit your profile</h1>
                    <p className="mt-3 text-sm text-slate-400">Your artisan details and portfolio are available after you sign in.</p>
                    <Button asChild className="mt-6 rounded-xl bg-[#35d879] font-bold text-[#04120a] hover:bg-[#52e98f]"><Link to="/auth">Sign in</Link></Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#06120d] text-slate-100">
            <SiteHeader />

            <div className="container mx-auto max-w-5xl px-4 py-8 sm:py-12">
                <div className="mb-6 max-w-2xl">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Your professional presence</p>
                    <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">Edit artisan profile</h1>
                    <p className="mt-2 text-sm leading-6 text-slate-400">Keep your profile current so customers can find the right skills, contact details, and examples of your work.</p>
                </div>

                <Card className="overflow-hidden rounded-3xl border border-[#1b3b2a] bg-gradient-to-b from-[#102017] to-[#09150f] p-5 text-slate-100 shadow-[0_24px_65px_rgba(0,0,0,0.28)] sm:p-8">
                    <div className="flex flex-col gap-6 border-b border-white/[0.07] pb-7 sm:flex-row sm:items-center">
                        <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-emerald-300/20 bg-emerald-300/[0.06] shadow-lg">
                            {photoPreview ? <img src={photoPreview} alt="Artisan profile" className="h-full w-full object-cover" /> : <Camera className="h-9 w-9 text-emerald-300" />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300/80">Profile photo</p>
                            <h2 className="mt-1 text-xl font-bold text-white">Make a strong first impression</h2>
                            <p className="mt-1 max-w-xl text-sm leading-5 text-slate-400">Use a clear, well-lit photo so customers can recognize who they’re contacting.</p>

                        <label className="mt-4 inline-flex">
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                        setProfilePhoto(e.target.files[0]);
                                    }
                                }}
                            />

                            <Button asChild variant="outline" className="h-10 rounded-xl border-white/15 bg-white/[0.03] text-slate-100 hover:border-emerald-300/30 hover:bg-emerald-300/[0.06]">
                                <span>
                                    <Camera className="mr-2 h-4 w-4" />
                                    Change Profile Photo
                                </span>
                            </Button>
                        </label>
                        </div>
                    </div>

                    <div className="mt-8">

                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300/80">Work samples</p>
                                <h3 className="mt-1 text-lg font-semibold text-white">
                                    Portfolio images
                                </h3>

                                <p className="mt-1 text-sm text-slate-400">
                                    Showcase your best work.
                                </p>
                            </div>

                            <label className="inline-flex">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (!e.target.files) return;

                                        setNewPortfolio((prev) => [
                                            ...prev,
                                            ...Array.from(e.target.files!),
                                        ]);
                                    }}
                                />

                                <Button asChild className="h-10 rounded-xl bg-[#35d879] font-semibold text-[#04120a] hover:bg-[#52e98f]">
                                    <span>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Images
                                    </span>
                                </Button>
                            </label>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
                            {existingPortfolio.map((url) => (
                                <div
                                    key={url}
                                    className="group relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-[#07150e]"
                                >
                                    <img
                                        src={url}
                                        alt="Portfolio project"
                                        className="aspect-square w-full object-cover"
                                    />

                                    <Button
                                        size="icon"
                                        variant="destructive"
                                        aria-label="Remove portfolio image"
                                        className="absolute right-2 top-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"
                                        onClick={() => {
                                            setExistingPortfolio((prev) => prev.filter((img) => img !== url));
                                            setDeletedPortfolio((prev) => [...prev, url]);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            {newPortfolio.map((file, index) => (
                                <div
                                    key={index}
                                    className="group relative aspect-square overflow-hidden rounded-2xl border border-emerald-300/20 bg-[#07150e]"
                                >
                                    <img
                                        src={newPortfolioPreviews[index]}
                                        alt="New portfolio project"
                                        className="aspect-square w-full object-cover"
                                    />

                                    <Button
                                        size="icon"
                                        variant="destructive"
                                        aria-label={`Remove new portfolio image ${index + 1}`}
                                        className="absolute right-2 top-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"
                                        onClick={() =>
                                            setNewPortfolio((prev) =>
                                                prev.filter((_, i) => i !== index)
                                            )
                                        }
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>

                                    <div className="absolute bottom-0 w-full bg-emerald-300/90 py-1 text-center text-xs font-semibold text-[#06120d]">
                                        New
                                    </div>
                                </div>
                            ))}
                            {existingPortfolio.length === 0 &&
                                newPortfolio.length === 0 && (
                                    <div className="col-span-full rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center text-slate-400 sm:p-10">
                                        <ImageIcon className="mx-auto mb-3 h-10 w-10 text-emerald-300/70" />
                                        No portfolio images yet.
                                    </div>
                                )}
                        </div>
                    </div>

                    <div className="mb-4 mt-9">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300/80">Profile details</p>
                        <h3 className="mt-1 text-lg font-semibold text-white">Your public information</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input
                                className="h-11 rounded-xl border-white/10 bg-[#08150f] text-white placeholder:text-slate-600"
                                value={form.full_name}
                                onChange={(e) =>
                                    setForm({ ...form, full_name: e.target.value })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Profession</Label>
                            <Input
                                className="h-11 rounded-xl border-white/10 bg-[#08150f] text-white placeholder:text-slate-600"
                                value={form.profession}
                                onChange={(e) =>
                                    setForm({ ...form, profession: e.target.value })
                                }
                            />
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                            <Label>Bio</Label>
                            <Textarea
                                rows={5}
                                className="rounded-xl border-white/10 bg-[#08150f] text-white placeholder:text-slate-600"
                                value={form.bio}
                                onChange={(e) =>
                                    setForm({ ...form, bio: e.target.value })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Phone Number</Label>
                            <Input
                                type="tel"
                                className="h-11 rounded-xl border-white/10 bg-[#08150f] text-white placeholder:text-slate-600"
                                value={form.phone}
                                onChange={(e) =>
                                    setForm({ ...form, phone: e.target.value })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>WhatsApp Number</Label>
                            <Input
                                type="tel"
                                className="h-11 rounded-xl border-white/10 bg-[#08150f] text-white placeholder:text-slate-600"
                                value={form.whatsapp}
                                onChange={(e) =>
                                    setForm({ ...form, whatsapp: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-slate-500">{isPrelaunch ? "Your updated profile will remain private until approved and the marketplace launches." : "Your updated profile will remain private until it is approved."}</p>
                        <Button onClick={saveProfile} disabled={saving} className="h-11 rounded-xl bg-[#35d879] px-6 font-bold text-[#04120a] hover:bg-[#52e98f]">
                            {saving ? "Saving profile…" : "Save changes"}
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
