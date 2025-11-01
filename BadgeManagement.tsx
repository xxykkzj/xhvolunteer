import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Award, UserPlus, X, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { hasRoleLevel } from "../../../shared/constants";

export default function BadgeManagement() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();
  const [grantDialogOpen, setGrantDialogOpen] = useState(false);
  const [selectedBadgeId, setSelectedBadgeId] = useState<number | null>(null);
  const [targetUserId, setTargetUserId] = useState("");

  const { data: badges, isLoading: loadingBadges, refetch } = trpc.badges.list.useQuery();

  const grantBadgeMutation = trpc.badges.grant.useMutation({
    onSuccess: () => {
      toast.success("徽章授予成功");
      setGrantDialogOpen(false);
      setTargetUserId("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "徽章授予失败");
    },
  });

  const revokeBadgeMutation = trpc.badges.revoke.useMutation({
    onSuccess: () => {
      toast.success("徽章已撤销");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "徽章撤销失败");
    },
  });

  if (loading || loadingBadges) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !hasRoleLevel(user.role, "admin")) {
    window.location.href = "/";
    return null;
  }

  const handleGrantBadge = () => {
    if (!selectedBadgeId || !targetUserId) {
      toast.error("请填写完整信息");
      return;
    }

    grantBadgeMutation.mutate({
      userId: Number(targetUserId),
      badgeId: selectedBadgeId,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl py-8">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回首页
        </Button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">徽章管理</h1>
            <p className="text-muted-foreground mt-2">管理系统中的所有徽章和授予记录</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {badges?.map((badge) => (
            <Card key={badge.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {badge.iconUrl ? (
                      <img src={badge.iconUrl} alt={badge.name} className="w-12 h-12" />
                    ) : (
                      <Award className="w-12 h-12 text-amber-500" />
                    )}
                    <div>
                      <CardTitle className="text-lg">{badge.name}</CardTitle>
                      <div className="text-xs text-muted-foreground mt-1">
                        {badge.category === "service_hours" && "服务时长"}
                        {badge.category === "engagement_duration" && "任期时长"}
                        {badge.category === "special" && "特殊荣誉"}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{badge.description}</p>
                
                {badge.autoGrantRule && (
                  <div className="text-xs bg-muted p-2 rounded mb-4">
                    <strong>自动授予规则：</strong>
                    <pre className="mt-1 overflow-x-auto">
                      {JSON.stringify(JSON.parse(badge.autoGrantRule), null, 2)}
                    </pre>
                  </div>
                )}

                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setSelectedBadgeId(badge.id);
                    setGrantDialogOpen(true);
                  }}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  授予徽章
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={grantDialogOpen} onOpenChange={setGrantDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>授予徽章</DialogTitle>
              <DialogDescription>
                手动为用户授予徽章。请输入用户ID。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="userId">用户ID</Label>
                <Input
                  id="userId"
                  type="number"
                  placeholder="请输入用户ID"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setGrantDialogOpen(false)}
                disabled={grantBadgeMutation.isPending}
              >
                取消
              </Button>
              <Button onClick={handleGrantBadge} disabled={grantBadgeMutation.isPending}>
                {grantBadgeMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                确认授予
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
