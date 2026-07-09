import { useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { format } from "date-fns";
import { 
  CheckCircle2, 
  Clock, 
  Loader2, 
  MessageCircle, 
  RefreshCcw, 
  ShieldCheck, 
  ArrowLeft
} from "lucide-react";

import { useGetOrder, getGetOrderQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const WHATSAPP_NUMBER = "27631165173";

export default function OrderTracking() {
  const [, params] = useRoute("/order/:id");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const orderId = params?.id ? parseInt(params.id, 10) : null;
  
  // Custom polling logic via useEffect to avoid useGetOrder hook polling issues
  const { data: order, isLoading, error } = useGetOrder(orderId as number, {
    query: {
      queryKey: getGetOrderQueryKey(orderId as number),
      enabled: !!orderId,
    }
  });

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!orderId) return;

    // Only poll if not completed
    if (order?.status !== 'Completed') {
      pollTimerRef.current = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(orderId) });
      }, 5000);
    }

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [orderId, order?.status, queryClient]);

  if (!orderId || error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-destructive/10 text-destructive p-4 rounded-full mb-4">
          <ShieldCheck className="h-10 w-10" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          We couldn't find an order with that reference. Please check your link or contact support.
        </p>
        <Button onClick={() => setLocation("/")} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Return Home
        </Button>
      </div>
    );
  }

  if (isLoading && !order) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-mono">RETRIEVING_ORDER_DATA...</p>
      </div>
    );
  }

  // Calculate progress percentage based on status
  const getProgress = () => {
    switch (order?.status) {
      case 'Completed': return 100;
      case 'Processing': return 65;
      case 'Pending': return 15;
      default: return 0;
    }
  };

  const getStatusIcon = () => {
    switch (order?.status) {
      case 'Completed': return <CheckCircle2 className="h-8 w-8 text-emerald-500" />;
      case 'Processing': return <RefreshCcw className="h-8 w-8 text-blue-500 animate-spin-slow" />;
      default: return <Clock className="h-8 w-8 text-amber-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (order?.status) {
      case 'Completed': return "Your unlimited data has been activated successfully.";
      case 'Processing': return "We are currently verifying your voucher and activating your data. This usually takes 2-5 minutes.";
      default: return "Your order has been received and is waiting in the queue for processing.";
    }
  };

  const handleWhatsAppSupport = () => {
    const message = encodeURIComponent(`Hi, I need help with my FixNet order #${order?.id}. Status is currently showing as ${order?.status}.`);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center p-4">
      {/* Dynamic background based on status */}
      <div className={`absolute inset-0 opacity-10 transition-colors duration-1000 ${
        order?.status === 'Completed' ? 'bg-emerald-500' : 
        order?.status === 'Processing' ? 'bg-blue-500' : 'bg-amber-500'
      }`} />
      
      <div className="w-full max-w-lg z-10 space-y-6">
        <div className="text-center space-y-2 mb-8">
          <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground hover:text-foreground" onClick={() => setLocation("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Order Status</h1>
          <p className="font-mono text-muted-foreground">REF: #{order?.id}</p>
        </div>

        <Card className="border-border/60 bg-card/80 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden relative">
          {/* Status color bar top */}
          <div className={`h-2 w-full transition-colors duration-500 ${
            order?.status === 'Completed' ? 'bg-emerald-500' : 
            order?.status === 'Processing' ? 'bg-blue-500' : 'bg-amber-500'
          }`} />
          
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center space-y-6">
              
              <div className={`p-4 rounded-full border-2 border-dashed ${
                order?.status === 'Completed' ? 'border-emerald-500 bg-emerald-500/10' : 
                order?.status === 'Processing' ? 'border-blue-500 bg-blue-500/10' : 'border-amber-500 bg-amber-500/10'
              }`}>
                {getStatusIcon()}
              </div>

              <div>
                <h2 className="text-2xl font-bold uppercase tracking-wider mb-2">
                  {order?.status}
                </h2>
                <p className="text-muted-foreground text-sm max-w-[300px] mx-auto">
                  {getStatusMessage()}
                </p>
              </div>

              <div className="w-full space-y-2 pt-4">
                <div className="flex justify-between text-xs font-mono text-muted-foreground mb-1">
                  <span>RECEIVED</span>
                  <span>ACTIVATED</span>
                </div>
                <Progress value={getProgress()} className="h-2 w-full" />
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="border-border/40 bg-card/50 backdrop-blur-md">
          <CardContent className="p-6">
            <h3 className="font-mono text-sm tracking-wider text-muted-foreground mb-4 uppercase">Order Details</h3>
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div>
                <p className="text-muted-foreground">Network</p>
                <p className="font-medium">{order?.network}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Voucher</p>
                <p className="font-medium">{order?.voucherType}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Submitted</p>
                <p className="font-medium">{order?.createdAt ? format(new Date(order?.createdAt), "HH:mm, MMM d") : '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button 
          variant="outline" 
          className="w-full h-12 border-primary/30 hover:bg-primary/10 hover:text-primary transition-colors"
          onClick={handleWhatsAppSupport}
        >
          <MessageCircle className="mr-2 h-5 w-5" />
          Need Help? Chat on WhatsApp
        </Button>
        
        {order?.status !== 'Completed' && (
          <p className="text-center text-xs text-muted-foreground font-mono flex items-center justify-center gap-2">
            <RefreshCcw className="h-3 w-3 animate-spin" /> Auto-refreshing status...
          </p>
        )}
      </div>
    </div>
  );
}