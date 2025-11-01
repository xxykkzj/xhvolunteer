import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { APP_TITLE, getLoginUrl } from "@/const";
import { toast } from "sonner";

export default function BonusManagement() {
  const { user, loading: authLoading } = useAuth();
  const { data: requests, isLoading, refetch } = trpc.bonus.list.useQuery({});
  const approveMutation = trpc.bonus.approve.useMutation({
    onSuccess: () => {
      toast.success("奖励积分申请已批准");
      refetch();
    },
    onError: (error) => {
      toast.error(`批准失败: ${error.message}`);
    },
  });
  const rejectMutation = trpc.bonus.reject.useMutation({
    onSuccess: () => {
      toast.success("奖励积分申请已拒绝");
      refetch();
    },
    onError: (error) => {
      toast.error(`拒绝失败: ${error.message}`);
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <h1 className="text-2xl font-bold">{APP_TITLE}</h1>
        <p className="text-muted-foreground">请先登录查看奖励积分管理</p>
        <Button asChild>
          <a href={getLoginUrl()}>登录系统</a>
        </Button>
      </div>
    );
  }

  if (user.role !== "admin" && user.role !== "super-admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <h1 className="text-2xl font-bold">权限不足</h1>
        <p className="text-muted-foreground">只有管理员可以访问此页面</p>
        <Button asChild>
          <a href="/">返回首页</a>
        </Button>
      </div>
    );
  }

  const handleApprove = (requestId: number) => {
    if (confirm("确认批准此奖励积分申请？")) {
      approveMutation.mutate({ requestId });
    }
  };

  const handleReject = (requestId: number) => {
    if (confirm("确认拒绝此奖励积分申请？")) {
      rejectMutation.mutate({ requestId });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            待审批
          </Badge>
        );
      case "admin_approved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            已批准
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            已拒绝
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <div className="container max-w-6xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">奖励积分管理</h1>
          <p className="text-muted-foreground">审批部门提交的奖励积分申请</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !requests || requests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">暂无待审批的奖励积分申请</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {requests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">
                        申请 {request.points} 积分
                      </CardTitle>
                      <CardDescription>
                        部门ID: {request.departmentId} • 月份: {request.yearMonth}
                      </CardDescription>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">申请对象</p>
                      <p className="text-base">用户ID: {request.userId}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">申请理由</p>
                      <p className="text-base">{request.reasonText}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>申请人ID: {request.createdBy}</span>
                      <span>•</span>
                      <span>
                        更新时间: {new Date(request.updatedAt).toLocaleString("zh-CN")}
                      </span>
                    </div>

                    {request.status === "pending" && (
                      <div className="flex gap-2 pt-4 border-t">
                        <Button
                          onClick={() => handleApprove(request.id)}
                          disabled={approveMutation.isPending}
                          className="flex-1"
                        >
                          {approveMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              处理中...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              批准
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleReject(request.id)}
                          disabled={rejectMutation.isPending}
                          variant="outline"
                          className="flex-1"
                        >
                          {rejectMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              处理中...
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 mr-2" />
                              拒绝
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8">
          <Button variant="outline" asChild>
            <a href="/">返回首页</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
