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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Users, Edit, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Departments() {
  const { user, isAuthenticated } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    contactPerson: "",
    contactPhone: "",
  });

  const utils = trpc.useUtils();
  const { data: departments, isLoading } = trpc.departments.list.useQuery();

  const createMutation = trpc.departments.create.useMutation({
    onSuccess: () => {
      toast.success("部门创建成功");
      setCreateOpen(false);
      setFormData({ name: "", description: "", contactPerson: "", contactPhone: "" });
      utils.departments.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "创建失败");
    },
  });

  const updateMutation = trpc.departments.update.useMutation({
    onSuccess: () => {
      toast.success("部门更新成功");
      setEditOpen(false);
      setSelectedDept(null);
      utils.departments.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "更新失败");
    },
  });

  const deleteMutation = trpc.departments.delete.useMutation({
    onSuccess: () => {
      toast.success("部门删除成功");
      utils.departments.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "删除失败");
    },
  });

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast.error("请输入部门名称");
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (dept: any) => {
    setSelectedDept(dept);
    setFormData({
      name: dept.name,
      description: dept.description || "",
      contactPerson: dept.contactPerson || "",
      contactPhone: dept.contactPhone || "",
    });
    setEditOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedDept) return;
    updateMutation.mutate({
      id: selectedDept.id,
      ...formData,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("确定要删除这个部门吗？")) {
      deleteMutation.mutate({ id });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">请先登录</p>
      </div>
    );
  }

  const canManage = user?.role === "manager" || user?.role === "admin" || user?.role === "super-admin";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container max-w-6xl py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">部门管理</h1>
            <p className="text-muted-foreground mt-2">管理寺院各个部门和组织</p>
          </div>
          {canManage && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="lg">
                  <Plus className="mr-2 h-5 w-5" />
                  创建部门
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>创建新部门</DialogTitle>
                  <DialogDescription>填写部门基本信息</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">部门名称 *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="例如：图书馆、客堂、斋堂"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">部门描述</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="部门职责和工作内容"
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="contactPerson">负责人</Label>
                    <Input
                      id="contactPerson"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      placeholder="部门负责人姓名"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="contactPhone">联系电话</Label>
                    <Input
                      id="contactPhone"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      placeholder="联系方式"
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
        ) : departments && departments.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept: any) => (
              <Card key={dept.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <CardTitle>{dept.name}</CardTitle>
                    </div>
                    {canManage && (
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(dept)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(dept.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {dept.description && (
                    <CardDescription>{dept.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {dept.contactPerson && (
                    <p className="text-sm text-muted-foreground">
                      负责人：{dept.contactPerson}
                    </p>
                  )}
                  {dept.contactPhone && (
                    <p className="text-sm text-muted-foreground">
                      电话：{dept.contactPhone}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">暂无部门</p>
              {canManage && (
                <Button className="mt-4" onClick={() => setCreateOpen(true)}>
                  创建第一个部门
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>编辑部门</DialogTitle>
              <DialogDescription>修改部门信息</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">部门名称 *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">部门描述</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-contactPerson">负责人</Label>
                <Input
                  id="edit-contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-contactPhone">联系电话</Label>
                <Input
                  id="edit-contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
