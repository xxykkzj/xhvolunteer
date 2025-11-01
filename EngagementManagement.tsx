import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Users, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { hasRoleLevel } from "../../../shared/constants";

export default function EngagementManagement() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    userId: "",
    type: "volunteer_shortterm" as "volunteer_shortterm" | "temple_worker",
    departmentId: 1,
    effectiveFrom: new Date().toISOString().split("T")[0],
    changeReason: "",
  });

  const { data: departments } = trpc.departments.list.useQuery();

  const updateEngagementMutation = trpc.engagements.update.useMutation({
    onSuccess: () => {
      toast.success("Engagement更新成功");
      setUpdateDialogOpen(false);
      setFormData({
        userId: "",
        type: "volunteer_shortterm",
        departmentId: 1,
        effectiveFrom: new Date().toISOString().split("T")[0],
        changeReason: "",
      });
    },
    onError: (error) => {
      toast.error(error.message || "Engagement更新失败");
    },
  });

  if (loading) {
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

  const handleSubmit = () => {
    if (!formData.userId || !formData.changeReason) {
      toast.error("请填写完整信息");
      return;
    }

    updateEngagementMutation.mutate({
      userId: Number(formData.userId),
      type: formData.type,
      departmentId: formData.departmentId,
      effectiveFrom: new Date(formData.effectiveFrom),
      changeReason: formData.changeReason,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回首页
        </Button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Engagement管理</h1>
            <p className="text-muted-foreground mt-2">
              管理用户的义工/寺工关系，系统会自动记录历史变更
            </p>
          </div>
          <Button onClick={() => setUpdateDialogOpen(true)}>
            <Users className="mr-2 h-4 w-4" />
            更新Engagement
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>功能说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">义工类型</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>
                  <strong>短期义工 (volunteer_shortterm)</strong>: 临时志愿者，服务期较短
                </li>
                <li>
                  <strong>寺院工作人员 (temple_worker)</strong>:
                  长期服务人员，承担更多责任，享有薪资（由财务部管理）
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">历史追踪</h3>
              <p className="text-sm text-muted-foreground">
                每次更新Engagement时，系统会自动保存历史记录，用于：
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mt-2">
                <li>计算"寺工满1年"等基于时间的徽章资格</li>
                <li>审计和追溯用户的服务历史</li>
                <li>生成统计报表</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">积分规则</h3>
              <p className="text-sm text-muted-foreground">
                所有人员（义工和寺工）的积分率相同，均为1小时=10积分。寺工的薪资由财务部单独管理，不影响积分系统。
              </p>
            </div>
          </CardContent>
        </Card>

        <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>更新Engagement</DialogTitle>
              <DialogDescription>
                更新用户的义工/寺工关系。系统会自动记录历史变更。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="userId">用户ID *</Label>
                <Input
                  id="userId"
                  type="number"
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">服务类型 *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "volunteer_shortterm" | "temple_worker") =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="volunteer_shortterm">短期义工</SelectItem>
                    <SelectItem value="temple_worker">寺院工作人员</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="departmentId">部门 *</Label>
                <Select
                  value={String(formData.departmentId)}
                  onValueChange={(value) =>
                    setFormData({ ...formData, departmentId: Number(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departments?.map((dept) => (
                      <SelectItem key={dept.id} value={String(dept.id)}>
                        {dept.fullPath || dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="effectiveFrom">生效日期 *</Label>
                <Input
                  id="effectiveFrom"
                  type="date"
                  value={formData.effectiveFrom}
                  onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="changeReason">变更原因 *</Label>
                <Input
                  id="changeReason"
                  placeholder="例如：转为正式寺工、部门调动等"
                  value={formData.changeReason}
                  onChange={(e) => setFormData({ ...formData, changeReason: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setUpdateDialogOpen(false)}
                disabled={updateEngagementMutation.isPending}
              >
                取消
              </Button>
              <Button onClick={handleSubmit} disabled={updateEngagementMutation.isPending}>
                {updateEngagementMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                确认更新
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
