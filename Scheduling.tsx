import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Calendar, Clock, Users, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

export default function Scheduling() {
  const { user, isAuthenticated } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [formData, setFormData] = useState({
    scheduleDate: "",
    departmentId: "",
    shiftStart: "",
    shiftEnd: "",
    requiredCount: "1",
  });
  const [assignUserId, setAssignUserId] = useState("");

  const utils = trpc.useUtils();
  const { data: schedules, isLoading } = trpc.schedules.list.useQuery();
  const { data: departments } = trpc.departments.list.useQuery();
  const { data: volunteers } = trpc.users.list.useQuery();

  const createMutation = trpc.schedules.create.useMutation({
    onSuccess: () => {
      toast.success("排班创建成功");
      setCreateOpen(false);
      setFormData({
        scheduleDate: "",
        departmentId: "",
        shiftStart: "",
        shiftEnd: "",
        requiredCount: "1",
      });
      utils.schedules.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "创建失败");
    },
  });

  const assignMutation = trpc.schedules.assign.useMutation({
    onSuccess: () => {
      toast.success("志愿者分配成功");
      setAssignOpen(false);
      setAssignUserId("");
      utils.schedules.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "分配失败");
    },
  });

  const confirmMutation = trpc.schedules.confirmAttendance.useMutation({
    onSuccess: () => {
      toast.success("考勤确认成功，积分和时长已记录");
      utils.schedules.list.invalidate();
      utils.points.summary.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "确认失败");
    },
  });

  const handleCreate = () => {
    if (!formData.scheduleDate || !formData.departmentId || !formData.shiftStart || !formData.shiftEnd) {
      toast.error("请填写所有必填字段");
      return;
    }
    createMutation.mutate({
      scheduleDate: formData.scheduleDate,
      departmentId: parseInt(formData.departmentId),
      shiftStart: formData.shiftStart,
      shiftEnd: formData.shiftEnd,
      requiredCount: parseInt(formData.requiredCount),
    });
  };

  const handleAssign = () => {
    if (!selectedSchedule || !assignUserId) {
      toast.error("请选择志愿者");
      return;
    }
    assignMutation.mutate({
      scheduleDayId: selectedSchedule.id,
      userId: parseInt(assignUserId),
    });
  };

  const handleConfirm = (scheduleId: number, userId: number) => {
    if (confirm("确认该志愿者已完成服务？")) {
      confirmMutation.mutate({
        scheduleDayId: scheduleId,
        userId,
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">请先登录</p>
      </div>
    );
  }

  const canManage = user?.role === "leader" || user?.role === "manager" || user?.role === "admin" || user?.role === "super-admin";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container max-w-6xl py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">排班管理</h1>
            <p className="text-muted-foreground mt-2">创建排班计划并分配志愿者</p>
          </div>
          {canManage && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="lg">
                  <Plus className="mr-2 h-5 w-5" />
                  创建排班
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>创建新排班</DialogTitle>
                  <DialogDescription>设置排班日期、部门和时间</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="scheduleDate">日期 *</Label>
                    <Input
                      id="scheduleDate"
                      type="date"
                      value={formData.scheduleDate}
                      onChange={(e) => setFormData({ ...formData, scheduleDate: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="departmentId">部门 *</Label>
                    <Select
                      value={formData.departmentId}
                      onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择部门" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments?.map((dept: any) => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="shiftStart">开始时间 *</Label>
                      <Input
                        id="shiftStart"
                        type="time"
                        value={formData.shiftStart}
                        onChange={(e) => setFormData({ ...formData, shiftStart: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="shiftEnd">结束时间 *</Label>
                      <Input
                        id="shiftEnd"
                        type="time"
                        value={formData.shiftEnd}
                        onChange={(e) => setFormData({ ...formData, shiftEnd: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="requiredCount">需要人数</Label>
                    <Input
                      id="requiredCount"
                      type="number"
                      min="1"
                      value={formData.requiredCount}
                      onChange={(e) => setFormData({ ...formData, requiredCount: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreate} disabled={createMutation.isPending}>
                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    创建
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : schedules && schedules.length > 0 ? (
          <div className="grid gap-6">
            {schedules.map((schedule: any) => (
              <Card key={schedule.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        {format(new Date(schedule.scheduleDate), "yyyy年MM月dd日 EEEE", { locale: zhCN })}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {schedule.shiftStart} - {schedule.shiftEnd}
                          </span>
                          <span>部门: {schedule.departmentName || "未知"}</span>
                        </div>
                      </CardDescription>
                    </div>
                    {canManage && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedSchedule(schedule);
                          setAssignOpen(true);
                        }}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        分配志愿者
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {schedule.assignments && schedule.assignments.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">已分配志愿者:</p>
                      {schedule.assignments.map((assignment: any) => (
                        <div
                          key={assignment.id}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{assignment.userName || `用户 ${assignment.userId}`}</span>
                            {assignment.attended && (
                              <span className="flex items-center gap-1 text-green-600 text-sm">
                                <CheckCircle className="h-4 w-4" />
                                已确认
                              </span>
                            )}
                          </div>
                          {canManage && !assignment.attended && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleConfirm(schedule.id, assignment.userId)}
                            >
                              确认考勤
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">暂无分配</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">暂无排班</p>
              {canManage && (
                <Button className="mt-4" onClick={() => setCreateOpen(true)}>
                  创建第一个排班
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Assign Dialog */}
        <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>分配志愿者</DialogTitle>
              <DialogDescription>
                {selectedSchedule && `${format(new Date(selectedSchedule.scheduleDate), "yyyy年MM月dd日", { locale: zhCN })} ${selectedSchedule.shiftStart}-${selectedSchedule.shiftEnd}`}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="assignUserId">选择志愿者</Label>
                <Select value={assignUserId} onValueChange={setAssignUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择志愿者" />
                  </SelectTrigger>
                  <SelectContent>
                    {volunteers?.map((volunteer: any) => (
                      <SelectItem key={volunteer.id} value={volunteer.id.toString()}>
                        {volunteer.name} ({volunteer.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAssign} disabled={assignMutation.isPending}>
                {assignMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                分配
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
