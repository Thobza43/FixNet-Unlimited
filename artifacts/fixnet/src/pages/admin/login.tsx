import { useState } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useAdminLogin } from "@workspace/api-client-react";
import { Shield, KeyRound, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  password: z.string().min(1, { message: "Password is required" }),
});

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const login = useAdminLogin();
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    login.mutate(
      { data: { password: values.password } },
      {
        onSuccess: (session) => {
          if (session.authenticated) {
            setLocation("/admin");
          } else {
            toast({
              variant: "destructive",
              title: "Access Denied",
              description: "Invalid password provided.",
            });
          }
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Authentication Failed",
            description: "Invalid password or network error.",
          });
          form.reset({ password: "" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* High-tech background noise/glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      
      <Card className="w-full max-w-md border-primary/20 bg-card/60 backdrop-blur-xl shadow-2xl relative z-10">
        <CardHeader className="space-y-4 text-center pb-8 pt-10">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center ring-1 ring-primary/30">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-mono tracking-tight font-bold">
              SYSTEM<span className="text-primary">_ACCESS</span>
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Enter admin password to continue
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pb-10 px-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          className="pl-10 h-12 bg-background/50 border-border font-mono text-lg text-center tracking-widest placeholder:tracking-normal focus-visible:ring-primary/50 focus-visible:border-primary transition-all"
                          autoFocus
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-center" />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full h-12 text-sm font-bold uppercase tracking-wider transition-all duration-300 hover:shadow-[0_0_20px_hsla(var(--primary),0.3)]" 
                disabled={login.isPending}
              >
                {login.isPending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  "Authenticate"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}