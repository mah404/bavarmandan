"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Icon } from "@/components/ui/icon";

export const BenefitsCard = () => {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchDescription = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/benefit?id=akhlagh");
      const data = await res.json();
      setDescription(data.description);
    } catch {
      setDescription("خطا در دریافت اطلاعات.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card
        onClick={() => {
          fetchDescription();
          setOpen(true);
        }}
        className="cursor-pointer hover:bg-background transition"
      >
        <CardHeader>
          <div className="flex justify-between">
            <Icon name="Wallet" size={32} color="hsl(var(--primary))" />
            <span className="text-5xl text-muted-foreground/15 font-medium">04</span>
          </div>
          <CardTitle>مباحث متفرقه</CardTitle>
        </CardHeader>
     
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>مباحث اخلاقی</SheetTitle>
            <SheetDescription>
              {loading ? "در حال بارگذاری..." : description}
            </SheetDescription>
      
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </>
  );
};
