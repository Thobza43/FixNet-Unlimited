import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { 
  Search, 
  ArrowUpRight, 
  Activity, 
  CheckCircle2, 
  Clock, 
  RefreshCcw, 
  Trash2,
  AlertCircle,
  Loader2
} from "lucide-react";

import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetAdminStats, 
  useListAdminOrders,
  useUpdateAdminOrder,
  useDeleteAdminOrder,
  getListAdminOrdersQueryKey,
  getGetAdminStatsQueryKey
} from "@workspace/api-client-react";

import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

// Helper for status badge colors
const getStatusColor = (status: string) => {
  switch (status) {
    case 'Completed': return 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20';
    case 'Processing': return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20';
    case 'Pending': return 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getNetworkColor = (network: string) => {
  switch (network) {
    case 'MTN': return 'text-yellow-500';
    case 'Vodacom': return 'text-red-500';
    case 'Telkom': return 'text-blue-400';
    case 'Cell C': return 'text-orange-500';
    default: return 'text-foreground';
  }
};

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  // order to delete state
  const [orderToDelete, setOrderToDelete] = useState<number | null>(null);

  // APIs
  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: orders, isLoading: ordersLoading } = useListAdminOrders({ 
    search: debouncedSearch || undefined 
  });
  
  const updateOrder = useUpdateAdminOrder();
  const deleteOrder = useDeleteAdminOrder();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleStatusCycle = (id: number, currentStatus: string) => {
    // Cycle: Pending -> Processing -> Completed -> Pending
    const nextStatus = 
      currentStatus === 'Pending' ? 'Processing' : 
      currentStatus === 'Processing' ? 'Completed' : 'Pending';
      
    // Optimistic update setup
    const queryKey = getListAdminOrdersQueryKey({ search: debouncedSearch || undefined });
    
    updateOrder.mutate({
      id,
      data: { status: nextStatus as any }
    }, {
      onSuccess: (updatedOrder) => {
        // Update local cache
        queryClient.setQueryData(queryKey, (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.map((order: any) => 
            order.id === id ? { ...order, status: updatedOrder.status } : order
          );
        });
        
        // Also refresh stats as they've likely changed
        queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
        
        toast({
          title: "Status Updated",
          description: `Order #${id} is now ${nextStatus}`,
        });
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: "Could not update order status.",
        });
      }
    });
  };

  const handleDeleteConfirm = () => {
    if (!orderToDelete) return;
    
    deleteOrder.mutate({ id: orderToDelete }, {
      onSuccess: () => {
        const queryKey = getListAdminOrdersQueryKey({ search: debouncedSearch || undefined });
        
        // Optimistic delete
        queryClient.setQueryData(queryKey, (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.filter((order: any) => order.id !== orderToDelete);
        });
        
        queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
        
        toast({
          title: "Order Deleted",
          description: `Order #${orderToDelete} has been removed.`,
        });
        setOrderToDelete(null);
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Deletion Failed",
          description: "Could not delete order.",
        });
        setOrderToDelete(null);
      }
    });
  };

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
        <div>
          <h1 className="text-3xl font-bold font-mono tracking-tight">DASHBOARD</h1>
          <p className="text-muted-foreground mt-1">Overview and order management</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">
                R{statsLoading ? "..." : stats?.totalRevenue?.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono text-amber-500">
                {statsLoading ? "..." : stats?.pendingOrders}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Processing</CardTitle>
              <RefreshCcw className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono text-blue-500">
                {statsLoading ? "..." : stats?.processingOrders}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono text-emerald-500">
                {statsLoading ? "..." : stats?.completedOrders}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders List */}
        <Card className="border-border/50">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <CardTitle className="text-xl font-mono">LIVE_ORDERS</CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search orders..."
                  className="pl-9 bg-background/50 border-border/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[100px] pl-6">ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Network</TableHead>
                    <TableHead>Voucher Info</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordersLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                        Loading orders...
                      </TableCell>
                    </TableRow>
                  ) : orders?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        <AlertCircle className="h-6 w-6 mx-auto mb-2 opacity-50" />
                        No orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders?.map((order) => (
                      <TableRow key={order.id} className="group border-border/30">
                        <TableCell className="font-mono font-medium pl-6">#{order.id}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{order.phone}</span>
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                              WA: {order.whatsapp}
                              <a 
                                href={`https://wa.me/${order.whatsapp.replace(/\D/g, '')}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="ml-1 text-primary hover:text-primary/80 transition-colors"
                              >
                                <ArrowUpRight className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`font-semibold ${getNetworkColor(order.network)}`}>
                            {order.network}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{order.voucherType}</span>
                            <span className="text-xs font-mono text-muted-foreground tracking-wider">{order.voucherPin}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(order.createdAt), "MMM d, HH:mm")}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className={`h-7 px-2 font-medium ${getStatusColor(order.status)} transition-colors`}
                            onClick={() => handleStatusCycle(order.id, order.status)}
                            disabled={updateOrder.isPending}
                          >
                            {order.status}
                          </Button>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setOrderToDelete(order.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!orderToDelete} onOpenChange={(open) => !open && setOrderToDelete(null)}>
        <AlertDialogContent className="border-destructive/20 bg-card/95 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order #{orderToDelete}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the order from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={deleteOrder.isPending}
            >
              {deleteOrder.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}