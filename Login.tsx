import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Mail, KeyRound, UserCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";

export default function Login() {
  const [, setLocation] = useLocation();
  const [emailLoginData, setEmailLoginData] = useState({ email: "", password: "" });
  const [volunteerLoginData, setVolunteerLoginData] = useState({ code: "", password: "" });

  const emailLoginMutation = trpc.emailLogin.login.useMutation({
    onSuccess: () => {
      toast.success("登录成功！");
      window.location.href = "/"; // Full page reload to refresh auth state
    },
    onError: (error) => {
      toast.error(error.message || "登录失败，请检查邮箱和密码");
    },
  });

  const volunteerLoginMutation = trpc.wechat.code2Session.useMutation({
    onSuccess: () => {
      toast.success("登录成功！");
      window.location.href = "/"; // Full page reload to refresh auth state
    },
    onError: (error) => {
      toast.error(error.message || "登录失败，请检查志愿者编号和密码");
    },
  });

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailLoginData.email || !emailLoginData.password) {
      toast.error("请填写邮箱和密码");
      return;
    }
    emailLoginMutation.mutate(emailLoginData);
  };

  const handleVolunteerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!volunteerLoginData.code || !volunteerLoginData.password) {
      toast.error("请填写志愿者编号和密码");
      return;
    }
    volunteerLoginMutation.mutate(volunteerLoginData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          {APP_LOGO && (
            <img
              src={APP_LOGO}
              alt={APP_TITLE}
              className="h-16 w-16 mx-auto object-contain"
            />
          )}
          <div>
            <CardTitle className="text-2xl">{APP_TITLE}</CardTitle>
            <CardDescription>登录您的账号</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">
                <Mail className="h-4 w-4 mr-2" />
                邮箱登录
              </TabsTrigger>
              <TabsTrigger value="volunteer">
                <UserCircle className="h-4 w-4 mr-2" />
                志愿者登录
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱地址</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={emailLoginData.email}
                    onChange={(e) =>
                      setEmailLoginData({ ...emailLoginData, email: e.target.value })
                    }
                    disabled={emailLoginMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-password">密码</Label>
                  <Input
                    id="email-password"
                    type="password"
                    placeholder="••••••••"
                    value={emailLoginData.password}
                    onChange={(e) =>
                      setEmailLoginData({ ...emailLoginData, password: e.target.value })
                    }
                    disabled={emailLoginMutation.isPending}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={emailLoginMutation.isPending}
                >
                  {emailLoginMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  登录
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  或{" "}
                  <a href={getLoginUrl()} className="text-primary hover:underline">
                    使用Manus OAuth登录
                  </a>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="volunteer">
              <form onSubmit={handleVolunteerLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="volunteer-code">志愿者编号</Label>
                  <Input
                    id="volunteer-code"
                    type="text"
                    placeholder="V001"
                    value={volunteerLoginData.code}
                    onChange={(e) =>
                      setVolunteerLoginData({ ...volunteerLoginData, code: e.target.value })
                    }
                    disabled={volunteerLoginMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="volunteer-password">密码</Label>
                  <Input
                    id="volunteer-password"
                    type="password"
                    placeholder="••••••••"
                    value={volunteerLoginData.password}
                    onChange={(e) =>
                      setVolunteerLoginData({ ...volunteerLoginData, password: e.target.value })
                    }
                    disabled={volunteerLoginMutation.isPending}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={volunteerLoginMutation.isPending}
                >
                  {volunteerLoginMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  登录
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  初始密码为您的生日（yymmdd格式）
                </div>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            需要注册账号？请联系义工中心管理员
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
