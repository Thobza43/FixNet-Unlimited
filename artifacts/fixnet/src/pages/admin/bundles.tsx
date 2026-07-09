import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, Edit, Loader2, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { useQueryClient } from "@tanstack/react-query";
import { 
  useListAdminBundles,
  useCreateBundle,
  useUpdateBundle,
  useDeleteBundle,
  getListAdminBundlesQueryKey
} from "@workspace/api-client-react";

import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const bundleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.coerce.number().min(0, "Price must be positive"),
  dataAmount: z.string().min(1, "Data amount is required"),
  description: z.string().optional().default(""),
  active: z.boolean().default(true),
});

type BundleFormValues = z.infer<typeof bundleSchema>;

export default function AdminBundles() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // APIs
  const { data: bundles, isLoading } = useListAdminBundles();
  const createBundle = useCreateBundle();
  const updateBundle = useUpdateBundle();
  const deleteBundle = useDeleteBundle();

  const form = useForm<BundleFormValues>({
    resolver: zodResolver(bundleSchema),
    defaultValues: {
      name: "",
      price: 130,
      dataAmount: "Unlimited",
      description: "",
      active: true,
    },
  });

  const openCreateDialog = () => {
    setEditingId(null);
    form.reset({
      name: "",
      price: 130,
      dataAmount: "Unlimited",
      description: "",
      active: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (bundle: any) => {
    setEditingId(bundle.id);
    form.reset({
      name: bundle.name,
      price: bundle.price,
      dataAmount: bundle.dataAmount,
      description: bundle.description || "",
      active: bundle.active,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (values: BundleFormValues) => {
    const queryKey = getListAdminBundlesQueryKey();

    if (editingId) {
      updateBundle.mutate(
        { id: editingId, data: values },
        {
          onSuccess: (updated) => {
            queryClient.setQueryData(queryKey, (old: any) => 
              old ? old.map((b: any) => b.id === editingId ? updated : b) : old
            );
            toast({ title: "Bundle updated" });
            setIsDialogOpen(false);
          },
          onError: () => toast({ variant: "destructive", title: "Update failed" })
        }
      );
    } else {
      createBundle.mutate(
        { data: values },
        {
          onSuccess: (created) => {
            queryClient.setQueryData(queryKey, (old: any) => 
              old ? [...old, created] : [created]
            );
            toast({ title: "Bundle created" });
            setIsDialogOpen(false);
          },
          onError: () => toast({ variant: "destructive", title: "Creation failed" })
        }
      );
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this bundle?")) return;
    
    deleteBundle.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.setQueryData(getListAdminBundlesQueryKey(), (old: any) => 
            old ? old.filter((b: any) => b.id !== id) : old
          );
          toast({ title: "Bundle deleted" });
        },
        onError: () => toast({ variant: "destructive", title: "Deletion failed" })
      }
    );
  };

  const toggleActive = (id: number, currentActive: boolean) => {
    updateBundle.mutate(
      { id, data: { active: !currentActive } },
      {
        onSuccess: (updated) => {
          queryClient.setQueryData(getListAdminBundlesQueryKey(), (old: any) => 
            old ? old.map((b: any) => b.id === id ? updated : b) : old
          );
          toast({ title: updated.active ? "Bundle activated" : "Bundle deactivated" });
        }
      }
    );
  };

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold font-mono tracking-tight">BUNDLES</h1>
            <p className="text-muted-foreground mt-1">Manage data offerings visible to customers</p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Bundle
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : bundles?.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-lg bg-card/30">
            <Package className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-medium">No bundles configured</h3>
            <p className="text-muted-foreground mb-4">Add your first data bundle to display on the ordering page.</p>
            <Button onClick={openCreateDialog} variant="outline">Create Bundle</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bundles?.map((bundle) => (
              <Card key={bundle.id} className={`border-border/50 transition-opacity ${bundle.active ? '' : 'opacity-60'}`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{bundle.name}</CardTitle>
                      <CardDescription className="font-mono mt-1 text-primary">R{bundle.price}</CardDescription>
                    </div>
                    <Switch 
                      checked={bundle.active} 
                      onCheckedChange={() => toggleActive(bundle.id, bundle.active)} 
                    />
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="font-mono">{bundle.dataAmount}</Badge>
                    {!bundle.active && <Badge variant="secondary">Inactive</Badge>}
                  </div>
                  {bundle.description && (
                    <p className="text-sm text-muted-foreground mt-2">{bundle.description}</p>
                  )}
                </CardContent>
                <CardFooter className="pt-0 flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(bundle)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(bundle.id)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px] border-primary/20">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Bundle" : "Create Bundle"}</DialogTitle>
              <DialogDescription>
                Details shown to customers on the ordering page.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bundle Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Standard Unlimited" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (R)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="dataAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Amount</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Unlimited, 10GB" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief details about fair usage or valid period..." 
                          className="resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active Status</FormLabel>
                        <FormDescription>
                          Visible to customers on the site
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createBundle.isPending || updateBundle.isPending}>
                    {(createBundle.isPending || updateBundle.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingId ? "Save Changes" : "Create Bundle"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}