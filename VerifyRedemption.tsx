import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Loader2, CheckCircle, XCircle, Scan } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function VerifyRedemption() {
  const { user, isAuthenticated } = useAuth();
  const [code, setCode] = useState("");
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const verifyMutation = trpc.redeem.verify.useMutation({
    onSuccess: (data) => {
      setVerificationResult(data);
      if (data.success) {
        toast.success("兑换码验证成功，已标记为已核销！");
      }
    },
    onError: (error) => {
      toast.error(error.message || "验证失败");
      setVerificationResult(null);
    },
  });

  const handleVerify = () => {
    if (!code.trim()) {
      toast.error("请输入兑换码");
      return;
    }
    setVerificationResult(null);
    verifyMutation.mutate({ code: code.trim() });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleVerify();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">请先登录以使用核销功能</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Only allow staff (leader and above) to verify
  if (user && user.role === "volunteer") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">您没有权限访问此页面</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4">
      <div className="container max-w-2xl py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="h-6 w-6" />
              兑换码核销
            </CardTitle>
            <CardDescription>扫描或输入兑换码进行验证和核销</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Input Section */}
            <div className="space-y-3">
              <Label htmlFor="code">兑换码</Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  placeholder="请输入兑换码"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="font-mono"
                />
                <Button
                  onClick={handleVerify}
                  disabled={verifyMutation.isPending || !code.trim()}
                >
                  {verifyMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "验证"
                  )}
                </Button>
              </div>
            </div>

            {/* Verification Result */}
            {verificationResult && (
              <Card
                className={
                  verificationResult.success
                    ? "border-green-500 bg-green-50"
                    : "border-red-500 bg-red-50"
                }
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-full ${
                        verificationResult.success ? "bg-green-100" : "bg-red-100"
                      }`}
                    >
                      {verificationResult.success ? (
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      ) : (
                        <XCircle className="h-8 w-8 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3
                        className={`font-bold text-lg mb-2 ${
                          verificationResult.success ? "text-green-900" : "text-red-900"
                        }`}
                      >
                        {verificationResult.success ? "验证成功" : "验证失败"}
                      </h3>
                      <p
                        className={`text-sm mb-4 ${
                          verificationResult.success ? "text-green-800" : "text-red-800"
                        }`}
                      >
                        兑换码已验证并标记为已使用
                      </p>

                      {verificationResult.success && verificationResult.order && (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">奖励名称：</span>
                            <span className="font-medium">
                              {verificationResult.order.rewardTitle}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">兑换用户：</span>
                            <span className="font-medium">
                              {verificationResult.order.userName}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">兑换时间：</span>
                            <span className="font-medium">
                              {new Date(
                                verificationResult.order.createdAt
                              ).toLocaleString("zh-CN")}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">状态：</span>
                            <span className="font-medium">
                              {verificationResult.order.status === "pending" && "待核销"}
                              {verificationResult.order.status === "fulfilled" && "已核销"}
                              {verificationResult.order.status === "cancelled" && "已取消"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Instructions */}
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>使用说明：</strong>
                <br />
                • 请用户出示兑换码或二维码
                <br />
                • 输入兑换码后点击"验证"按钮
                <br />
                • 验证成功后，系统将自动标记为已核销
                <br />
                • 每个兑换码仅可核销一次
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
