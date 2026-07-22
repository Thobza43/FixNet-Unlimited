import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ShieldCheck, Phone, MapPin, Hash, Check } from "lucide-react";
import fixnetLogo from "@assets/generated_images/fixnet-logo.png";

import { useCreateOrder, useListBundles } from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const NETWORKS = ["MTN", "Vodacom", "Telkom", "Cell C"] as const;
const VOUCHER_TYPES = ["Blu", "OTT", "1Voucher"] as const;

const orderSchema = z.object({
  phone: z.string().min(10, "Valid phone number required"),
  network: z.enum(NETWORKS, { required_error: "Please select a network" }),
  voucherType: z.enum(VOUCHER_TYPES, { required_error: "Please select voucher type" }),
  voucherPin: z.string().min(8, "Valid PIN required").max(30),
  whatsapp: z.string().min(10, "Valid WhatsApp number required for delivery"),
});

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createOrder = useCreateOrder();
  const { data: bundles, isLoading: bundlesLoading } = useListBundles();

  const form = useForm<z.infer<typeof orderSchema>>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      phone: "",
      voucherPin: "",
      whatsapp: "",
    },
  });

  const onSubmit = (values: z.infer<typeof orderSchema>) => {
    createOrder.mutate(
      { data: values },
      {
        onSuccess: (order) => {
          setLocation(`/order/${order.id}`);
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.error || err?.message;
          toast({
            variant: "destructive",
            title: "Submission Failed",
            description: msg || "Please check your details and try again.",
          });
        },
      }
    );
  };

  const activeBundles = bundles?.filter(b => b.active) || [];
  
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col">
      {/* Background elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Header */}
      <header className="w-full p-4 md:p-6 border-b border-border/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={fixnetLogo} alt="FixNet Unlimited" className="w-8 h-8" />
            <span className="font-mono font-bold text-xl tracking-tight">FIXNET<span className="text-primary">_UNLIMITED</span></span>
          </div>
          <div className="flex items-center gap-2 text-xs md:text-sm font-mono text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span className="hidden sm:inline">SECURE ACTIVATION</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8 grid lg:grid-cols-[1fr_450px] gap-8 md:gap-12 mt-4 md:mt-8 z-10 relative">
        
        {/* Left Column - Sales Pitch */}
        <div className="flex flex-col justify-center space-y-8 lg:pr-8">
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-2">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
              Instant Activation Available
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
              UNLIMITED DATA <br/>
              <span className="text-primary font-mono block mt-2 tracking-tighter">R130 / MONTH</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-[400px]">
              No contracts. No fair usage throttle nonsense. Pure unlimited data activated instantly via WhatsApp.
            </p>
          </div>

          <div className="grid gap-4">
            {bundlesLoading ? (
              <div className="h-24 rounded-lg bg-card/30 animate-pulse border border-border/50"></div>
            ) : activeBundles.length > 0 ? (
              activeBundles.map(bundle => (
                <div key={bundle.id} className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card/40 backdrop-blur">
                  <div className="mt-1 h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{bundle.name} - R{bundle.price}</h3>
                    <p className="text-sm text-muted-foreground">{bundle.description || bundle.dataAmount}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-start gap-4 p-4 rounded-lg border border-primary/30 bg-primary/5">
                <div className="mt-1 h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Standard Unlimited - R130</h3>
                  <p className="text-sm text-muted-foreground">Valid for 30 days. No throttling on any network.</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-5 md:p-6 space-y-4">
            <h3 className="font-mono font-bold tracking-tight text-sm text-muted-foreground uppercase">How it works</h3>
            <ul className="space-y-3">
              <li className="flex gap-3 text-sm">
                <span className="text-primary font-bold">01</span>
                <span>Buy a R130 voucher (Blu, OTT, or 1Voucher)</span>
              </li>
              <li className="flex gap-3 text-sm">
                <span className="text-primary font-bold">02</span>
                <span>Submit your details in the secure form</span>
              </li>
              <li className="flex gap-3 text-sm">
                <span className="text-primary font-bold">03</span>
                <span>We activate your unlimited data bundle</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="relative">
          {/* Decorative frame */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent rounded-2xl blur-xl -z-10" />
          
          <Card className="border-border/60 bg-card/80 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
            <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-500 to-primary" />
            <CardContent className="p-6 md:p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Activate Now</h2>
                <p className="text-sm text-muted-foreground mt-1">Submit your voucher details securely</p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile Number</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="082 123 4567" className="pl-9 bg-background/50" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="network"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Network</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-background/50">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {NETWORKS.map(net => (
                                <SelectItem key={net} value={net}>{net}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="voucherType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Voucher Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-background/50">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {VOUCHER_TYPES.map(vt => (
                                <SelectItem key={vt} value={vt}>{vt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="voucherPin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Voucher PIN</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              placeholder="Enter the 16-digit PIN" 
                              className="pl-9 font-mono tracking-widest bg-background/50" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs">
                          Value must be exactly R130.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="whatsapp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="For delivery & support" 
                            className="bg-background/50" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-md font-bold mt-2 hover:shadow-[0_0_15px_hsla(var(--primary),0.5)] transition-all"
                    disabled={createOrder.isPending}
                  >
                    {createOrder.isPending ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      "SUBMIT & ACTIVATE"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="mt-auto border-t border-border/40 py-6 text-center text-sm text-muted-foreground relative z-10">
        <p>© {new Date().getFullYear()} FixNet Unlimited. All rights reserved.</p>
      </footer>
    </div>
  );
}