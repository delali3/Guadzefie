// src/components/dashboard/InventoryStatus.tsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  stock: number;
  threshold: number;
}

interface InventoryStatusProps {
  products: Product[];
}

const InventoryStatus: React.FC<InventoryStatusProps> = ({ products }) => {
  // Filter products with low stock
  const lowStockProducts = products.filter(product => product.stock <= product.threshold);
  
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Inventory Status</h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {lowStockProducts.length} items need attention
        </span>
      </div>
      
      {lowStockProducts.length > 0 ? (
        <div className="space-y-4">
          {lowStockProducts.map(product => (
            <div 
              key={product.id}
              className="flex justify-between items-center p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
            >
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-amber-500 mr-3" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Only {product.stock} units left
                  </p>
                </div>
              </div>
              <button className="text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300">
                Restock
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
          All products are well-stocked!
        </p>
      )}
    </div>
  );
};

export default InventoryStatus;