import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import LivePlayer from "@/components/layout/sections/LivePlayer";
import { Check } from "lucide-react";

export const PricingSection = () => {
  return (
    <section className="container py-24 sm:py-32 flex justify-center items-center">
      
      {/* centered card */}
      <div className="w-full max-w-3xl">
        <Card className="overflow-hidden border-2 border-primary shadow-lg">
          <div className="flex flex-col">

            <CardHeader>
              <CardTitle className="text-center text-xl">
                شبکه خبر ایران  🇮🇷
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              
              {/* LIVE VIDEO */}
              <div className="aspect-video w-full overflow-hidden rounded-lg border bg-black">
              </div>

              {/* simple info */}
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-primary" />
                  <span>پخش زنده ۲۴ ساعته</span>
                </div>


              </div>

            </CardContent>

          </div>
        </Card>
      </div>
    </section>
  );
};