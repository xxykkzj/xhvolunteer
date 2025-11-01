import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LogIn } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function VolunteerLoginDialog() {
  const [open, setOpen] = useState(false);
  const [volunteerCode, setVolunteerCode] = useState("");
  const [password, setPassword] = useState("");
  
  const loginMutation = trpc.wechat.code2Session.useMutation({
    onSuccess: async (data) => {
      toast.success("登录成功！");
      
      // Store session info in localStorage for demonstration
      localStorage.setItem("volunteerSession", JSON.stringify(data));
      
      // Reload page to trigger authentication
      window.location.reload();
    },
    onError: (error) => {
      toast.error(error.message || "登录失败，请检查志愿者编号");
    },
  });

  const handleLogin = () => {
    if (!volunteerCode.trim()) {
      toast.error("请输入志愿者编号");
      return;
    }
    if (!password.trim()) {
      toast.error("请输入密码");
      return;
    }
    
    loginMutation.mutate({ code: volunteerCode.trim(), password: password.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" variant="outline" className="text-lg px-8">
          <LogIn className="mr-2 h-5 w-5" />
          志愿者登录
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>志愿者登录</DialogTitle>
          <DialogDescription>
            请输入您的志愿者编号和密码进行登录。初始密码为生日yymmdd格式。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="volunteerCode">志愿者编号</Label>
            <Input
              id="volunteerCode"
              placeholder="例如: V1730380123456"
              value={volunteerCode}
              onChange={(e) => setVolunteerCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleLogin();
                }
              }}
              disabled={loginMutation.isPending}
            />
            <p className="text-sm text-muted-foreground">
              注册时获得的唯一志愿者编号
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              placeholder="初始密码为生日yymmdd"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleLogin();
                }
              }}
              disabled={loginMutation.isPending}
            />
            <p className="text-sm text-muted-foreground">
              首次登录后请及时修改密码
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            onClick={handleLogin}
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            登录
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
