import { useAuth } from "@/_core/hooks/useAuth";
import { VolunteerLoginDialog } from "@/components/VolunteerLoginDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Award, Clock, TrendingUp, Gift, Users, Calendar } from "lucide-react";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { getLevelInfo, hasRoleLevel } from "../../../shared/constants";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { data: pointsSummary, isLoading: loadingSummary } = trpc.points.summary.useQuery(
    {},
    { enabled: isAuthenticated }
  );
  const { data: rewards } = trpc.rewards.list.useQuery(undefined, { enabled: isAuthenticated });

  // Show loading while checking authentication status
  // This prevents flashing the landing page during OAuth callback
  if (loading || (loadingSummary && isAuthenticated)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Only show landing page if definitely not authenticated
  if (!isAuthenticated && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <div className="container max-w-4xl py-16">
          <div className="text-center space-y-6">
            {APP_LOGO && (
              <img src={APP_LOGO} alt={APP_TITLE} className="h-24 mx-auto" />
            )}
            <h1 className="text-4xl font-bold tracking-tight">{APP_TITLE}</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              寺院义工管理系统 · 时间银行 · 七地菩萨会员体系
            </p>
            <div className="pt-8 space-y-4">
              <div className="flex gap-4 justify-center">
                <Button asChild size="lg" className="text-lg px-8">
                  <a href="/login">登录</a>
                </Button>
              </div>
              <div className="text-center text-sm text-muted-foreground mt-4">
                <p>需要注册账号？请联系义工中心管理员</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <Card>
              <CardHeader>
                <Award className="h-8 w-8 text-primary mb-2" />
                <CardTitle>七地会员体系</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  基于累计积分的七地菩萨等级系统，从欢喜地到远行地，见证您的修行之路
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Clock className="h-8 w-8 text-primary mb-2" />
                <CardTitle>时间银行</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  记录每一分服务时长，累计70小时获得"欢喜"徽记，兑换专属奖励
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Gift className="h-8 w-8 text-primary mb-2" />
                <CardTitle>积分兑换</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  使用积分兑换结缘书籍、福田餐券、禅修体验等丰富奖励
                </p>
                <Button asChild variant="link" className="text-primary p-0 h-auto text-sm">
                  <a href="/shop">查看奖励商城 →</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const levelInfo = pointsSummary ? getLevelInfo(pointsSummary.rankLevel) : getLevelInfo(1);
  const totalHoursDisplay = pointsSummary ? Math.floor(pointsSummary.totalHours / 60) : 0;
  const totalMinutesRemainder = pointsSummary ? pointsSummary.totalHours % 60 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-6xl py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">欢迎回来，{user?.name}</h1>
            <p className="text-muted-foreground">愿您福慧增长，功德圆满</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-muted-foreground hover:text-foreground"
          >
            退出登录
          </Button>
        </div>

        {loadingSummary ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Rank and Status Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card className="md:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">当前等级</CardTitle>
                      <CardDescription>基于累计积分的会员等级</CardDescription>
                    </div>
                    <Award className="h-12 w-12 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="inline-flex items-center justify-center rounded-full px-6 py-3 text-lg font-bold bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg">
                        {levelInfo.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Level {pointsSummary?.rankLevel || 1}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-2xl font-bold">{pointsSummary?.totalPoints || 0}</span>
                      <span className="text-muted-foreground">累计积分</span>
                    </div>
                    {pointsSummary?.joyBadge && (
                      <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white">
                        ✨ 欢喜徽记
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>服务时长</CardTitle>
                  <CardDescription>累计志愿服务</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">{totalHoursDisplay}</span>
                      <span className="text-xl text-muted-foreground">小时</span>
                    </div>
                    {totalMinutesRemainder > 0 && (
                      <p className="text-sm text-muted-foreground">{totalMinutesRemainder} 分钟</p>
                    )}
                    {!pointsSummary?.joyBadge && (
                      <p className="text-xs text-muted-foreground mt-2">
                        还需 {70 - totalHoursDisplay} 小时获得欢喜徽记
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Available Rewards */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  可兑换奖励
                </CardTitle>
                <CardDescription>使用积分兑换您喜欢的奖励</CardDescription>
              </CardHeader>
              <CardContent>
                {!rewards || rewards.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">暂无可用奖励</p>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rewards.slice(0, 6).map((reward) => (
                      <Card key={reward.id} className={reward.locked ? "opacity-60" : ""}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">{reward.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{reward.pointsCost} 积分</span>
                            {reward.canRedeem ? (
                              <Badge variant="default">可兑换</Badge>
                            ) : (
                              <Badge variant="secondary">未解锁</Badge>
                            )}
                          </div>
                          {reward.requireJoyBadge && (
                            <Badge variant="outline" className="text-xs">
                              需要欢喜徽记
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-4 gap-4 mt-8">
              <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                <a href="/scheduling">
                  <Calendar className="h-5 w-5" />
                  <span>排班管理</span>
                </a>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                <a href="/profile">
                  <Users className="h-5 w-5" />
                  <span>个人中心</span>
                </a>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                <a href="/departments">
                  <Users className="h-5 w-5" />
                  <span>部门管理</span>
                </a>
              </Button>
              {user && hasRoleLevel(user.role, "admin") && (
                <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
                  <a href="/users">
                    <Users className="h-5 w-5" />
                    <span>用户管理</span>
                  </a>
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
