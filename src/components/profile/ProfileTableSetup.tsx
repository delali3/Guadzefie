import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { ensureProfilesTable } from '../../lib/migrations';

interface ProfileTableSetupProps {
  onSuccess?: () => void;
}

const ProfileTableSetup: React.FC<ProfileTableSetupProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{success: boolean; message: string} | null>(null);

  const runMigration = async () => {
    setLoading(true);
    
    try {
      // Use the updated migration function for custom auth
      const migrationResult = await ensureProfilesTable();
      setResult(migrationResult);
      
      // Call the success callback if provided and migration was successful
      if (migrationResult.success && onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: `Error: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Profile Table Setup</h3>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        It appears that the profile table doesn't exist in your database yet. This is needed to save your profile information.
      </p>
      
      {result && (
        <div className={`mb-4 p-3 rounded-md ${
          result.success 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
        }`}>
          <div className="flex items-center">
            {result.success ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            <span>{result.message}</span>
          </div>
        </div>
      )}
      
      <button
        type="button"
        onClick={runMigration}
        disabled={loading}
        className="inline-flex items-center px-5 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin h-5 w-5 mr-2" />
            Setting Up...
          </>
        ) : (
          'Set Up Profile Table'
        )}
      </button>
      
      {!result?.success && (
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          If you're not an admin, please ask your database administrator to run the migration script provided in the <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">migrations/create_profiles_table.sql</code> file.
        </p>
      )}
    </div>
  );
};

export default ProfileTableSetup; 