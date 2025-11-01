import { useAuth } from "@/_core/hooks/useAuth";
import { BadgeDisplay } from "@/components/BadgeDisplay";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Award, TrendingUp, Clock, Calendar, Gift } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { getLevelInfo } from "@shared/constants";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

export default function Profile() {
  const { user, isAuthenticated } = useAuth();
  const { data: summary, isLoading: summaryLoading } = trpc.points.summary.useQuery(
    {},
    { enabled: isAuthenticated }
  );
  const { data: pointHistory } = trpc.points.ledger.useQuery(
    {},
    { enabled: isAuthenticated }
  );
  const { data: badges } = trpc.badges.myBadges.useQuery(undefined, { enabled: isAuthenticated });
  const { data: engagement } = trpc.engagements.myCurrent.useQuery(undefined, { enabled: isAuthenticated });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">请先登录</p>
      </div>
    );
  }

  if (summaryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const levelInfo = summary ? getLevelInfo(summary.rankLevel) : null;
  const totalHours = summary ? summary.totalHours : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container max-w-6xl py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">个人中心</h1>
          <p className="text-muted-foreground mt-2">查看您的修行进度和服务记录</p>
        </div>

        {/* Profile Summary */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                当前等级
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-6 py-3 rounded-full text-lg font-bold">
                  {levelInfo?.name || "欢喜地"}
                </div>
                <div className="text-sm text-muted-foreground">
                  Level {summary?.rankLevel || 1}
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">累计积分</span>
                  <span className="font-bold text-lg">{summary?.totalPoints || 0} 分</span>
                </div>
                {summary && summary.joyBadge && (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                    <Gift className="h-5 w-5" />
                    <span className="font-medium">已获得喜悦徽章 🎉</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                服务时长
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalHours}</div>
              <p className="text-sm text-muted-foreground mt-1">小时</p>
              {!summary?.joyBadge && (
                <p className="text-xs text-muted-foreground mt-4">
                  还需 {70 - totalHours} 小时获得喜悦徽章
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Points History */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              积分记录
            </CardTitle>
            <CardDescription>您的积分变动历史</CardDescription>
          </CardHeader>
          <CardContent>
            {pointHistory && pointHistory.length > 0 ? (
              <div className="space-y-3">
                {pointHistory.slice(0, 10).map((record: any) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={record.pointsDelta > 0 ? "default" : "secondary"}>
                          {record.reason === "attendance_eval" && "考勤评估"}
                          {record.reason === "redeem" && "兑换奖励"}
                          {record.reason === "dept_bonus" && "部门奖励"}
                          {record.reason === "manual_adjust" && "手动调整"}
                          {record.reason === "appeal_resolve" && "申诉解决"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(record.createdAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                        </span>
                      </div>
                    </div>
                    <div className={`font-bold ${record.pointsDelta > 0 ? "text-green-600" : "text-red-600"}`}>
                      {record.pointsDelta > 0 ? "+" : ""}{record.pointsDelta} 分
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">暂无积分记录</p>
            )}
          </CardContent>
        </Card>

        {/* Badges Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              我的徽章
            </CardTitle>
            <CardDescription>您获得的荣誉徽章</CardDescription>
          </CardHeader>
          <CardContent>
            {badges ? (
              <BadgeDisplay badges={badges} variant="detailed" />
            ) : (
              <p className="text-center text-muted-foreground py-8">暂无徽章</p>
            )}
          </CardContent>
        </Card>

        {/* Current Engagement */}
        {engagement && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                当前服务状态
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant={engagement.type === "temple_worker" ? "default" : "secondary"}>
                    {engagement.type === "temple_worker" ? "寺院工作人员" : "短期义工"}
                  </Badge>
                </div>
                {engagement.title && (
                  <div>
                    <p className="text-sm text-muted-foreground">岗位</p>
                    <p className="font-medium">{engagement.title}</p>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">开始时间：</span>
                  <span>{format(new Date(engagement.startDate), "yyyy-MM-dd", { locale: zhCN })}</span>
                </div>
                {engagement.endDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">结束时间：</span>
                    <span>{format(new Date(engagement.endDate), "yyyy-MM-dd", { locale: zhCN })}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
