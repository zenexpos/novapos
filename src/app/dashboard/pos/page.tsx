'use client';

import { useState, useMemo } from 'react';
import { usePOSStore } from '@/lib/pos-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  ChevronRight,
  ShoppingBag,
  Tag
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export default function POSPage() {
  const { products, cart, addToCart, removeFromCart, updateCartQuantity, processTransaction } = usePOSStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [discount, setDiscount] = useState(0);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = Math.max(0, subtotal - discount);

  const handleCheckout = (method: 'cash' | 'card') => {
    processTransaction({
      items: cart,
      subtotal,
      discount,
      total,
      paymentMethod: method,
    });
    setDiscount(0);
    setIsCheckoutOpen(false);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Catalog Area */}
      <div className="flex-1 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <ShoppingBag className="w-8 h-8" />
            NovaPOS Register
          </h1>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Search products..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-none shadow-sm"
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'secondary'}
              onClick={() => setSelectedCategory(cat)}
              className="rounded-full px-6"
            >
              {cat}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
            <Card 
              key={product.id} 
              className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all cursor-pointer group"
              onClick={() => addToCart(product)}
            >
              <div className="aspect-square relative">
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                />
                {product.stock <= 5 && (
                  <Badge variant="destructive" className="absolute top-2 right-2">
                    Low Stock: {product.stock}
                  </Badge>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
                <p className="text-primary font-bold text-xl mt-1">${product.price.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-2">{product.category}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Cart Area */}
      <div className="w-full lg:w-96 bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2">
            Current Order
            <Badge variant="secondary" className="ml-auto">{cart.length} items</Badge>
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4 opacity-50">
              <ShoppingBag className="w-16 h-16" />
              <p className="font-medium">Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-4 group animate-in slide-in-from-right-2 duration-300">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate">{item.name}</h4>
                  <p className="text-primary font-bold text-sm">${item.price.toFixed(2)}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-7 w-7" 
                      onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-7 w-7" 
                      onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-destructive self-start h-8 w-8 hover:bg-destructive/10"
                  onClick={() => removeFromCart(item.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-secondary/30 border-t space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold">${subtotal.toFixed(2)}</span>
          </div>
          
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Tag className="w-4 h-4" />
              <span>Discount</span>
            </div>
            <Input 
              type="number" 
              className="w-24 h-8 text-right font-medium" 
              value={discount} 
              onChange={(e) => setDiscount(Number(e.target.value))}
            />
          </div>

          <Separator />

          <div className="flex justify-between items-center py-2">
            <span className="text-lg font-bold">Total</span>
            <span className="text-3xl font-black text-primary">${total.toFixed(2)}</span>
          </div>

          <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
            <DialogTrigger asChild>
              <Button 
                className="w-full py-7 text-lg font-bold bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20"
                disabled={cart.length === 0}
              >
                Checkout Now
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl">Complete Transaction</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-6">
                <div className="p-6 bg-primary/5 rounded-2xl text-center">
                  <p className="text-muted-foreground mb-1">Total Payable</p>
                  <h3 className="text-5xl font-black text-primary">${total.toFixed(2)}</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-32 flex flex-col gap-3 hover:border-primary hover:bg-primary/5"
                    onClick={() => handleCheckout('cash')}
                  >
                    <div className="p-4 bg-green-100 rounded-full text-green-600">
                      <Banknote className="w-8 h-8" />
                    </div>
                    <span className="font-bold">Cash</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-32 flex flex-col gap-3 hover:border-primary hover:bg-primary/5"
                    onClick={() => handleCheckout('card')}
                  >
                    <div className="p-4 bg-blue-100 rounded-full text-blue-600">
                      <CreditCard className="w-8 h-8" />
                    </div>
                    <span className="font-bold">Card</span>
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" className="w-full" onClick={() => setIsCheckoutOpen(false)}>Cancel</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
