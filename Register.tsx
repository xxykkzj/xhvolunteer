import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Loader2, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { APP_TITLE } from "@/const";

export default function Register() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [volunteerCode, setVolunteerCode] = useState("");
  const [registered, setRegistered] = useState(false);

  const registerMutation = trpc.register.create.useMutation({
    onSuccess: (data) => {
      setVolunteerCode(data.volunteerCode);
      setRegistered(true);
      toast.success("注册成功！");
    },
    onError: (error) => {
      toast.error(`注册失败: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("请输入姓名");
      return;
    }
    registerMutation.mutate({ name, phone: phone || undefined });
  };

  if (registered) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">注册成功！</CardTitle>
            <CardDescription>请妥善保管您的志愿者编号</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">您的志愿者编号</p>
              <p className="text-2xl font-bold text-amber-900 font-mono">{volunteerCode}</p>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>✓ 请记住此编号，用于后续登录系统</p>
              <p>✓ 您的初始等级为"欢喜地"（第一地）</p>
              <p>✓ 参与义工服务可获得积分和时长</p>
              <p>✓ 累计70小时可获得"欢喜徽记"</p>
            </div>

            <div className="flex gap-2">
              <Button asChild className="flex-1">
                <a href="/shop">浏览奖励商城</a>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <a href="/">返回首页</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{APP_TITLE}</CardTitle>
          <CardDescription>志愿者注册</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">姓名 *</Label>
              <Input
                id="name"
                type="text"
                placeholder="请输入您的姓名"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={registerMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">手机号（选填）</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="请输入手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                pattern="^1[3-9]\d{9}$"
                disabled={registerMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">用于接收通知（可选）</p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  注册中...
                </>
              ) : (
                "立即注册"
              )}
            </Button>

            <div className="text-center">
              <Button variant="link" asChild>
                <a href="/">返回首页</a>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
