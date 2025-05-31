"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { BookOpenText } from "lucide-react";


export const BenefitTajrid = () => {
  const [open, setOpen] = useState(false);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && sections.length === 0) {
      setLoading(true);
      fetch("/api/tajrid")
        .then((res) => res.json())
        .then((data) => setSections(data))
        .catch(() => console.error("❌ Error loading PDFs"))
        .finally(() => setLoading(false));
    }
  }, [open]);
  

  return (
    <>
    <Card onClick={() => setOpen(true)} className="cursor-pointer hover:bg-background transition">

        <CardHeader>
          <div className="flex justify-between">
            <BookOpenText size={32} color="hsl(var(--primary))" />
            <span className="text-5xl text-muted-foreground/15 font-medium">
              02
            </span>
          </div>
          <CardTitle>کتاب تجرید الاعتقاد</CardTitle>
        </CardHeader>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="max-h-screen overflow-y-auto">
  <SheetHeader>
    <SheetTitle>کتاب تجرید الاعتقاد</SheetTitle>
    <SheetDescription>
      {loading ? (
        <p className="text-muted-foreground mt-4">در حال بارگذاری فایل‌ها...</p>
      ) : (
        <Accordion type="single" collapsible className="w-full mt-4">
          {sections.map((section: any) => (
            <AccordionItem key={section.id} value={section.id}>
              <AccordionTrigger>{section.title}</AccordionTrigger>
              <AccordionContent>
                <a href={section.pdfUrl} download>
                  <Button>PDF</Button>
                </a>
                
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </SheetDescription>
  </SheetHeader>
</SheetContent>

      </Sheet>
    </>
  );
};
