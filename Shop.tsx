import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, Award, Lock, CheckCircle } from "lucide-react";
import { APP_TITLE, getLoginUrl } from "@/const";
import { toast } from "sonner";

export default function Shop() {
  const { user, loading: authLoading } = useAuth();
  const { data: rewards, isLoading } = trpc.rewards.list.useQuery();
  const { data: userPoints } = trpc.points.summary.useQuery({}, { enabled: !!user });

  const redeemMutation = trpc.redeem.create.useMutation({
    onSuccess: (data) => {
      toast.success("兑换成功！");
      // Redirect to success page with code
      window.location.href = `/redemption/success/${data.code}`;
    },
    onError: (error) => {
      toast.error(`兑换失败: ${error.message}`);
    },
  });

  const handleRedeem = (rewardId: number, canRedeem: boolean) => {
    if (!user) {
      toast.error("请先登录");
      window.location.href = getLoginUrl();
      return;
    }

    if (!canRedeem) {
      toast.error("您暂时无法兑换此奖励");
      return;
    }

    if (confirm("确认兑换此奖励？")) {
      redeemMutation.mutate({ rewardId });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <div className="container max-w-6xl py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">奖励商城</h1>
          <p className="text-muted-foreground">用积分兑换寺院课程和住宿</p>
        </div>

        {/* User Points Summary */}
        {user && userPoints && (
          <Card className="mb-8 bg-gradient-to-r from-amber-100 to-amber-50 border-amber-200">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">我的积分</p>
                  <p className="text-3xl font-bold text-amber-900">{userPoints.totalPoints}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">当前等级</p>
                  <Badge className="text-base px-3 py-1">{userPoints.rankName}</Badge>
                </div>
                {userPoints.joyBadge && (
                  <div className="text-right">
                    <Award className="h-8 w-8 text-amber-600 mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">欢喜徽记</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rewards Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>