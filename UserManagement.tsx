import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Loader2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { hasRoleLevel } from "../../../shared/constants";

export default function UserManagement() {
  const { user, loading } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    volunteerCode: "",
    birthday: "",
    role: "volunteer" as "volunteer" | "leader" | "manager" | "admin",
    engagementType: "volunteer_shortterm" as "volunteer_shortterm" | "temple_worker",
    departmentId: 1,
    startDate: new Date().toISOString().split("T")[0],
  });

  const { data: users, isLoading: loadingUsers, refetch } = trpc.admin.users.list.useQuery();
  const { data: departments } = trpc.departments.list.useQuery();
  const createUserMutation = trpc.admin.users.create.useMutation({
    onSuccess: () => {
      toast.success("用户创建成功");
      setDialogOpen(false);
      refetch();
      // Reset form
      setFormData({
        name: "",
        phone: "",
        volunteerCode: "",
        birthday: "",
        role: "volunteer",
        engagementType: "volunteer_shortterm",
        departmentId: 1,
        startDate: new Date().toISOString().split("T")[0],
      });
    },
    onError: (error) => {
      toast.error(error.message || "创建失败");
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user || !hasRoleLevel(user.role, "admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>权限不足</CardTitle>
            <CardDescription>仅管理员可访问此页面</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate({
      ...formData,
      birthday: formData.birthday ? new Date(formData.birthday) : undefined,
      startDate: new Date(formData.startDate),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">用户管理</h1>
            <p className="text-muted-foreground">创建和管理系统用户</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                创建用户
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>创建新用户</DialogTitle>
                <DialogDescription>填写用户基本信息和初始服务关系</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">姓名 *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">手机号</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="volunteerCode">志愿者编号 *</Label>
                      <Input
                        id="volunteerCode"
                        value={formData.volunteerCode}
                        onChange={(e) =>
                          setFormData({ ...formData, volunteerCode: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birthday">生日（用于生成初始密码）</Label>
                      <Input
                        id="birthday"
                        type="date"
                        value={formData.birthday}
                        onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        初始密码将为生日yymmdd格式（如240101）
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">角色</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value: any) => setFormData({ ...formData, role: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="volunteer">志愿者</SelectItem>
                          <SelectItem value="leader">组长</SelectItem>
                          <SelectItem value="manager">经理</SelectItem>
                          <SelectItem value="admin">管理员</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="engagementType">服务类型 *</Label>
                      <Select
                        value={formData.engagementType}
                        onValueChange={(value: any) =>
                          setFormData({ ...formData, engagementType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="volunteer_shortterm">短期义工</SelectItem>
                          <SelectItem value="temple_worker">寺院工作人员</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="departmentId">部门 *</Label>
                      <Select
                        value={formData.departmentId.toString()}
                        onValueChange={(value) =>
                          setFormData({ ...formData, departmentId: parseInt(value) })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {departments?.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id.toString()}>
                              {dept.fullPath || dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startDate">开始日期 *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    取消
                  </Button>
                  <Button type="submit" disabled={createUserMutation.isPending}>
                    {createUserMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    创建
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loadingUsers ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                所有用户 ({users?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {users?.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-sm text-muted-foreground">
                        编号: {u.volunteerCode} | 角色: {u.role}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
