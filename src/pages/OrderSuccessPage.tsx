// src/pages/OrderSuccessPage.tsx
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const OrderSuccessPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState<{
    reference: string;
    products: any;
    total_amount: number;
    status: string;
    user_email: string;
    shipping_address?: string;
    phone?: string;
    created_at?: string;
    id?: number;
  } | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      const { data, error: _error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      setOrder(data);
    };
    fetchOrder();
  }, [orderId]);

  if (!order) return <div>Loading...</div>;

  return (
    <div>
      <h1>Thank you for your purchase!</h1>
      <p>Order Reference: {order.reference}</p>
      {/* Render order.products, total_amount, etc. */}
    </div>
  );
};

export default OrderSuccessPage;