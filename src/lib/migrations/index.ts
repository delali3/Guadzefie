// Export from main migrations file
import { 
  // checkProfileTable,
  // ensureProfilesTable,
  // checkShippingAddressesTable,
  // ensureShippingAddressesTable,
  // checkDeliveriesTable,
  // ensureDeliveriesTable
} from '../migrations';

// Export functions from our new modules
export { 
  // checkProfileTable,
  // ensureProfilesTable,
  // checkShippingAddressesTable,
  // ensureShippingAddressesTable,
  // checkDeliveriesTable,
  // ensureDeliveriesTable
};

// Export our farm_customers functions
// export * from './farm_customers_table';

// Export product quantity field migration
// export * from './products_quantity_field';

// Export farm settings table migration
// export * from './farm_settings_table'; 

// Export additional_images column migration
export * from './add_additional_images';

// Export is_available column migration
export * from './add_is_available'; 