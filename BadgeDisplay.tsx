import { Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface BadgeItem {
  userBadge: {
    id: number;
    grantedAt: Date;
    metadata?: any;
  };
  badge: {
    id: number;
    code: string;
    name: string;
    description: string | null;
    iconUrl: string | null;
    category: "service_hours" | "engagement_duration" | "special";
  } | null;
}

interface BadgeDisplayProps {
  badges: BadgeItem[];
  variant?: "compact" | "detailed";
}

export function BadgeDisplay({ badges, variant = "compact" }: BadgeDisplayProps) {
  if (badges.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>暂无徽章</p>
        <p className="text-sm mt-1">继续服务以获得更多徽章</p>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="flex flex-wrap gap-2">
        {badges.map((item) => {
          if (!item.badge) return null;
          return (
            <Tooltip key={item.userBadge.id}>
              <TooltipTrigger>
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 px-3 py-1.5 text-sm"
                >
                  <Award className="w-4 h-4" />
                  {item.badge.name}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="max-w-xs">
                  <p className="font-semibold">{item.badge.name}</p>
                  {item.badge.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.badge.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    获得时间：{new Date(item.userBadge.grantedAt).toLocaleDateString()}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    );
  }

  // Detailed variant
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {badges.map((item) => {
        if (!item.badge) return null;
        return (
          <Card key={item.userBadge.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Award className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold">{item.badge.name}</h3>
                {item.badge.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.badge.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {getCategoryLabel(item.badge.category)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.userBadge.grantedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case "service_hours":
      return "服务时长";
    case "engagement_duration":
      return "服务年限";
    case "special":
      return "特殊贡献";
    default:
      return category;
  }
}
