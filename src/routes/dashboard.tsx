import { BankTransferPanel, useMyPaymentRequests, isOpenRequest } from "@/components/billing/bank-transfer-checkout";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { formatNaira, LOCATIONS } from "@/lib/categories";
import {
  Heart,
  Package,
  Wallet,
  Plus,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Store,
  Share2,
  Crown,
  AlertTriangle,
  RefreshCw,
  Pencil,
  Trash2,
  Eye,
  MousePointerClick,
  Copy as CopyIcon,
  Download,
  Briefcase,
  MessageCircle,
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { uploadKyc } from "@/lib/storage";
import { TierBadge } from "@/components/tier-badge";
import { QRCodeSVG } from "qrcode.react";
import { useConfirmAction } from "@/components/confirm-action-provider";
import { showError } from "@/lib/user-feedback";
import { rpcUntyped } from "@/lib/waitlist-rpc";
import {
  useTileEntitlements,
  isTopAdsEntitled,
  hasVendorAnalytics,
  hasAdvancedVendorAnalytics,
  hasProOrVipEntitlement,
  hasVipEntitlement,
  type TileEntitlements,
} from "@/hooks/use-tile-entitlements";
import { TopAdUsageCard } from "@/components/top-ad-usage-card";
import { VendorAnalyticsCard } from "@/components/vendor-analytics";
import { CustomerInquiryDashboard } from "@/components/customer-inquiry-dashboard";
import { SocialSharingTools } from "@/components/social-sharing-tools";
import { SupportCenter } from "@/components/support-center";
import {
  VipAiAssistantSection,
  VipAnalyticsSection,
  VipIntegrationsSection,
  VipStaffSection,
} from "@/components/vip-merchant-tools";
import { useMerchantStaffContext } from "@/hooks/use-merchant-staff-context";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard — Tile" }],
    links: [
      {
        rel: "icon",
        href: "https://res.cloudinary.com/dbozz4sgv/image/upload/v1781367385/tile-logo_vv2c8v.jpg",
      },
    ],
  }),
  component: Dashboard,
});

const DASHBOARD_CARD_CLASS =
  "border-[#1b3b2a] bg-gradient-to-br from-[#10241a] to-[#0b1a13] text-slate-100 shadow-[0_18px_48px_rgba(0,0,0,0.16)] transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-emerald-300/20";

function Dashboard() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [activeDashboardTab, setActiveDashboardTab] = useState("buyer");
  const {
    data: entitlements,
    isLoading: entitlementsLoading,
    isError: entitlementsError,
    refetch: refetchEntitlements,
  } = useTileEntitlements();
  const staffContextQuery = useMerchantStaffContext(user?.id);
  const staffContext = staffContextQuery.data;
  const isMerchantStaff = staffContext?.is_staff === true && !!staffContext.owner_id;
  const workspaceOwnerId = isMerchantStaff ? staffContext.owner_id! : user?.id;
  const merchantWorkspace = profile?.is_merchant === true || isMerchantStaff;
  const isVip = hasVipEntitlement(entitlements);
