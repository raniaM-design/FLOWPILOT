"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  email: string;
  name?: string;
}

interface UserMentionDisplayProps {
  userIds: string[];
  users: User[];
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function UserMentionDisplay({
  userIds,
  users,
  className,
  size = "md",
}: UserMentionDisplayProps) {
  const mentionedUsers = users.filter((u) => userIds.includes(u.id));

  if (mentionedUsers.length === 0) {
    return null;
  }

  const getInitials = (email: string) => {
    return email
      .split("@")[0]
      .split(".")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const sizeClasses = {
    sm: "w-5 h-5 text-xs",
    md: "w-6 h-6 text-xs",
    lg: "w-8 h-8 text-sm",
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {mentionedUsers.map((user) => (
        <Badge
          key={user.id}
          variant="secondary"
          className="flex items-center gap-2 px-2 py-1"
        >
          <Avatar className={cn(sizeClasses[size])}>
            <AvatarFallback className="bg-blue-100 text-blue-700">
              {getInitials(user.email)}
            </AvatarFallback>
          </Avatar>
          <span className={cn(
            size === "sm" && "text-xs",
            size === "md" && "text-xs",
            size === "lg" && "text-sm"
          )}>
            {user.name || user.email.split("@")[0]}
          </span>
        </Badge>
      ))}
    </div>
  );
}

