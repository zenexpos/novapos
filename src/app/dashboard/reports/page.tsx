'use client';

import { usePOSStore } from '@/lib/pos-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  Calendar
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function ReportsPage() {
  const { transactions } = usePOSStore();

  const totalRevenue = transactions.reduce((acc, t) => acc + t.total, 0);
  const totalOrders = transactions.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const itemsSold = transactions.reduce((acc, t) => acc + t.items.reduce((sum, item) => sum + item.quantity, 0), 0);

  const stats = [
    { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100', trend: '+12%' },
    { label: 'Total Orders', value: totalOrders.toString(), icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100', trend: '+5%' },
    { label: 'Avg Order Value', value: `$${avgOrderValue.toFixed(2)}`, icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-100', trend: '-2%' },
    { label: 'Items Sold', value: itemsSold.toString(), icon: Users, color: 'text-orange-600', bg: 'bg-orange-100', trend: '+8%' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <BarChart3 className="w-8 h-8" />
            Operational Insights
          </h1>
          <p className="text-muted-foreground">Detailed summary of your store's performance</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Today: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm overflow-hidden hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className={`flex items-center text-xs font-bold ${stat.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.trend.startsWith('+') ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                  {stat.trend}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <h3 className="text-2xl font-black mt-1">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b px-8 py-6">
          <CardTitle>Recent Transactions</CardTitle>
          <Badge variant="secondary" className="px-4 py-1">Real-time Feed</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-secondary/30">
              <TableRow>
                <TableHead className="px-8">Transaction ID</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right px-8">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No transactions recorded today
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="px-8 font-mono text-xs text-muted-foreground">{t.id}</TableCell>
                    <TableCell>{new Date(t.timestamp).toLocaleTimeString()}</TableCell>
                    <TableCell>
                      {t.items.length} {t.items.length === 1 ? 'item' : 'items'}
                    </TableCell>
                    <TableCell className="font-bold text-primary">${t.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {t.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right px-8">
                      <span className="inline-flex items-center gap-1.5 text-green-600 font-bold text-xs uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
                        Completed
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
