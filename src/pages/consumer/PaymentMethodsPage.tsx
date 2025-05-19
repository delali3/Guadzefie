import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Star, 
  CreditCard,
  Smartphone,
  DollarSign,
  Database,
  Info
} from 'lucide-react';
import { usePaymentMethods, PaymentMethod, NewPaymentMethod } from '../../contexts/PaymentMethodContext';
import { supabase } from '../../lib/supabase';

const PaymentMethodsPage: React.FC = () => {
  const { 
    state: { paymentMethods, loading, error }, 
    fetchPaymentMethods, 
    addPaymentMethod, 
    updatePaymentMethod, 
    deletePaymentMethod, 
    setDefaultPaymentMethod 
  } = usePaymentMethods();

  const [isAddingMethod, setIsAddingMethod] = useState(false);
  const [isEditingMethod, setIsEditingMethod] = useState<number | null>(null);
  const [isMigratingDb, setIsMigratingDb] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{success: boolean; message: string} | null>(null);
  const [formData, setFormData] = useState<NewPaymentMethod>({
    payment_type: 'card',
    provider: '',
    account_name: '',
    account_number: '',
    expiry_date: '',
    is_default: false
  });

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const resetForm = () => {
    setFormData({
      payment_type: 'card',
      provider: '',
      account_name: '',
      account_number: '',
      expiry_date: '',
      is_default: false
    });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await addPaymentMethod(formData);
      if (result) {
        setIsAddingMethod(false);
        resetForm();
      }
    } catch (err) {
      console.error('Error adding payment method:', err);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditingMethod === null) return;
    
    try {
      const result = await updatePaymentMethod(isEditingMethod, formData);
      if (result) {
        setIsEditingMethod(null);
        resetForm();
      }
    } catch (err) {
      console.error('Error updating payment method:', err);
    }
  };

  const handleEdit = (method: PaymentMethod) => {
    setIsEditingMethod(method.id);
    setFormData({
      payment_type: method.payment_type,
      provider: method.provider,
      account_name: method.account_name,
      account_number: method.account_number,
      expiry_date: method.expiry_date || '',
      is_default: method.is_default
    });
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this payment method?')) {
      await deletePaymentMethod(id);
    }
  };

  const handleSetDefault = async (id: number) => {
    await setDefaultPaymentMethod(id);
  };

  // Function to check if error is about missing table
  const isTableNotExistError = (errorMessage: string | null) => {
    return errorMessage?.includes('table does not exist') || 
           errorMessage?.includes('42P01') ||
           errorMessage?.includes('relation "payment_methods" does not exist');
  };

  // Function to run the migration directly
  const runMigration = async () => {
    if (isMigratingDb) return;
    
    setIsMigratingDb(true);
    setMigrationResult(null);
    
    try {
      // SQL for creating the payment_methods table
      const sql = `
        -- Create payment_methods table if it doesn't exist
        CREATE TABLE IF NOT EXISTS payment_methods (
            id SERIAL PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            payment_type VARCHAR(50) NOT NULL,
            provider VARCHAR(100) NOT NULL,
            account_name VARCHAR(255) NOT NULL,
            account_number VARCHAR(255) NOT NULL,
            expiry_date VARCHAR(10),
            is_default BOOLEAN DEFAULT false NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
        );

        -- Create index on user_id for faster lookups
        CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);

        -- Create RLS policies for payment_methods table
        ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

        -- Policy for users to view their own payment methods
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policy WHERE polname = 'Users can view their own payment methods'
          ) THEN
            CREATE POLICY "Users can view their own payment methods" 
              ON payment_methods FOR SELECT 
              USING (user_id::text = (SELECT current_setting('request.jwt.claim.sub', true)));
          END IF;
        END $$;

        -- Policy for users to insert their own payment methods
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policy WHERE polname = 'Users can insert their own payment methods'
          ) THEN
            CREATE POLICY "Users can insert their own payment methods" 
              ON payment_methods FOR INSERT 
              WITH CHECK (user_id::text = (SELECT current_setting('request.jwt.claim.sub', true)));
          END IF;
        END $$;

        -- Policy for users to update their own payment methods
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policy WHERE polname = 'Users can update their own payment methods'
          ) THEN
            CREATE POLICY "Users can update their own payment methods" 
              ON payment_methods FOR UPDATE 
              USING (user_id::text = (SELECT current_setting('request.jwt.claim.sub', true)));
          END IF;
        END $$;

        -- Policy for users to delete their own payment methods
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policy WHERE polname = 'Users can delete their own payment methods'
          ) THEN
            CREATE POLICY "Users can delete their own payment methods" 
              ON payment_methods FOR DELETE 
              USING (user_id::text = (SELECT current_setting('request.jwt.claim.sub', true)));
          END IF;
        END $$;

        -- Make sure only one payment method is default per user
        CREATE OR REPLACE FUNCTION update_default_payment_method()
        RETURNS TRIGGER AS $$
        BEGIN
            IF NEW.is_default = true THEN
                UPDATE payment_methods
                SET is_default = false
                WHERE user_id = NEW.user_id AND id != NEW.id;
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Create trigger to update default payment method if it doesn't exist
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_trigger WHERE tgname = 'update_default_payment_method_trigger'
          ) THEN
            CREATE TRIGGER update_default_payment_method_trigger
            BEFORE INSERT OR UPDATE ON payment_methods
            FOR EACH ROW
            WHEN (NEW.is_default = true)
            EXECUTE FUNCTION update_default_payment_method();
          END IF;
        END $$;
      `;
      
      // Try to execute the migration
      const { error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        if (error.message.includes('function "exec_sql" does not exist')) {
          setMigrationResult({
            success: false,
            message: 'Migration requires admin privileges. Please contact your administrator to run the migration script or use the Supabase dashboard SQL editor.'
          });
        } else {
          setMigrationResult({
            success: false,
            message: `Migration failed: ${error.message}`
          });
        }
      } else {
        setMigrationResult({
          success: true,
          message: 'Migration successful! The payment_methods table has been created.'
        });
        
        // Refresh payment methods after migration
        setTimeout(() => {
          fetchPaymentMethods();
        }, 1000);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMigrationResult({
        success: false,
        message: `Migration error: ${errorMessage}`
      });
    } finally {
      setIsMigratingDb(false);
    }
  };

  const getPaymentMethodIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'card':
        return <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />;
      case 'mobile_money':
        return <Smartphone className="h-6 w-6 text-green-600 dark:text-green-400" />;
      case 'bank_transfer':
        return <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />;
      default:
        return <CreditCard className="h-6 w-6 text-gray-600 dark:text-gray-400" />;
    }
  };

  const formatPaymentMethodType = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'card':
        return 'Credit/Debit Card';
      case 'mobile_money':
        return 'Mobile Money';
      case 'bank_transfer':
        return 'Bank Transfer';
      default:
        return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const renderPaymentMethodForm = (isEditing: boolean = false) => (
    <form onSubmit={isEditing ? handleEditSubmit : handleAddSubmit} className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div className="mb-6 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          {isEditing ? 'Edit Payment Method' : 'Add New Payment Method'}
        </h3>
        <button
          type="button"
          onClick={() => isEditing ? setIsEditingMethod(null) : setIsAddingMethod(false)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Close form"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="mb-4">
        <label htmlFor="payment_type" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          Payment Type
        </label>
        <select
          id="payment_type"
          name="payment_type"
          value={formData.payment_type}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          required
          aria-required="true"
        >
          <option value="card">Credit/Debit Card</option>
          <option value="mobile_money">Mobile Money</option>
          <option value="bank_transfer">Bank Transfer</option>
        </select>
      </div>
      
      <div className="mb-4">
        <label htmlFor="provider" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          Provider
        </label>
        <select
          id="provider"
          name="provider"
          value={formData.provider}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          required
          aria-required="true"
        >
          <option value="">Select Provider</option>
          {formData.payment_type === 'card' && (
            <>
              <option value="visa">Visa</option>
              <option value="mastercard">Mastercard</option>
              <option value="amex">American Express</option>
            </>
          )}
          {formData.payment_type === 'mobile_money' && (
            <>
              <option value="mtn">MTN</option>
              <option value="vodafone">Vodafone</option>
              <option value="airtel">Airtel</option>
            </>
          )}
          {formData.payment_type === 'bank_transfer' && (
            <>
              <option value="ecobank">Ecobank</option>
              <option value="gcb">GCB Bank</option>
              <option value="absa">Absa Bank</option>
              <option value="other">Other Bank</option>
            </>
          )}
        </select>
      </div>
      
      <div className="mb-4">
        <label htmlFor="account_name" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          Account Name
        </label>
        <input
          id="account_name"
          type="text"
          name="account_name"
          value={formData.account_name}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          required
          aria-required="true"
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="account_number" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          {formData.payment_type === 'card' ? 'Card Number (last 4 digits only)' : 
           formData.payment_type === 'mobile_money' ? 'Mobile Number' : 'Account Number'}
        </label>
        <input
          id="account_number"
          type={formData.payment_type === 'mobile_money' ? 'tel' : 'text'}
          name="account_number"
          value={formData.account_number}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          required
          aria-required="true"
          maxLength={formData.payment_type === 'card' ? 4 : undefined}
          placeholder={formData.payment_type === 'card' ? 'Last 4 digits only' : undefined}
        />
      </div>
      
      {formData.payment_type === 'card' && (
        <div className="mb-4">
          <label htmlFor="expiry_date" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Expiry Date (MM/YY)
          </label>
          <input
            id="expiry_date"
            type="text"
            name="expiry_date"
            value={formData.expiry_date || ''}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            required
            aria-required="true"
            placeholder="MM/YY"
            pattern="(0[1-9]|1[0-2])\/[0-9]{2}"
            maxLength={5}
          />
        </div>
      )}
      
      <div className="mb-6">
        <label htmlFor="is_default" className="flex items-center">
          <input
            id="is_default"
            type="checkbox"
            name="is_default"
            checked={formData.is_default}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            aria-label="Set as default payment method"
          />
          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            Set as default payment method
          </span>
        </label>
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => isEditing ? setIsEditingMethod(null) : setIsAddingMethod(false)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {isEditing ? 'Update Payment Method' : 'Save Payment Method'}
        </button>
      </div>
    </form>
  );

  const renderPaymentMethodCard = (method: PaymentMethod) => (
    <div key={method.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-4 relative">
      {method.is_default && (
        <div className="absolute top-4 right-4 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
          <Check size={12} className="mr-1" />
          Default
        </div>
      )}
      
      <div className="flex items-start">
        <div className={`p-3 rounded-full ${
          method.payment_type === 'card' ? 'bg-blue-100 dark:bg-blue-900/30' : 
          method.payment_type === 'mobile_money' ? 'bg-green-100 dark:bg-green-900/30' :
          'bg-purple-100 dark:bg-purple-900/30'
        }`}>
          {getPaymentMethodIcon(method.payment_type)}
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {formatPaymentMethodType(method.payment_type)}
          </h3>
          <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            <p className="capitalize">{method.provider.replace('_', ' ')}</p>
            <p className="mt-1">{method.account_name}</p>
            <p>
              {method.payment_type === 'card' 
                ? `•••• ${method.account_number}` 
                : method.account_number}
            </p>
            {method.payment_type === 'card' && method.expiry_date && (
              <p className="mt-2">Expires {method.expiry_date}</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex justify-end space-x-2">
        {!method.is_default && (
          <button
            onClick={() => handleSetDefault(method.id)}
            className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            aria-label="Set as default payment method"
          >
            <Star size={14} className="mr-1" />
            Set as Default
          </button>
        )}
        <button
          onClick={() => handleEdit(method)}
          className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          aria-label={`Edit payment method ${method.account_name}`}
        >
          <Edit2 size={14} className="mr-1" />
          Edit
        </button>
        <button
          onClick={() => handleDelete(method.id)}
          className="inline-flex items-center px-2.5 py-1.5 border border-red-300 dark:border-red-700 shadow-sm text-xs font-medium rounded text-red-700 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20"
          aria-label={`Delete payment method ${method.account_name}`}
        >
          <Trash2 size={14} className="mr-1" />
          Delete
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumbs */}
      <nav className="flex mb-6 text-sm text-gray-500 dark:text-gray-400">
        <Link to="/consumer" className="hover:text-gray-900 dark:hover:text-white">Dashboard</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-gray-900 dark:text-white">Payment Methods</span>
      </nav>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Methods</h1>
        
        <div className="flex space-x-2">
          {/* Migration button - show if table doesn't exist */}
          {isTableNotExistError(error) && (
            <button
              onClick={runMigration}
              disabled={isMigratingDb}
              className={`inline-flex items-center px-3 py-2 border border-blue-600 rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 ${isMigratingDb ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label="Run database migration"
            >
              <Database size={18} className="mr-1" />
              {isMigratingDb ? 'Running Migration...' : 'Create Payment Methods Table'}
            </button>
          )}
          
          {!isAddingMethod && (
            <button
              onClick={() => setIsAddingMethod(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              aria-label="Add new payment method"
            >
              <Plus size={18} className="mr-2" />
              Add New Payment Method
            </button>
          )}
        </div>
      </div>
      
      {/* Migration result message */}
      {migrationResult && (
        <div className={`mb-4 p-4 rounded-md ${migrationResult.success ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
          {migrationResult.message}
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md flex flex-col">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Error</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                <p>{error}</p>

                {isTableNotExistError(error) && (
                  <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                    <p className="font-medium">Solution:</p>
                    <p>The payment methods table needs to be created in the database.</p>
                    <button
                      onClick={runMigration}
                      disabled={isMigratingDb}
                      className={`mt-3 inline-flex items-center px-2.5 py-1.5 border border-red-300 dark:border-red-800 text-xs font-medium rounded text-red-700 dark:text-red-300 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 ${isMigratingDb ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Database size={14} className="mr-1" />
                      {isMigratingDb ? 'Creating table...' : 'Create payment_methods table'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading state */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your payment methods...</p>
        </div>
      )}
      
      {/* Add/Edit payment method form */}
      {isAddingMethod && renderPaymentMethodForm()}
      {isEditingMethod !== null && renderPaymentMethodForm(true)}
      
      {/* Payment method list */}
      {!loading && !isAddingMethod && isEditingMethod === null && (
        <>
          {paymentMethods.length > 0 ? (
            <div>
              {paymentMethods.map((method) => renderPaymentMethodCard(method))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-8 text-center">
              <div className="mx-auto h-24 w-24 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                <CreditCard className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No Payment Methods Found</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                You don't have any saved payment methods yet.
              </p>
              <button
                onClick={() => setIsAddingMethod(true)}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                aria-label="Add your first payment method"
              >
                <Plus size={18} className="mr-2" />
                Add your first payment method
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PaymentMethodsPage; 