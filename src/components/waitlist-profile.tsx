import { useEffect, useState, type RefObject } from "react";
import {
  ArrowRight,
  Copy,
  Crown,
  Gift,
  MessageCircle,
  Rocket,
  Share2,
  Target,
  Twitter,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FOUNDING_REWARDS,
  buildReferralShareUrl,
  formatRewardRange,
  getFoundingReward,
  type FoundingReward,
  type WaitlistReward,
  type WaitlistStatus,
} from "@/lib/waitlist-utils";

type ProfileTab = "overview" | "referrals" | "rewards";

type WaitlistProfileProps = {
  profileRef: RefObject<HTMLDivElement | null>;
  done: "joined" | "exists";
  status: WaitlistStatus | null;
  currentPosition: number;
  currentReward: WaitlistReward | FoundingReward | undefined;
  referralCount: number;
  userType: string;
  initialTab?: ProfileTab;
  onContinueToAccount: () => void;
  onJoinAnother: () => void;
};

export function WaitlistProfile({
  profileRef,
  done,
  status,
  currentPosition,
  currentReward,
  referralCount,
  userType,
  initialTab = "overview",
  onContinueToAccount,
  onJoinAnother,
}: WaitlistProfileProps) {
  const [profileTab, setProfileTab] = useState<ProfileTab>(initialTab);
  const [copied, setCopied] = useState(false);
  const [shareLink, setShareLink] = useState("");

  useEffect(() => {
    setProfileTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const token = status?.referral_token;
    if (!token) {
      setShareLink("");
      return;
    }

    setShareLink(buildReferralShareUrl(token));
  }, [status?.referral_token]);

  const copyShareLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success("Referral link copied");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Unable to copy automatically");
    }
  };

  const shareToWhatsApp = () => {
    if (!shareLink) return;
    const text = `Join Tile and get early access: ${shareLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  const shareToTwitter = () => {
    if (!shareLink) return;
    const text = `Join Tile waitlist and get early access: ${shareLink}`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const rewardPlan =
    (currentReward && "reward_plan" in currentReward ? currentReward.reward_plan : undefined) ??
    getFoundingReward(currentPosition).plan;
  const rewardBenefit =
    (currentReward && "benefit" in currentReward ? currentReward.benefit : undefined) ??
    getFoundingReward(currentPosition).detail;
  const isVendor = userType === "seller" || userType === "artisan" || userType === "all";

  return (
    <div className="py-8">
      <div className="text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
          <Crown className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-3xl font-black tracking-tight">
          {done === "exists"
            ? "You're already a Tile founding member."
            : "You're officially on the list."}
        </h2>
        <p className="mt-2 max-w-xl mx-auto text-muted-foreground">
          {done === "exists"
            ? "Your place is saved. Refreshing this page won't remove you from the wait-list."
            : "Your place has been saved. Keep your referral link and we'll contact you before launch."}
        </p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border bg-muted/30 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Your place</p>
          <p className="mt-1 text-3xl font-black">#{currentPosition}</p>
        </div>
        <div className="rounded-2xl border bg-primary/5 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Your reward</p>
          <p className="mt-1 text-xl font-black text-primary">{rewardPlan.toUpperCase()}</p>
          <p className="mt-1 text-xs text-muted-foreground">{rewardBenefit}</p>
        </div>
        <div className="rounded-2xl border bg-muted/30 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Referrals</p>
          <p className="mt-1 text-3xl font-black">{referralCount}</p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <div className="flex items-start gap-3">
          <Gift className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <h3 className="font-bold">The earlier you join, the more you unlock.</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Your position determines your founding-member reward at launch.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {FOUNDING_REWARDS.slice(0, 3).map((tier) => {
            const TierIcon = tier.icon;
            const active = currentPosition >= tier.min && currentPosition <= tier.max;
            return (
              <div
                key={`preview-${tier.min}`}
                className={`rounded-xl border p-3 ${active ? "border-primary bg-background" : "bg-background/60"}`}
              >
                <TierIcon
                  className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`}
                />
                <p className="mt-2 text-xs font-bold">{tier.title}</p>
                <p className="text-sm font-black">{tier.plan}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{tier.detail}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div
        ref={profileRef}
        id="member-profile"
        className="mt-5 scroll-mt-24 rounded-2xl border bg-background p-5"
      >
        <div className="flex flex-wrap gap-2 rounded-xl bg-muted/50 p-1">
          {[
            { value: "overview" as const, label: "Overview", icon: Target },
            { value: "referrals" as const, label: "Referrals", icon: Share2 },
            { value: "rewards" as const, label: "Rewards", icon: Gift },
          ].map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setProfileTab(tab.value)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
                  profileTab === tab.value
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
                }`}
              >
                <TabIcon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {profileTab === "overview" && (
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setProfileTab("referrals")}
              className="rounded-xl border bg-muted/30 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Referrals</p>
              <p className="mt-1 text-3xl font-black">{referralCount}</p>
              <p className="mt-1 text-xs text-primary">View referral tools →</p>
            </button>
            <button
              type="button"
              onClick={() => setProfileTab("rewards")}
              className="rounded-xl border bg-primary/5 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Reward</p>
              <p className="mt-1 text-xl font-black text-primary">{rewardPlan.toUpperCase()}</p>
              <p className="mt-1 text-xs text-primary">View reward tiers →</p>
            </button>
            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Position</p>
              <p className="mt-1 text-3xl font-black">#{currentPosition}</p>
              <p className="mt-1 text-xs text-muted-foreground">Your current queue spot</p>
            </div>
          </div>
        )}

        {profileTab === "referrals" && (
          <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Share2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold">Grow your Tile network</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Invite people with your personal link. New wait-list members are attributed to
                  your referral code.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border bg-background p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Your referral code
              </p>
              <p className="mt-1 font-mono text-xl font-black tracking-wider">
                {status?.referral_token ?? "—"}
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Button
                  onClick={copyShareLink}
                  variant="outline"
                  disabled={!shareLink}
                  className="flex-1"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  {copied ? "Copied" : "Copy invite link"}
                </Button>
                <Button onClick={shareToWhatsApp} variant="outline" disabled={!shareLink}>
                  <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                </Button>
                <Button onClick={shareToTwitter} variant="outline" disabled={!shareLink}>
                  <Twitter className="mr-2 h-4 w-4" /> X
                </Button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border bg-background p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Successful referrals
                </p>
                <p className="mt-1 text-3xl font-black">{referralCount}</p>
              </div>
              <div className="rounded-xl border bg-background p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Your position
                </p>
                <p className="mt-1 text-3xl font-black">#{currentPosition}</p>
              </div>
            </div>
          </div>
        )}

        {profileTab === "rewards" && (
          <div className="mt-5">
            <div className="mb-4">
              <h3 className="font-bold">Your founding reward</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Your queue position determines which launch reward you currently qualify for.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {FOUNDING_REWARDS.map((tier) => {
                const TierIcon = tier.icon;
                const active = currentPosition >= tier.min && currentPosition <= tier.max;
                return (
                  <div
                    key={`tier-${tier.min}`}
                    className={`rounded-xl border p-4 ${active ? "border-primary bg-primary/5" : "bg-muted/20"}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <TierIcon
                          className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`}
                        />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {formatRewardRange(tier)}
                        </span>
                      </div>
                      {active && <Badge>Current</Badge>}
                    </div>
                    <p className="mt-2 text-lg font-black">{tier.plan}</p>
                    <p className="text-sm text-muted-foreground">{tier.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-start gap-3">
          <Rocket className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <h3 className="font-bold">
              {isVendor ? "Prepare before launch" : "Get ready before launch"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {isVendor
                ? "Create your Tile account and prepare your products, shop or artisan profile privately while Admin reviews the marketplace."
                : "Create your Tile account now so you're ready for early access when Tile launches."}
            </p>
          </div>
        </div>
        <Button type="button" size="lg" className="mt-4 w-full" onClick={onContinueToAccount}>
          Create My Tile Account
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="mt-6 text-center">
        <Button variant="ghost" onClick={onJoinAnother}>
          Join another person instead
        </Button>
      </div>
    </div>
  );
}
