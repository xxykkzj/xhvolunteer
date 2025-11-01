import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Copy, Home } from "lucide-react";
import { toast } from "sonner";

export default function RedemptionSuccess() {
  const [, params] = useRoute("/redemption/success/:code");
  const [, setLocation] = useLocation();
  const code = params?.code;

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!code) {
      setLocation("/shop");
    }
  }, [code, setLocation]);

  const handleCopy = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("兑换码已复制");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!code) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">兑换成功！</CardTitle>
          <CardDescription>请向工作人员出示以下兑换码</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Redemption Code */}
          <div className="bg-muted p-6 rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-2">兑换码</p>
            <p className="text-3xl font-mono font-bold tracking-wider break-all">
              {code}
            </p>
          </div>

          {/* QR Code Placeholder */}
          <div className="bg-white border-2 border-dashed border-muted p-8 rounded-lg">
            <div className="aspect-square bg-muted rounded flex items-center justify-center">
              <p className="text-sm text-muted-foreground text-center px-4">
                二维码
                <br />
                <span className="text-xs">(扫码核销)</span>
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-900">
              <strong>使用说明：</strong>
              <br />
              1. 请向寺院工作人员出示此兑换码
              <br />
              2. 工作人员核销后即可使用奖励
              <br />
              3. 每个兑换码仅可使用一次
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={handleCopy} variant="outline" className="flex-1">
              <Copy className="h-4 w-4 mr-2" />
              {copied ? "已复制" : "复制兑换码"}
            </Button>
            <Button asChild className="flex-1">
              <a href="/">
                <Home className="h-4 w-4 mr-2" />
                返回首页
              </a>
            </Button>
          </div>

          <Button asChild variant="link" className="w-full">
            <a href="/profile">查看我的兑换记录</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
