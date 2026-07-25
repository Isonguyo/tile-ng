import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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

export const Route = createFileRoute("/artisan/edit")({
    component: EditArtisanProfilePage,
});

function EditArtisanProfilePage() {
    const { profile } = useAuth();

    const [profilePhoto, setProfilePhoto] = useState<File | null>(null);

    const previewPhoto = profilePhoto
        ? URL.createObjectURL(profilePhoto)
        : profile?.profile_photo || profile?.avatar_url || "";

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

    // Images removed by the user (delete from Storage after save)
    const [deletedPortfolio, setDeletedPortfolio] = useState<string[]>([]);

    const saveProfile = async () => {
        if (!profile) return;

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
            const { error } = await supabase
                .from("profiles")
                .update({
                    full_name: form.full_name,
                    profession: form.profession,
                    bio: form.bio,
                    phone: form.phone,
                    whatsapp: form.whatsapp,
                    avatar_url: avatarUrl,
                    profile_photo: avatarUrl,
                    portfolio_images: portfolioUrls,
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

            toast.success("Profile updated successfully.");
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Could not update profile.");
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <SiteHeader />

            <div className="container mx-auto max-w-5xl px-4 py-8">
                <Card className="p-6">
                    <h1 className="text-3xl font-bold">
                        Edit Artisan Profile
                    </h1>

                    <p className="mt-2 text-muted-foreground">
                        Update your artisan profile information.
                    </p>

                    <div className="mt-8 flex flex-col items-center gap-4">

                        <img
                            src={previewPhoto}
                            alt="Profile"
                            className="h-36 w-36 rounded-full object-cover border-4 border-primary"
                        />

                        <label>
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

                            <Button asChild variant="outline">
                                <span>
                                    <Camera className="mr-2 h-4 w-4" />
                                    Change Profile Photo
                                </span>
                            </Button>
                        </label>

                    </div>

                    <div className="mt-10">

                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold">
                                    Portfolio Images
                                </h3>

                                <p className="text-sm text-muted-foreground">
                                    Showcase your best work.
                                </p>
                            </div>

                            <label>
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

                                <Button asChild>
                                    <span>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Images
                                    </span>
                                </Button>
                            </label>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {existingPortfolio.map((url) => (
                                <div
                                    key={url}
                                    className="relative group overflow-hidden rounded-lg border"
                                >
                                    <img
                                        src={url}
                                        className="aspect-square w-full object-cover"
                                    />

                                    <Button
                                        size="icon"
                                        variant="destructive"
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition"
                                        onClick={() =>
                                            setExistingPortfolio((prev) =>
                                                prev.filter((img) => img !== url)
                                            )
                                        }
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            {newPortfolio.map((file, index) => (
                                <div
                                    key={index}
                                    className="relative group overflow-hidden rounded-lg border border-primary"
                                >
                                    <img
                                        src={URL.createObjectURL(file)}
                                        className="aspect-square w-full object-cover"
                                    />

                                    <Button
                                        size="icon"
                                        variant="destructive"
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition"
                                        onClick={() =>
                                            setNewPortfolio((prev) =>
                                                prev.filter((_, i) => i !== index)
                                            )
                                        }
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>

                                    <div className="absolute bottom-0 w-full bg-primary text-primary-foreground text-xs text-center py-1">
                                        New
                                    </div>
                                </div>
                            ))}
                            {existingPortfolio.length === 0 &&
                                newPortfolio.length === 0 && (
                                    <div className="col-span-full border rounded-lg p-10 text-center text-muted-foreground">
                                        <ImageIcon className="mx-auto h-10 w-10 mb-3" />
                                        No portfolio images yet.
                                    </div>
                                )}
                        </div>
                    </div>

                    <div className="mt-8 space-y-4">
                        <div>
                            <Label>Full Name</Label>
                            <Input
                                value={form.full_name}
                                onChange={(e) =>
                                    setForm({ ...form, full_name: e.target.value })
                                }
                            />
                        </div>

                        <div>
                            <Label>Profession</Label>
                            <Input
                                value={form.profession}
                                onChange={(e) =>
                                    setForm({ ...form, profession: e.target.value })
                                }
                            />
                        </div>

                        <div>
                            <Label>Bio</Label>
                            <Textarea
                                rows={5}
                                value={form.bio}
                                onChange={(e) =>
                                    setForm({ ...form, bio: e.target.value })
                                }
                            />
                        </div>

                        <div>
                            <Label>Phone Number</Label>
                            <Input
                                value={form.phone}
                                onChange={(e) =>
                                    setForm({ ...form, phone: e.target.value })
                                }
                            />
                        </div>

                        <div>
                            <Label>WhatsApp Number</Label>
                            <Input
                                value={form.whatsapp}
                                onChange={(e) =>
                                    setForm({ ...form, whatsapp: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-8">
                        <Button onClick={saveProfile}>
                            Save Changes
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}