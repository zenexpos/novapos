'use client';

import { useState } from 'react';
import { usePOSStore, Product } from '@/lib/pos-store';
import { generateProductDescription } from '@/ai/flows/generate-product-description';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Sparkles, 
  Loader2,
  Package,
  Search
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProductsPage() {
  const { products, addProduct, updateProduct, removeProduct } = usePOSStore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (product?: Product) => {
    setEditingProduct(product || { 
      name: '', 
      category: '', 
      price: 0, 
      stock: 0, 
      description: '', 
      imageUrl: 'https://picsum.photos/seed/pos/400/400' 
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingProduct?.id) {
      updateProduct(editingProduct as Product);
    } else {
      addProduct({
        ...editingProduct as Product,
        id: Math.random().toString(36).substr(2, 9)
      });
    }
    setIsDialogOpen(false);
    toast({ title: editingProduct?.id ? "Product Updated" : "Product Added" });
  };

  const handleGenerateDescription = async () => {
    if (!editingProduct?.name || !editingProduct?.category) {
      toast({ title: "Name and Category required for AI generation", variant: "destructive" });
      return;
    }
    
    setIsGenerating(true);
    try {
      const result = await generateProductDescription({
        productName: editingProduct.name,
        category: editingProduct.category
      });
      setEditingProduct({ ...editingProduct, description: result.description });
    } catch (error) {
      toast({ title: "Failed to generate description", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <Package className="w-8 h-8" />
            Product Catalog
          </h1>
          <p className="text-muted-foreground">Manage your store inventory and details</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-accent hover:bg-accent/90 px-6 py-6 rounded-xl font-bold">
          <Plus className="mr-2 w-5 h-5" />
          Add New Product
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border p-4">
        <div className="relative w-full max-w-sm mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search by name or category..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-muted"
          />
        </div>

        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                      <span className="font-semibold">{p.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{p.category}</TableCell>
                  <TableCell className="font-bold text-primary">${p.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <span className={p.stock <= 5 ? "text-destructive font-bold" : ""}>
                      {p.stock} units
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(p)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => removeProduct(p.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingProduct?.id ? "Edit Product" : "Add New Product"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Product Name</label>
                <Input 
                  value={editingProduct?.name || ''} 
                  onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                  placeholder="e.g. Premium Espresso"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Input 
                  value={editingProduct?.category || ''} 
                  onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                  placeholder="e.g. Beverages"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price ($)</label>
                  <Input 
                    type="number" 
                    value={editingProduct?.price || 0} 
                    onChange={(e) => setEditingProduct({...editingProduct, price: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Stock</label>
                  <Input 
                    type="number" 
                    value={editingProduct?.stock || 0} 
                    onChange={(e) => setEditingProduct({...editingProduct, stock: Number(e.target.value)})}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Description</label>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="h-auto p-0 text-accent font-bold flex items-center gap-1"
                    onClick={handleGenerateDescription}
                    disabled={isGenerating}
                  >
                    {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    AI Generate
                  </Button>
                </div>
                <Textarea 
                  rows={5}
                  className="resize-none"
                  value={editingProduct?.description || ''} 
                  onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                  placeholder="Product highlights..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Image URL</label>
                <Input 
                  value={editingProduct?.imageUrl || ''} 
                  onChange={(e) => setEditingProduct({...editingProduct, imageUrl: e.target.value})}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 px-8">Save Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
