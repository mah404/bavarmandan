// components/layout/sections/BenefitCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { icons } from "lucide-react";

export interface BenefitCardProps {
  icon: string;
  title: string;
  description: string;
  index: number;
  onClick: () => void;
}

export const BenefitCard = ({
  icon,
  title,
  description,
  index,
  onClick,
}: BenefitCardProps) => {
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer hover:bg-background transition-all delay-75 group/number"
    >
      <CardHeader>
        <div className="flex justify-between">
          <Icon
            name={icon as keyof typeof icons}
            size={32}
            color="hsl(var(--primary))"
            className="mb-6 text-primary"
          />
          <span className="text-5xl text-muted-foreground/15 font-medium transition-all delay-75 group-hover/number:text-muted-foreground/30">
            0{index + 1}
          </span>
        </div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground">
        {description.slice(0, 60)}...
      </CardContent>
    </Card>
  );
};
