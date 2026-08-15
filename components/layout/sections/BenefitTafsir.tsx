"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { HoverLift } from "./reveal";

export const BenefitTafsir = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <HoverLift className="h-full">
        <Card
          onClick={() => setOpen(true)}
          className="service-tile group flex h-full min-h-[168px] cursor-pointer flex-col justify-between"
        >
          <div className="service-tile-header">
            <span className="service-tile-kicker">تفسیر</span>
            <span className="service-tile-mark" aria-hidden="true">
              <BookOpen className="size-5" />
            </span>
          </div>
          <div className="service-tile-copy">
            <h3>قرآن کریم</h3>
            <p>مجموعه ی تفسیر قرآن کریم به زبان ساده</p>
          </div>
        </Card>
      </HoverLift>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="h-dvh overflow-y-auto">
          <SheetHeader>
            <SheetTitle>تفسیر قرآن</SheetTitle>
            <SheetDescription className="mb-4"></SheetDescription>
          </SheetHeader>

          <Accordion type="single" collapsible className="mt-4 w-full" dir="rtl">
            {["تفسیر ترتیبی", "تفسیر موضوعی"].map((title, index) => (
              <AccordionItem key={title} value={`tafsir-${index + 1}`}>
                <AccordionTrigger className="text-right">
                  {title}
                </AccordionTrigger>
                <AccordionContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value={`tafsir-${index + 1}-session-1`}>
                      <AccordionTrigger className="text-right">
                        جلسه ۱
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="py-4 text-center text-lg font-semibold text-muted-foreground">
                          به زودی
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </SheetContent>
      </Sheet>
    </>
  );
};
