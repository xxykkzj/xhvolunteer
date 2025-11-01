import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function ChangePassword() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const changePasswordMutation = trpc.password.change.useMutation({
    onSuccess: () => {
      toast.success("密码修改成功！");
      setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      navigate("/");
    },
    onError: (error) => {
      toast.error(error.message || "密码修改失败");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("两次输入的新密码不一致");
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error("新密码长度至少为6位");
      return;
    }

    if (formData.oldPassword === formData.newPassword) {
      toast.error("新密码不能与旧密码相同");
      return;
    }

    changePasswordMutation.mutate({
      oldPassword: formData.oldPassword,
      newPassword: formData.newPassword,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    window.location.href = "/";
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl py-8">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回首页
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>修改密码</CardTitle>
            <CardDescription>
              为了账号安全，建议定期更换密码。密码长度至少为6位。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="oldPassword">当前密码</Label>
                <Input
                  id="oldPassword"
                  type="password"
                  value={formData.oldPassword}
                  onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                  required
                  disabled={changePasswordMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">新密码</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  required
                  minLength={6}
                  disabled={changePasswordMutation.isPending}
                />
                <p className="text-sm text-muted-foreground">密码长度至少为6位</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">确认新密码</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  minLength={6}
                  disabled={changePasswordMutation.isPending}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="flex-1"
                >
                  {changePasswordMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  确认修改
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                  disabled={changePasswordMutation.isPending}
                >
                  取消
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
