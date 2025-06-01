"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

// Update this interface to match your actual API data
interface Maktobat {
  id: string;
  title: string;
  content: string;
  pdfUrl: string;
  audioUrl?: string; // optional
}

export const BenefitMaktobat = () => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [maktobats, setMaktobats] = useState<Maktobat[]>([]);

const handleOpen = (value: boolean) => {
  setOpen(value);
  if (value && maktobats.length === 0) {
    setLoading(true); // 👈 show loading while fetching
    fetch("/api/maktobats")
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => {
        const transformed = data.map((item: any) => ({
          id: item.id,
          title: item.title,
          content: item.content,
          pdfUrl: item.pdfUrl,
          audioUrl: item.audioUrl || null,
        }));
        setMaktobats(transformed);
      })
      .catch((err) => {
        console.error("Failed to fetch maktobats:", err);
      })
      .finally(() => setLoading(false)); // 👈 done loading
  }
};

  return (
    <>
 <Card
  onClick={() => handleOpen(true)} // 🔄 trigger fetch + open
  className="cursor-pointer hover:bg-background transition"
>
  <CardHeader>
    <div className="flex justify-between">
      <Icon name="Blocks" size={32} color="hsl(var(--primary))" />
      <span className="text-5xl text-muted-foreground/15 font-medium">01</span>
    </div>
    <CardTitle>برهان امکان و وجوب</CardTitle>
  </CardHeader>
</Card>


      <Sheet open={open} onOpenChange={handleOpen}>
    <SheetContent className="max-h-screen overflow-y-auto">
  <SheetHeader>
    <SheetTitle>برهان امکان و وجوب</SheetTitle>
    <SheetDescription className="mb-4">
      لیست کامل مکتوبات:
    </SheetDescription>
  </SheetHeader>

  {loading ? (
    <div className="text-muted-foreground px-4 py-6">در حال بارگذاری فایل‌ها...</div>
  ) : (
    <Accordion type="single" collapsible className="w-full">
      {maktobats.map((maktobat) => (
        <AccordionItem key={maktobat.id} value={maktobat.id}>
          <AccordionTrigger>{maktobat.title}</AccordionTrigger>
          <AccordionContent>
            <div className="mb-4 pb-2">
              <p className="text-sm">{maktobat.content}</p>
              <div className="flex gap-2 mt-2">
                <a href={maktobat.pdfUrl} download>
                  <Button size="sm" className="mr-2">PDF</Button>
                </a>
                {maktobat.audioUrl && (
                  <Button size="sm" onClick={() => new Audio(maktobat.audioUrl!).play()}>
                    Mp3
                  </Button>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )}
</SheetContent>

      </Sheet>
    </>
  );
};
